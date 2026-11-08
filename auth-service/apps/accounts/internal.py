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
