from rest_framework.routers import DefaultRouter
from .views import SearchProfileViewSet
router = DefaultRouter(); router.register("searches", SearchProfileViewSet, basename="search")
urlpatterns = router.urls

