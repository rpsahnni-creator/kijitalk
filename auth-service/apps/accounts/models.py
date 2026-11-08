from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Users sign in with their email; the template's username is derived from it."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email).lower()
        extra.setdefault("username", email)
        user = self.model(email=email, **extra)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("email_verified", True)
        return self._create_user(email, password, **extra)


class User(AbstractUser):
    """
    KijiTalk login account. Learner profiles (class, streak, XP, subscription)
    stay in the Node API's database and are matched by email.
    """

    email = models.EmailField(unique=True, blank=False)
    display_name = models.CharField(max_length=80, default="Learner")
    email_verified = models.BooleanField(default=False)
    google_sub = models.CharField(max_length=64, unique=True, null=True, blank=True)
    # Set when the account was carried over from the old Node-only login.
    migrated_from_legacy = models.BooleanField(default=False)
    # When sessions were last revoked (logout, password change/reset, consent
    # withdrawn). Ends the refresh-token reuse grace window for older tokens.
    sessions_revoked_at = models.DateTimeField(null=True, blank=True)

    # ── Terms & age (DPDP Act 2023) ────────────────────────────────────────
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    terms_version = models.CharField(max_length=20, blank=True, default="")
    age_confirmed = models.BooleanField(default=False)
    is_minor = models.BooleanField(default=False)

    # ── Verifiable parental consent for learners under 18 ──────────────────
    CONSENT_NOT_REQUIRED = "not_required"
    CONSENT_PENDING = "pending"
    CONSENT_GRANTED = "granted"
    CONSENT_DENIED = "denied"
    CONSENT_CHOICES = [
        (CONSENT_NOT_REQUIRED, "Not required (18+)"),
        (CONSENT_PENDING, "Waiting for parent"),
        (CONSENT_GRANTED, "Parent consented"),
        (CONSENT_DENIED, "Parent refused or withdrew"),
    ]
    parent_email = models.EmailField(blank=True, default="")
    parental_consent = models.CharField(max_length=20, choices=CONSENT_CHOICES, default=CONSENT_NOT_REQUIRED)
    parental_consent_at = models.DateTimeField(null=True, blank=True)
    parental_consent_name = models.CharField(max_length=120, blank=True, default="")
    parental_consent_ip = models.GenericIPAddressField(null=True, blank=True)

    @property
    def access_gate(self) -> str:
        """What the learner may do right now: "ok", or the step still blocking them."""
        if not self.terms_accepted_at or not self.age_confirmed:
            return "setup"
        if self.is_minor and self.parental_consent == self.CONSENT_PENDING:
            return "parent_pending"
        if self.is_minor and self.parental_consent == self.CONSENT_DENIED:
            return "parent_denied"
        return "ok"

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
