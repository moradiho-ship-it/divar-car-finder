import logging
import httpx
from django.conf import settings
from django.utils import timezone
from .models import Notification, TelegramConnection
logger = logging.getLogger(__name__)
FA = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
def fa_number(value): return f"{value:,}".translate(FA)

class TelegramService:
    def notify(self, profile, listing, match):
        if not profile.telegram_enabled or not settings.TELEGRAM_BOT_TOKEN: return None
        connection = TelegramConnection.objects.filter(user=profile.user, is_verified=True).first()
        if not connection: return None
        notification, created = Notification.objects.get_or_create(user=profile.user, listing=listing, channel="telegram", defaults={"search_profile": profile})
        if not created and notification.status == "sent": return notification
        lines = ["🚗 آگهی جدید مطابق جستجوی شما", "", listing.title]
        if listing.price is not None: lines.append(f"💰 قیمت: {fa_number(listing.price)} تومان")
        if listing.year: lines.append(f"📅 سال: {fa_number(listing.year)}")
        if listing.mileage is not None: lines.append(f"🛣 کارکرد: {fa_number(listing.mileage)} کیلومتر")
        if listing.color: lines.append(f"🎨 رنگ: {listing.color}")
        if listing.transmission: lines.append(f"⚙️ گیربکس: {listing.transmission}")
        lines.append(f"🛡 وضعیت شاسی‌ها: {listing.chassis_condition or 'ذکر نشده'}")
        lines.append(f"🚘 بدنه: {listing.body_condition or 'ذکر نشده'}")
        if listing.city: lines.append(f"📍 {listing.city}{'، ' + listing.district if listing.district else ''}")
        lines.extend(["", f"🎯 امتیاز تطابق: {fa_number(match.match_score)}٪"])
        message_text = "\n".join(lines)
        payload = {"chat_id": connection.chat_id, "text": message_text, "reply_markup": {"inline_keyboard": [[{"text": "مشاهده آگهی", "url": listing.url}]]}}
        method = "sendPhoto" if listing.thumbnail_url else "sendMessage"
        if listing.thumbnail_url: payload.update({"photo": listing.thumbnail_url, "caption": payload.pop("text")})
        try:
            response = httpx.post(f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/{method}", json=payload, timeout=15)
            if response.status_code == 400 and method == "sendPhoto":
                logger.warning("telegram_photo_rejected_falling_back listing_id=%s response=%s", listing.id, response.text[:300])
                method = "sendMessage"
                payload = {"chat_id": connection.chat_id, "text": message_text, "reply_markup": {"inline_keyboard": [[{"text": "مشاهده آگهی", "url": listing.url}]]}}
                response = httpx.post(f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/{method}", json=payload, timeout=15)
            response.raise_for_status(); body = response.json()
            notification.status = "sent"; notification.external_message_id = str(body.get("result", {}).get("message_id", "")); notification.sent_at = timezone.now(); notification.error_message = ""
            logger.info("telegram_sent listing_id=%s search_profile_id=%s", listing.id, profile.id)
        except Exception as exc:
            response_text = getattr(locals().get("response"), "text", "")
            notification.status = "failed"; notification.error_message = f"{exc}: {response_text}"[:1000]; notification.retry_count += 1; logger.warning("telegram_failed listing_id=%s", listing.id)
        notification.save(); return notification
