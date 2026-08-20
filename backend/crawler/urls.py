from rest_framework.routers import DefaultRouter
from .views import CrawlRunViewSet
router = DefaultRouter(); router.register("crawl-runs", CrawlRunViewSet, basename="crawl-run")
urlpatterns = router.urls

