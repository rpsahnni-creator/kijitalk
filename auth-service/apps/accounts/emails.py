"""Verification and password-reset emails (Hinglish, matching the app's voice)."""

import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)

VERIFY_SALT = "kijitalk.email-verification"


def make_verification_token(user) -> str:
    return signing.dumps({"uid": user.pk, "email": user.email}, salt=VERIFY_SALT)


def read_verification_token(token: str) -> dict:
    """Raises signing.BadSignature / SignatureExpired when the link is bad or old."""
    return signing.loads(token, salt=VERIFY_SALT, max_age=settings.EMAIL_VERIFICATION_MAX_AGE)


def _send(subject: str, body: str, to: str) -> None:
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to], fail_silently=False)
    except Exception:  # a mail outage must not break sign-up or reset requests
        logger.exception("Could not send '%s' email", subject)


def send_verification_email(user) -> None:
    link = f"{settings.FRONTEND_URL}/verify-email?token={make_verification_token(user)}"
    _send(
        "KijiTalk — apna email verify karo",
        (
            f"Namaste {user.display_name}!\n\n"
            "KijiTalk mein aapka swagat hai. Apna email verify karne ke liye yeh link kholo:\n\n"
            f"{link}\n\n"
            "Yeh link 3 din tak valid hai. Agar aapne account nahi banaya, to is email ko ignore karo.\n\n"
            "— Team KijiTalk"
        ),
        user.email,
    )


def send_password_reset_email(user) -> None:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
    _send(
        "KijiTalk — password reset karo",
        (
            f"Namaste {user.display_name}!\n\n"
            "Aapne password reset karne ki request ki hai. Naya password set karne ke liye yeh link kholo:\n\n"
            f"{link}\n\n"
            "Yeh link 1 ghante tak valid hai aur sirf ek baar kaam karega.\n"
            "Agar yeh request aapne nahi ki, to kuch karne ki zaroorat nahi — aapka password safe hai.\n\n"
            "— Team KijiTalk"
        ),
        user.email,
    )
