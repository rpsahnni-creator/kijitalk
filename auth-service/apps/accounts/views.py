import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from . import emails, legacy
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    GoogleSerializer,
    LoginSerializer,
    LogoutSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    VerifyEmailSerializer,
)
from .tokens import (
    clear_refresh_cookie,
    issue_tokens,
    public_user,
    read_refresh_token,
    revoke_all_sessions,
    set_refresh_cookie,
    token_payload,
)

User = get_user_model()
logger = logging.getLogger(__name__)

INVALID_LOGIN = "Email ya password galat hai."


def _signed_in(request, user, status_code=status.HTTP_200_OK) -> Response:
    update_last_login(None, user)
    refresh = issue_tokens(user)
    response = Response(token_payload(request, user, refresh), status=status_code)
    set_refresh_cookie(response, refresh)
    return response


def _error(message: str, status_code: int) -> Response:
    return Response({"error": message}, status=status_code)


def _client_header_missing(request) -> bool:
    # Cookie-authenticated endpoints require this header. Browsers can only send
    # it cross-origin after a CORS preflight, which blocks forged requests.
    return not request.headers.get("X-KT-Client")


class PublicView(APIView):
    """No bearer auth here: a stale access token must not block sign-in or refresh."""

    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_scope = "auth"


class ProvidersView(PublicView):
    throttle_scope = None

    def get(self, request):
        return Response({"google": bool(settings.GOOGLE_CLIENT_ID), "password": True})


class RegisterView(PublicView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data["email"]

        # An account made before this service exists is claimed by signing in
        # (which checks its old password) — never by registering over it.
        if User.objects.filter(email=email).exists() or legacy.find_legacy_account(email):
            return _error("Is email se pehle se account hai. Sign in karo ya password reset karo.", status.HTTP_409_CONFLICT)

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=data["password"],
                    display_name=(data.get("display_name") or "").strip() or "Learner",
                )
        except IntegrityError:
            return _error("Is email se pehle se account hai. Sign in karo.", status.HTTP_409_CONFLICT)

        emails.send_verification_email(user)
        logger.info("New account registered: %s", user.pk)
        return _signed_in(request, user, status.HTTP_201_CREATED)


class LoginView(PublicView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = User.objects.filter(email=email).first()
        if user is None:
            user = self._migrate_legacy(email, password)
            if user is None:
                return _error(INVALID_LOGIN, status.HTTP_401_UNAUTHORIZED)
        elif not user.is_active:
            return _error(INVALID_LOGIN, status.HTTP_401_UNAUTHORIZED)
        elif not user.check_password(password) and not self._claim_with_legacy_password(user, password):
            return _error(INVALID_LOGIN, status.HTTP_401_UNAUTHORIZED)

        return _signed_in(request, user)

    @staticmethod
    def _claim_with_legacy_password(user, password: str) -> bool:
        """A carried-over account that has no password yet (e.g. someone asked for
        a reset link) still accepts its old password, once."""
        if user.has_usable_password() or not user.migrated_from_legacy:
            return False
        account = legacy.find_legacy_account(user.email)
        if not account or not legacy.legacy_password_matches(password, account["password_hash"]):
            return False
        user.set_password(password)
        user.save(update_fields=["password"])
        return True

    @staticmethod
    def _migrate_legacy(email: str, password: str):
        account = legacy.find_legacy_account(email)
        if not account or not legacy.legacy_password_matches(password, account["password_hash"]):
            return None
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=password,  # re-hashed with Django's hasher
                    display_name=account["display_name"],
                    migrated_from_legacy=True,
                )
        except IntegrityError:
            return User.objects.filter(email=email).first()
        logger.info("Migrated legacy account on first sign-in: %s", user.pk)
        return user


class GoogleLoginView(PublicView):
    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return _error("Google sign-in is server pe set up nahi hai.", status.HTTP_503_SERVICE_UNAVAILABLE)

        serializer = GoogleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            from google.auth.transport import requests as google_requests
            from google.oauth2 import id_token

            claims = id_token.verify_oauth2_token(
                serializer.validated_data["id_token"], google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            return _error("Google sign-in fail ho gaya. Dobara try karo.", status.HTTP_401_UNAUTHORIZED)

        email = (claims.get("email") or "").lower()
        if not email or not claims.get("email_verified"):
            return _error("Google account ka email verified nahi hai.", status.HTTP_401_UNAUTHORIZED)

        user = User.objects.filter(google_sub=claims["sub"]).first() or User.objects.filter(email=email).first()
        if user is None:
            legacy_account = legacy.find_legacy_account(email)
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=None,
                    display_name=(legacy_account or {}).get("display_name") or claims.get("name") or "Learner",
                    email_verified=True,
                    google_sub=claims["sub"],
                    migrated_from_legacy=bool(legacy_account),
                )
        else:
            if not user.is_active:
                return _error(INVALID_LOGIN, status.HTTP_401_UNAUTHORIZED)
            # Google has confirmed the address, so it is verified and linked.
            user.google_sub = user.google_sub or claims["sub"]
            user.email_verified = True
            user.save(update_fields=["google_sub", "email_verified"])

        return _signed_in(request, user)


