import re

import bcrypt
import jwt
from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.db import connection
from django.test import TestCase
from rest_framework.test import APIClient

from .models import User

WEB = {"HTTP_X_KT_CLIENT": "web"}
MOBILE = {"HTTP_X_KT_CLIENT": "mobile"}
GOOD_PASSWORD = "Chai-Samosa-2026"


def decode(access: str) -> dict:
    return jwt.decode(
        access,
        settings.AUTH_JWT_SECRET,
        algorithms=["HS256"],
        audience=settings.JWT_AUDIENCE,
        issuer=settings.JWT_ISSUER,
    )


class AuthTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Stand-in for the Node API's Prisma table that legacy accounts come from.
        with connection.cursor() as cursor:
            cursor.execute(
                'CREATE TABLE IF NOT EXISTS public.users '
                '(email text UNIQUE, "passwordHash" text, "displayName" text, "googleId" text)'
            )

    def setUp(self):
        cache.clear()  # reset rate-limit counters between tests
        self.client = APIClient()

    def register(self, email="asha@example.com", password=GOOD_PASSWORD, name="Asha", **extra):
        return self.client.post(
            "/api/auth/register/", {"email": email, "password": password, "display_name": name}, format="json", **extra
        )

    def login(self, email="asha@example.com", password=GOOD_PASSWORD, **extra):
        return self.client.post("/api/auth/login/", {"email": email, "password": password}, format="json", **extra)

    def refresh(self, **extra):
        return self.client.post("/api/auth/token/refresh/", {}, format="json", **extra)

    def add_legacy_user(self, email, password, name="Old Learner"):
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=4)).decode().replace("$2b$", "$2a$")
        with connection.cursor() as cursor:
            cursor.execute(
                'INSERT INTO public.users (email, "passwordHash", "displayName") VALUES (%s, %s, %s)',
                [email, hashed, name],
            )


class RegisterAndLoginTests(AuthTestCase):
    def test_register_issues_tokens_cookie_and_verification_email(self):
        res = self.register(**WEB)
        self.assertEqual(res.status_code, 201)
        claims = decode(res.data["access"])
        self.assertEqual(claims["email"], "asha@example.com")
        self.assertEqual(claims["name"], "Asha")
        self.assertFalse(claims["email_verified"])
        self.assertEqual(claims["token_type"], "access")
        self.assertNotIn("refresh", res.data)  # web gets it only as a cookie

        cookie = res.cookies[settings.REFRESH_COOKIE_NAME]
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["path"], settings.REFRESH_COOKIE_PATH)

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("/verify-email?token=", mail.outbox[0].body)

    def test_register_rejects_duplicate_and_weak_password(self):
        self.register()
        self.assertEqual(self.register().status_code, 409)
        weak = self.register(email="new@example.com", password="12345678")
        self.assertEqual(weak.status_code, 400)
        self.assertIn("error", weak.data)

    def test_register_cannot_take_over_a_legacy_account(self):
        self.add_legacy_user("old@example.com", "old-password-1")
        self.assertEqual(self.register(email="old@example.com").status_code, 409)

    def test_login(self):
        self.register()
        self.assertEqual(self.login(password="wrong-password").status_code, 401)
        self.assertEqual(self.login(email="nobody@example.com").status_code, 401)
        ok = self.login(email="ASHA@example.com")
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.data["user"]["email"], "asha@example.com")

    def test_legacy_account_is_migrated_on_first_login(self):
        self.add_legacy_user("old@example.com", "old-password-1", name="Ravi")
        self.assertEqual(self.login(email="old@example.com", password="nope").status_code, 401)
        self.assertFalse(User.objects.filter(email="old@example.com").exists())

        res = self.login(email="old@example.com", password="old-password-1")
        self.assertEqual(res.status_code, 200)
        user = User.objects.get(email="old@example.com")
        self.assertTrue(user.migrated_from_legacy)
        self.assertEqual(user.display_name, "Ravi")
        self.assertTrue(user.check_password("old-password-1"))  # now a Django hash
        self.assertEqual(self.login(email="old@example.com", password="old-password-1").status_code, 200)


class RefreshAndLogoutTests(AuthTestCase):
    def test_refresh_rotates_and_old_token_cannot_be_reused(self):
        self.register(**WEB)
        old_cookie = self.client.cookies[settings.REFRESH_COOKIE_NAME].value

        res = self.refresh(**WEB)
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        self.assertNotEqual(self.client.cookies[settings.REFRESH_COOKIE_NAME].value, old_cookie)

        replay = APIClient()
        replay.cookies[settings.REFRESH_COOKIE_NAME] = old_cookie
        self.assertEqual(replay.post("/api/auth/token/refresh/", {}, format="json", **WEB).status_code, 401)

    def test_refresh_requires_client_header(self):
        self.register(**WEB)
        self.assertEqual(self.refresh().status_code, 400)

    def test_mobile_gets_refresh_token_in_body(self):
        res = self.register(**MOBILE)
        refresh = res.data["refresh"]
        client = APIClient()  # no cookies
        rotated = client.post("/api/auth/token/refresh/", {"refresh": refresh}, format="json", **MOBILE)
        self.assertEqual(rotated.status_code, 200)
        self.assertIn("refresh", rotated.data)

    def test_logout_revokes_the_session(self):
        self.register(**WEB)
        cookie = self.client.cookies[settings.REFRESH_COOKIE_NAME].value
        res = self.client.post("/api/auth/logout/", {}, format="json", **WEB)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.cookies[settings.REFRESH_COOKIE_NAME].value, "")

        again = APIClient()
        again.cookies[settings.REFRESH_COOKIE_NAME] = cookie
        self.assertEqual(again.post("/api/auth/token/refresh/", {}, format="json", **WEB).status_code, 401)


