from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from apps.accounts.internal import AdminAccountView, InviteAccountView


def health(_request):
    return JsonResponse({"status": "ok", "service": "kijitalk-auth"})


urlpatterns = [
    path("health/", health),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    # Server-to-server only (X-Internal-Key); never exposed publicly by the proxy.
    path("internal/accounts/invite/", InviteAccountView.as_view()),
    path("internal/accounts/admin/", AdminAccountView.as_view()),
]
