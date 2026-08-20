from django.urls import path
from .views import TelegramStatusView, TelegramWebhookView
urlpatterns = [path("telegram/status/", TelegramStatusView.as_view()), path("telegram/connect/", TelegramStatusView.as_view()), path("telegram/disconnect/", TelegramStatusView.as_view()), path("telegram/webhook/", TelegramWebhookView.as_view())]

