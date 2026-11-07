from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "service": "kijitalk-auth"})


urlpatterns = [
    path("health/", health),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
]
