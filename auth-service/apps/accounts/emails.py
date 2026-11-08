"""Verification, password-reset and parental-consent emails (Hinglish, matching the app's voice)."""

import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger(__name__)

VERIFY_SALT = "kijitalk.email-verification"
PARENT_SALT = "kijitalk.parental-consent"


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


def make_parent_token(user) -> str:
    return signing.dumps({"uid": user.pk, "parent": user.parent_email}, salt=PARENT_SALT)


def read_parent_token(token: str) -> dict:
    """Raises signing.BadSignature / SignatureExpired when the link is bad or old."""
    return signing.loads(token, salt=PARENT_SALT, max_age=settings.PARENT_CONSENT_MAX_AGE)


def send_parent_consent_email(user) -> None:
    link = f"{settings.FRONTEND_URL}/parent-consent?token={make_parent_token(user)}"
    _send(
        f"KijiTalk — {user.display_name} ke liye aapki permission chahiye",
        (
            "Namaste!\n\n"
            f"{user.display_name} ({user.email}) ne KijiTalk pe English practice ke liye account banaya hai "
            "aur aapko unke parent/guardian ke roop mein bataya hai.\n\n"
            "18 saal se kam umar ke learners ke liye, Digital Personal Data Protection Act 2023 ke hisaab se, "
            "hum aapki permission ke bina unka data use nahi kar sakte.\n\n"
            "Hum kya data rakhte hain: naam, email, class/board/state, practice ki progress, aur AI tutor "
            "ke saath chat/voice practice ke messages — sirf English sikhane ke liye. Hum bachchon ka data "
            "advertising ya tracking ke liye use nahi karte.\n\n"
            "Permission dene ya mana karne ke liye yeh link kholo (30 din valid):\n\n"
            f"{link}\n\n"
            f"Poori jaankari: {settings.FRONTEND_URL}/privacy\n\n"
            "Agar aap is learner ko nahi jaante, to is email ko ignore karo — permission ke bina account "
            "kuch nahi kar payega.\n\n"
            "— Team KijiTalk"
        ),
        user.parent_email,
    )


def send_parent_decision_email(user) -> None:
    granted = user.parental_consent == user.CONSENT_GRANTED
    manage = f"{settings.FRONTEND_URL}/parent-consent?token={make_parent_token(user)}"
    if granted:
        middle = (
            f"Aapne {user.display_name} ko KijiTalk use karne ki permission di hai. Shukriya!\n\n"
            "Aap kabhi bhi yeh permission wapas le sakte ho (isse account band ho jayega):\n"
        )
    else:
        middle = (
            f"Aapne {user.display_name} ke liye permission nahi di, isliye unka account kuch bhi use nahi "
            "kar payega.\n\nAgar aap apna faisla badalna chahte ho:\n"
        )
    _send(
        "KijiTalk — aapka faisla record ho gaya",
        f"Namaste!\n\n{middle}{manage}\n\n(Yeh link 30 din valid hai.)\n\n— Team KijiTalk",
        user.parent_email,
    )