class PasswordTests(AuthTestCase):
    def authed(self):
        access = self.register(**WEB).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_change_password_signs_out_other_sessions(self):
        self.authed()
        other_device = self.client.cookies[settings.REFRESH_COOKIE_NAME].value

        wrong = self.client.post(
            "/api/auth/change-password/", {"old_password": "wrong", "new_password": "Naya-Password-99"}, format="json", **WEB
        )
        self.assertEqual(wrong.status_code, 400)

        ok = self.client.post(
            "/api/auth/change-password/", {"old_password": GOOD_PASSWORD, "new_password": "Naya-Password-99"}, format="json", **WEB
        )
        self.assertEqual(ok.status_code, 200)
        self.assertIn("access", ok.data)

        stale = APIClient()
        stale.cookies[settings.REFRESH_COOKIE_NAME] = other_device
        self.assertEqual(stale.post("/api/auth/token/refresh/", {}, format="json", **WEB).status_code, 401)
        self.assertEqual(self.login(password="Naya-Password-99").status_code, 200)

    def test_forgot_and_reset_password(self):
        self.register(**WEB)
        old_session = self.client.cookies[settings.REFRESH_COOKIE_NAME].value
        mail.outbox.clear()

        res = self.client.post("/api/auth/password/forgot/", {"email": "asha@example.com"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        uid, token = re.search(r"reset-password\?uid=([^&\s]+)&token=(\S+)", mail.outbox[0].body).groups()

        weak = self.client.post("/api/auth/password/reset/", {"uid": uid, "token": token, "new_password": "123"}, format="json")
        self.assertEqual(weak.status_code, 400)

        ok = self.client.post(
            "/api/auth/password/reset/", {"uid": uid, "token": token, "new_password": "Reset-Ho-Gaya-7"}, format="json"
        )
        self.assertEqual(ok.status_code, 200)
        self.assertTrue(User.objects.get(email="asha@example.com").email_verified)

        reused = self.client.post(
            "/api/auth/password/reset/", {"uid": uid, "token": token, "new_password": "Another-Pass-88"}, format="json"
        )
        self.assertEqual(reused.status_code, 400)

        stale = APIClient()
        stale.cookies[settings.REFRESH_COOKIE_NAME] = old_session
        self.assertEqual(stale.post("/api/auth/token/refresh/", {}, format="json", **WEB).status_code, 401)
        self.assertEqual(self.login(password="Reset-Ho-Gaya-7").status_code, 200)

    def test_forgot_password_does_not_reveal_accounts(self):
        res = self.client.post("/api/auth/password/forgot/", {"email": "nobody@example.com"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_legacy_account_can_reset_and_still_use_old_password(self):
        self.add_legacy_user("old@example.com", "old-password-1")
        self.client.post("/api/auth/password/forgot/", {"email": "old@example.com"}, format="json")
        self.assertEqual(len(mail.outbox), 1)
        # Asking for a link must not lock them out of their old password.
        self.assertEqual(self.login(email="old@example.com", password="old-password-1").status_code, 200)


class EmailVerificationTests(AuthTestCase):
    def test_verify_email_link(self):
        self.register(**WEB)
        token = re.search(r"verify-email\?token=(\S+)", mail.outbox[0].body).group(1)

        self.assertEqual(self.client.post("/api/auth/email/verify/", {"token": "bad"}, format="json").status_code, 400)
        ok = self.client.post("/api/auth/email/verify/", {"token": token}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertTrue(User.objects.get(email="asha@example.com").email_verified)

        # The next refreshed access token carries the new claim.
        self.assertTrue(decode(self.refresh(**WEB).data["access"])["email_verified"])

    def test_resend_verification(self):
        access = self.register(**WEB).data["access"]
        mail.outbox.clear()
        self.assertEqual(self.client.post("/api/auth/email/resend/").status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(self.client.post("/api/auth/email/resend/").status_code, 200)
        self.assertEqual(len(mail.outbox), 1)


class ProvidersTests(AuthTestCase):
    def test_providers(self):
        res = self.client.get("/api/auth/providers/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["google"], bool(settings.GOOGLE_CLIENT_ID))
