from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


def _check_confirm(data: dict, field: str, confirm_field: str) -> None:
    confirm = data.get(confirm_field)
    if confirm is not None and confirm != data[field]:
        raise serializers.ValidationError({confirm_field: "Dono password match nahi kar rahe."})


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    display_name = serializers.CharField(max_length=80, required=False, allow_blank=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, data):
        _check_confirm(data, "password", "password_confirm")
        candidate = User(email=data["email"], display_name=data.get("display_name") or "Learner")
        validate_password(data["password"], user=candidate)
        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return value.strip().lower()


class GoogleSerializer(serializers.Serializer):
    id_token = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=False, allow_blank=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, required=False, trim_whitespace=False)

    def validate(self, data):
        _check_confirm(data, "new_password", "new_password_confirm")
        validate_password(data["new_password"], user=self.context["request"].user)
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, required=False, trim_whitespace=False)

    def validate(self, data):
        _check_confirm(data, "new_password", "new_password_confirm")
        return data


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    # Only mobile sends it; web relies on the httpOnly cookie.
    refresh = serializers.CharField(required=False)
