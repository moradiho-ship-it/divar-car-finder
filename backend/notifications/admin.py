from django.contrib import admin
from .models import Notification, TelegramConnection
admin.site.register(Notification); admin.site.register(TelegramConnection)
