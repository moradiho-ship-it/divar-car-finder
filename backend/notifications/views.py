from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .models import TelegramConnection
class TelegramStatusView(APIView):
    def get(self, request):
        c = TelegramConnection.objects.filter(user=request.user).first()
        return Response({"connected": bool(c and c.is_verified), "username": c.username if c else "", "connected_at": c.connected_at if c else None})
    def post(self, request):
        c, _ = TelegramConnection.objects.get_or_create(user=request.user); token = c.issue_token()
        username = settings.TELEGRAM_BOT_USERNAME
        return Response({"expires_in": 900, "deep_link": f"https://t.me/{username}?start={token}" if username else "", "token": token})
    def delete(self, request): TelegramConnection.objects.filter(user=request.user).delete(); return Response(status=204)
class TelegramWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        msg = request.data.get("message", {}); text = msg.get("text", "")
        if not text.startswith("/start "): return Response({"ok": True})
        token = text.split(maxsplit=1)[1]; chat = msg.get("chat", {})
        for c in TelegramConnection.objects.filter(is_verified=False, verification_expires_at__isnull=False):
            if c.verify(token, chat.get("id"), chat.get("username", "")): return Response({"ok": True})
        return Response({"ok": False}, status=status.HTTP_400_BAD_REQUEST)

