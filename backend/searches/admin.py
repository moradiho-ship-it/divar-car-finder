from django.contrib import admin
from .models import SearchProfile
@admin.register(SearchProfile)
class SearchProfileAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "brand", "model", "is_active", "last_checked_at")
    list_filter = ("is_active", "brand")

