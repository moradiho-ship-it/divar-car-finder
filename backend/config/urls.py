from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import MeView
from dashboard.views import HealthView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", TokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/me/", MeView.as_view()), path("api/health/", HealthView.as_view()),
    path("api/", include("searches.urls")), path("api/", include("listings.urls")),
    path("api/", include("crawler.urls")), path("api/", include("notifications.urls")),
    path("api/", include("dashboard.urls")),
]

