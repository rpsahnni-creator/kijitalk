"""Server-to-server endpoints for the Node API, protected by INTERNAL_API_KEY."""

import hmac

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.db import IntegrityError, transaction
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import _send
from .models import User


def _key_ok(request) -> bool:
    expected = settings.INTERNAL_API_KEY
    given = request.headers.get("X-Internal-Key", "")
    return len(expected) >= 32 and hmac.compare_digest(given, expected)


class InternalView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]
    throttle_classes: list = []

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not _key_ok(request):
            from rest_framework.exceptions import NotAuthenticated

            raise NotAuthenticated()


def send_school_invite(user, school_note: str = "") -> None:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
    _send(
        "KijiTalk — aapke school ne aapka account banaya hai",
        (
            f"Namaste {user.display_name}!\n\n"
            "Aapke school/teacher ne English practice ke liye aapka KijiTalk account banaya hai."
            f"{(' ' + school_note) if school_note else ''}\n\n"
            "Apna password set karne ke liye yeh link kholo (1 ghante tak valid):\n\n"
            f"{link}\n\n"
            f"Link expire ho jaye to yahan naya mangwao: {settings.FRONTEND_URL}/forgot-password\n\n"
            "Pehli baar sign in karne pe aapse Terms aur umar poochi jayegi; 18 se kam ho to parent ki "
            "permission bhi li jayegi.\n\n"
            "— Team KijiTalk"
        ),
        user.email,
    )


class InviteAccountView(InternalView):
    """POST /internal/accounts/invite/ {email, display_name} — create a login for a student a school added."""

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        name = (request.data.get("display_name") or "").strip()[:80] or "Learner"
        if "@" not in email:
            return Response({"error": "valid email required"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"created": False})
        try:
            with transaction.atomic():
                user = User.objects.create_user(email=email, password=None, display_name=name)
        except IntegrityError:
            return Response({"created": False})
        send_school_invite(user)
        return Response({"created": True}, status=status.HTTP_201_CREATED)


ADMIN_ACTIONS = (
    "status",
    "suspend",
    "unsuspend",
    "logout_all",
    "send_password_reset",
    "mark_verified",
    "resend_verification",
    "resend_parent_consent",
    "delete",
)


def admin_account_status(user) -> dict:
    """What support needs to see about a login (never the password hash)."""
    return {
        "exists": True,
        "active": user.is_active,
        "emailVerified": user.email_verified,
        "gate": user.access_gate,
        "isMinor": user.is_minor,
        "parentEmail": user.parent_email or None,
        "parentalConsent": user.parental_consent,
        "parentalConsentAt": user.parental_consent_at,
        "parentalConsentName": user.parental_consent_name or None,
        "termsAcceptedAt": user.terms_accepted_at,
        "termsVersion": user.terms_version or None,
        "hasPassword": user.has_usable_password(),
        "googleLinked": bool(user.google_sub),
        "joinedAt": user.date_joined,
        "lastLoginAt": user.last_login,
        "sessionsRevokedAt": user.sessions_revoked_at,
    }


class AdminAccountView(InternalView):
    """POST /internal/accounts/admin/ {email, action}

    Support actions from the KijiTalk admin panel. The Node API checks the
    admin's identity and writes the audit log; this only applies the change.
    """

    def post(self, request):
        from .emails import send_parent_consent_email, send_password_reset_email, send_verification_email
        from .tokens import revoke_all_sessions

        email = (request.data.get("email") or "").strip().lower()
        action = request.data.get("action")
        if action not in ADMIN_ACTIONS:
            return Response({"error": "unknown action"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email=email).first()
        if user is None:
            if action == "status":
                return Response({"exists": False})
            if action == "delete":
                return Response({"deleted": False, "exists": False})
            return Response({"error": "Is email se koi login nahi hai."}, status=status.HTTP_404_NOT_FOUND)

        if action == "suspend":
            if user.is_active:
                user.is_active = False
                user.save(update_fields=["is_active"])
            revoke_all_sessions(user)
        elif action == "unsuspend":
            if not user.is_active:
                user.is_active = True
                user.save(update_fields=["is_active"])
        elif action == "logout_all":
            revoke_all_sessions(user)
        elif action == "send_password_reset":
            if not user.is_active:
                return Response({"error": "Suspended account ko reset link nahi bhej sakte."}, status=status.HTTP_409_CONFLICT)
            send_password_reset_email(user)
        elif action == "mark_verified":
            if not user.email_verified:
                user.email_verified = True
                user.save(update_fields=["email_verified"])
        elif action == "resend_verification":
            if user.email_verified:
                return Response({"error": "Email pehle se verified hai."}, status=status.HTTP_409_CONFLICT)
            send_verification_email(user)
        elif action == "resend_parent_consent":
            if not (user.is_minor and user.parental_consent == User.CONSENT_PENDING and user.parent_email):
                return Response({"error": "Is account ka parent consent pending nahi hai."}, status=status.HTTP_409_CONFLICT)
            send_parent_consent_email(user)
        elif action == "delete":
            # Node has already erased the learner profile; remove the login.
            revoke_all_sessions(user)
            user.delete()
            return Response({"deleted": True})

        user.refresh_from_db()
        return Response(admin_account_status(user))
