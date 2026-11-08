from django.urls import path

from . import views

urlpatterns = [
    path("providers/", views.ProvidersView.as_view(), name="providers"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("google/", views.GoogleLoginView.as_view(), name="google"),
    path("token/refresh/", views.RefreshView.as_view(), name="token_refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    path("password/forgot/", views.ForgotPasswordView.as_view(), name="password_forgot"),
    path("password/reset/", views.ResetPasswordView.as_view(), name="password_reset"),
    path("email/verify/", views.VerifyEmailView.as_view(), name="email_verify"),
    path("email/resend/", views.ResendVerificationView.as_view(), name="email_resend"),
    path("account/setup/", views.AccountSetupView.as_view(), name="account_setup"),
    path("account/export/", views.ExportAccountView.as_view(), name="account_export"),
    path("account/delete/", views.DeleteAccountView.as_view(), name="account_delete"),
    path("parent-consent/", views.ParentConsentView.as_view(), name="parent_consent"),
    path("parent-consent/resend/", views.ParentConsentResendView.as_view(), name="parent_consent_resend"),
]
