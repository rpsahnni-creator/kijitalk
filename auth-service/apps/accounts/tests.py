import re
from unittest import mock

import bcrypt
import jwt
import requests
from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.db import connection
from django.test import TestCase, override_settings
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

    def register(self, email="asha@example.com", password=GOOD_PASSWORD, name="Asha", minor=False, parent="", **extra):
        body = {"email": email, "password": password, "display_name": name, "accept_terms": True, "is_minor": minor}
        if parent:
            body["parent_email"] = parent
        return self.client.post("/api/auth/register/", body, format="json", **extra)

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


class TermsAndAgeTests(AuthTestCase):
    def test_register_requires_terms(self):
        res = self.client.post(
            "/api/auth/register/",
            {"email": "x@example.com", "password": GOOD_PASSWORD, "accept_terms": False},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_adult_signup_is_ready_to_use(self):
        res = self.register(**WEB)
        self.assertEqual(decode(res.data["access"])["gate"], "ok")
        user = User.objects.get(email="asha@example.com")
        self.assertIsNotNone(user.terms_accepted_at)
        self.assertEqual(user.parental_consent, User.CONSENT_NOT_REQUIRED)

    def test_minor_needs_a_parent_email_different_from_their_own(self):
        self.assertEqual(self.register(minor=True).status_code, 400)
        self.assertEqual(self.register(minor=True, parent="asha@example.com").status_code, 400)

    def test_legacy_account_must_finish_setup(self):
        self.add_legacy_user("old@example.com", "old-password-1")
        res = self.login(email="old@example.com", password="old-password-1", **WEB)
        self.assertEqual(decode(res.data["access"])["gate"], "setup")

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        bad = self.client.post("/api/auth/account/setup/", {"accept_terms": False, "is_minor": False}, format="json", **WEB)
        self.assertEqual(bad.status_code, 400)
        ok = self.client.post("/api/auth/account/setup/", {"accept_terms": True, "is_minor": False}, format="json", **WEB)
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(decode(ok.data["access"])["gate"], "ok")


class ParentalConsentTests(AuthTestCase):
    def signup_minor(self):
        res = self.register(minor=True, parent="parent@example.com", **WEB)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(decode(res.data["access"])["gate"], "parent_pending")
        consent_mail = [m for m in mail.outbox if m.to == ["parent@example.com"]]
        self.assertEqual(len(consent_mail), 1)
        return re.search(r"parent-consent\?token=(\S+)", consent_mail[0].body).group(1)

    def test_parent_grants_consent(self):
        token = self.signup_minor()

        info = self.client.get("/api/auth/parent-consent/", {"token": token})
        self.assertEqual(info.status_code, 200)
        self.assertEqual(info.data["status"], User.CONSENT_PENDING)
        self.assertEqual(info.data["learnerName"], "Asha")

        missing = self.client.post("/api/auth/parent-consent/", {"token": token, "decision": "grant"}, format="json")
        self.assertEqual(missing.status_code, 400)  # needs a name and the guardian confirmation

        ok = self.client.post(
            "/api/auth/parent-consent/",
            {"token": token, "decision": "grant", "parent_name": "Sunita Sharma", "confirm_guardian": True},
            format="json",
            REMOTE_ADDR="203.0.113.7",
        )
        self.assertEqual(ok.status_code, 200)
        user = User.objects.get(email="asha@example.com")
        self.assertEqual(user.parental_consent, User.CONSENT_GRANTED)
        self.assertEqual(user.parental_consent_name, "Sunita Sharma")
        self.assertEqual(user.parental_consent_ip, "203.0.113.7")
        self.assertEqual(decode(self.refresh(**WEB).data["access"])["gate"], "ok")

    def test_withdrawing_consent_ends_sessions(self):
        token = self.signup_minor()
        self.client.post(
            "/api/auth/parent-consent/",
            {"token": token, "decision": "grant", "parent_name": "Sunita", "confirm_guardian": True},
            format="json",
        )
        session = self.client.cookies[settings.REFRESH_COOKIE_NAME].value
        self.client.post("/api/auth/parent-consent/", {"token": token, "decision": "deny"}, format="json")
        self.assertEqual(User.objects.get(email="asha@example.com").parental_consent, User.CONSENT_DENIED)

        stale = APIClient()
        stale.cookies[settings.REFRESH_COOKIE_NAME] = session
        self.assertEqual(stale.post("/api/auth/token/refresh/", {}, format="json", **WEB).status_code, 401)

    def test_changing_parent_email_invalidates_old_link(self):
        token = self.signup_minor()

        login = self.login(**WEB)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        res = self.client.post(
            "/api/auth/parent-consent/resend/", {"parent_email": "papa@example.com"}, format="json", **WEB
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/parent-consent/", {"token": token}).status_code, 400)

    def test_bad_token(self):
        self.assertEqual(self.client.get("/api/auth/parent-consent/", {"token": "nope"}).status_code, 400)


class AccountDataTests(AuthTestCase):
    def authed(self):
        access = self.register(**WEB).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_export(self):
        self.authed()
        res = self.client.get("/api/auth/account/export/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["account"]["email"], "asha@example.com")
        self.assertIn("termsAcceptedAt", res.data["account"])

    @override_settings(INTERNAL_API_KEY="k" * 40)
    def test_delete_account_wipes_profile_then_login(self):
        self.authed()
        wrong = self.client.post("/api/auth/account/delete/", {"password": "nope", "confirm": "DELETE"}, format="json")
        self.assertEqual(wrong.status_code, 400)
        no_confirm = self.client.post("/api/auth/account/delete/", {"password": GOOD_PASSWORD, "confirm": "ok"}, format="json")
        self.assertEqual(no_confirm.status_code, 400)

        with mock.patch("apps.accounts.views.requests.post") as post:
            post.return_value.raise_for_status.return_value = None
            res = self.client.post(
                "/api/auth/account/delete/", {"password": GOOD_PASSWORD, "confirm": "DELETE"}, format="json"
            )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(post.call_args.kwargs["json"], {"email": "asha@example.com"})
        self.assertEqual(post.call_args.kwargs["headers"], {"X-Internal-Key": "k" * 40})
        self.assertFalse(User.objects.filter(email="asha@example.com").exists())

    @override_settings(INTERNAL_API_KEY="k" * 40)
    def test_delete_keeps_login_when_profile_wipe_fails(self):
        self.authed()
        with mock.patch("apps.accounts.views.requests.post", side_effect=requests.ConnectionError):
            res = self.client.post(
                "/api/auth/account/delete/", {"password": GOOD_PASSWORD, "confirm": "DELETE"}, format="json"
            )
        self.assertEqual(res.status_code, 502)
        self.assertTrue(User.objects.filter(email="asha@example.com").exists())

    @override_settings(INTERNAL_API_KEY="")
    def test_delete_needs_internal_key(self):
        self.authed()
        res = self.client.post("/api/auth/account/delete/", {"password": GOOD_PASSWORD, "confirm": "DELETE"}, format="json")
        self.assertEqual(res.status_code, 503)
