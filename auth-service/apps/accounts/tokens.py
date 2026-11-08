"""Issuing, rotating and revoking JWTs, and the httpOnly refresh cookie."""

from django.conf import settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

MOBILE_CLIENT = "mobile"


def is_mobile(request) -> bool:
    """Mobile apps can't use cookies, so they get the refresh token in the body."""
    return request.headers.get("X-KT-Client", "").lower() == MOBILE_CLIENT


def issue_tokens(user) -> RefreshToken:
    """A new refresh token whose access token carries the profile claims the Node API needs."""
    refresh = RefreshToken.for_user(user)
    refresh["email"] = user.email
    refresh["name"] = user.display_name
    refresh["email_verified"] = user.email_verified
    # The Node API only serves learning features when this is "ok" — see User.access_gate.
    refresh["gate"] = user.access_gate
    return refresh


def _mask_email(email: str) -> str:
    if not email or "@" not in email:
        return ""
    name, domain = email.split("@", 1)
    return f"{name[:2]}{'*' * max(1, len(name) - 2)}@{domain}"


def public_user(user) -> dict:
    return {
        "id": user.pk,
        "email": user.email,
        "displayName": user.display_name,
        "emailVerified": user.email_verified,
        "hasPassword": user.has_usable_password(),
        "gate": user.access_gate,
        "termsAccepted": bool(user.terms_accepted_at),
        "isMinor": user.is_minor,
        "parentalConsent": user.parental_consent,
        "parentEmail": _mask_email(user.parent_email),
    }


def token_payload(request, user, refresh: RefreshToken) -> dict:
    data = {"access": str(refresh.access_token), "user": public_user(user)}
    if is_mobile(request):
        data["refresh"] = str(refresh)
    return data


def set_refresh_cookie(response, refresh: RefreshToken):
    response.set_cookie(
        settings.REFRESH_COOKIE_NAME,
        str(refresh),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response):
    response.delete_cookie(
        settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )


def read_refresh_token(request) -> str | None:
    if is_mobile(request):
        token = request.data.get("refresh") if hasattr(request, "data") else None
        return token or None
    return request.COOKIES.get(settings.REFRESH_COOKIE_NAME)


def revoke_all_sessions(user) -> int:
    """Blacklist every refresh token the user holds — signs them out everywhere."""
    revoked = 0
    for outstanding in OutstandingToken.objects.filter(user=user):
        _, created = BlacklistedToken.objects.get_or_create(token=outstanding)
        revoked += int(created)
    return revoked
