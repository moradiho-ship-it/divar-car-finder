from django.urls import path
from .views import DashboardSummaryView, ScheduledCrawlView
urlpatterns = [path("dashboard/summary/", DashboardSummaryView.as_view()), path("internal/crawl-due/", ScheduledCrawlView.as_view())]
