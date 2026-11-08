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
    accept_terms = serializers.BooleanField(required=False, default=False)
    is_minor = serializers.BooleanField(required=False)
    parent_email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    display_name = serializers.CharField(max_length=80, required=False, allow_blank=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, data):
        _check_confirm(data, "password", "password_confirm")
        if not data.get("accept_terms"):
            raise serializers.ValidationError({"accept_terms": "Account banane ke liye Terms aur Privacy Policy accept karo."})
        if data.get("is_minor"):
            parent = (data.get("parent_email") or "").strip().lower()
            if not parent:
                raise serializers.ValidationError({"parent_email": "18 saal se kam ho to parent ka email zaroori hai."})
            if parent == data["email"]:
                raise serializers.ValidationError({"parent_email": "Parent ka email aapke apne email se alag hona chahiye."})
            data["parent_email"] = parent
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


class AgeFieldsMixin(serializers.Serializer):
    """Under-18 learners must name a parent, who is asked for consent (DPDP Act 2023)."""

    is_minor = serializers.BooleanField(required=False)
    parent_email = serializers.EmailField(required=False, allow_blank=True)

    def _validate_age(self, data, own_email: str):
        if data.get("is_minor"):
            parent = (data.get("parent_email") or "").strip().lower()
            if not parent:
                raise serializers.ValidationError({"parent_email": "18 saal se kam ho to parent ka email zaroori hai."})
            if parent == own_email:
                raise serializers.ValidationError({"parent_email": "Parent ka email aapke apne email se alag hona chahiye."})
            data["parent_email"] = parent
        return data


class AccountSetupSerializer(AgeFieldsMixin):
    accept_terms = serializers.BooleanField()
    is_minor = serializers.BooleanField()

    def validate(self, data):
        if not data["accept_terms"]:
            raise serializers.ValidationError({"accept_terms": "Aage badhne ke liye Terms aur Privacy Policy accept karo."})
        return self._validate_age(data, self.context["request"].user.email)


class ParentDecisionSerializer(serializers.Serializer):
    token = serializers.CharField()
    decision = serializers.ChoiceField(choices=["grant", "deny"])
    parent_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    confirm_guardian = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        if data["decision"] == "grant":
            if not (data.get("parent_name") or "").strip():
                raise serializers.ValidationError({"parent_name": "Apna poora naam likho."})
            if not data.get("confirm_guardian"):
                raise serializers.ValidationError(
                    {"confirm_guardian": "Confirm karo ki aap is learner ke parent/legal guardian ho."}
                )
        return data


class ParentResendSerializer(serializers.Serializer):
    parent_email = serializers.EmailField(required=False, allow_blank=True)


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)
    confirm = serializers.CharField()

    def validate_confirm(self, value):
        if value.strip().upper() != "DELETE":
            raise serializers.ValidationError('Confirm karne ke liye "DELETE" likho.')
        return value