class RefreshView(PublicView):
    throttle_scope = None

    def post(self, request):
        if _client_header_missing(request):
            return _error("Missing X-KT-Client header.", status.HTTP_400_BAD_REQUEST)

        raw = read_refresh_token(request)
        if not raw:
            return _error("Session khatam ho gaya. Dobara sign in karo.", status.HTTP_401_UNAUTHORIZED)

        try:
            old = RefreshToken(raw)  # verifies signature, expiry and blacklist
            user = User.objects.get(pk=old["user_id"], is_active=True)
            old.blacklist()  # rotation: each refresh token works exactly once
        except (TokenError, KeyError, User.DoesNotExist):
            response = _error("Session khatam ho gaya. Dobara sign in karo.", status.HTTP_401_UNAUTHORIZED)
            clear_refresh_cookie(response)
            return response

        refresh = issue_tokens(user)  # fresh claims, e.g. after email verification
        response = Response(token_payload(request, user, refresh))
        set_refresh_cookie(response, refresh)
        return response


class LogoutView(PublicView):
    throttle_scope = None

    def post(self, request):
        if _client_header_missing(request):
            return _error("Missing X-KT-Client header.", status.HTTP_400_BAD_REQUEST)
        LogoutSerializer(data=request.data).is_valid(raise_exception=True)

        raw = read_refresh_token(request)
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except TokenError:
                pass  # already expired or revoked — logging out is still a success

        response = Response({"message": "Logout ho gaya."})
        clear_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": public_user(request.user)})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "auth"

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user

        # Google-only accounts have no password yet and may set one directly.
        if user.has_usable_password() and not user.check_password(serializer.validated_data.get("old_password") or ""):
            return Response(
                {"error": "Purana password galat hai.", "fields": {"old_password": ["Purana password galat hai."]}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        revoke_all_sessions(user)

        # Keep this device signed in with a brand-new session.
        refresh = issue_tokens(user)
        payload = token_payload(request, user, refresh)
        payload["message"] = "Password badal gaya. Baaki sab devices se logout ho gaya hai."
        response = Response(payload)
        set_refresh_cookie(response, refresh)
        return response


class ForgotPasswordView(PublicView):
    throttle_scope = "email"
    MESSAGE = "Agar is email se account hai, to password reset ka link bhej diya gaya hai."

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email=email, is_active=True).first()
        if user is None:
            account = legacy.find_legacy_account(email)
            if account:
                # Carry the old account over (no usable password yet) so the
                # reset link can give it one.
                user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": email,
                        "display_name": account["display_name"],
                        "migrated_from_legacy": True,
                        "password": "!",  # unusable until reset
                    },
                )

        if user is not None:
            emails.send_password_reset_email(user)

        # Same answer either way, so this can't be used to probe for accounts.
        return Response({"message": self.MESSAGE})


class ResetPasswordView(PublicView):
    INVALID = "Yeh reset link galat hai ya expire ho gaya. Naya link mangwao."

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(data["uid"])), is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return _error(self.INVALID, status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, data["token"]):
            return _error(self.INVALID, status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(data["new_password"], user=user)
        except DjangoValidationError as exc:
            return Response(
                {"error": exc.messages[0], "fields": {"new_password": exc.messages}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(data["new_password"])
        user.email_verified = True  # they just proved they own the inbox
        user.save(update_fields=["password", "email_verified"])
        revoke_all_sessions(user)
        return Response({"message": "Password reset ho gaya. Ab naye password se sign in karo."})


class VerifyEmailView(PublicView):
    INVALID = "Yeh verification link galat hai ya expire ho gaya."

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            claims = emails.read_verification_token(serializer.validated_data["token"])
            user = User.objects.get(pk=claims["uid"], email=claims["email"])
        except signing.SignatureExpired:
            return _error("Yeh link expire ho gaya. App mein jaake naya link mangwao.", status.HTTP_400_BAD_REQUEST)
        except (signing.BadSignature, KeyError, User.DoesNotExist):
            return _error(self.INVALID, status.HTTP_400_BAD_REQUEST)

        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=["email_verified"])
        return Response({"message": "Email verify ho gaya! 🎉", "emailVerified": True})


class ResendVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "email"

    def post(self, request):
        if request.user.email_verified:
            return Response({"message": "Aapka email pehle se verified hai.", "emailVerified": True})
        emails.send_verification_email(request.user)
        return Response({"message": "Verification link bhej diya. Apna inbox check karo."})
