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

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
