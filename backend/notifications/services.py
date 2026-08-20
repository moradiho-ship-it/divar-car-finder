import json, logging
import httpx
from django.conf import settings
from django.utils import timezone
from .models import Notification, TelegramConnection
logger = logging.getLogger(__name__)
FA = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
def fa_number(value): return f"{value:,}".translate(FA)

class TelegramService:
    def _send_album(self, chat_id, image_urls):
        files, media = {}, []
        for index, url in enumerate(image_urls[:10]):
            image = httpx.get(url, timeout=15, follow_redirects=True)
            image.raise_for_status()
            content_type = image.headers.get("content-type", "image/jpeg").split(";")[0]
            if not content_type.startswith("image/"): continue
            key = f"photo{index}"
            files[key] = (f"{key}.jpg", image.content, content_type)
            media.append({"type": "photo", "media": f"attach://{key}"})
        if not media: return None
        response = httpx.post(
            f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMediaGroup",
            data={"chat_id": chat_id, "media": json.dumps(media)}, files=files, timeout=45,
        )
        response.raise_for_status()
        return response.json()

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
        try:
            response = httpx.post(f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage", json=payload, timeout=15)
            response.raise_for_status(); body = response.json()
            if profile.send_images and listing.image_urls:
                try: self._send_album(connection.chat_id, listing.image_urls)
                except Exception as album_exc: logger.warning("telegram_album_failed listing_id=%s error=%s", listing.id, album_exc)
            notification.status = "sent"; notification.external_message_id = str(body.get("result", {}).get("message_id", "")); notification.sent_at = timezone.now(); notification.error_message = ""
            logger.info("telegram_sent listing_id=%s search_profile_id=%s", listing.id, profile.id)
        except Exception as exc:
            response_text = getattr(locals().get("response"), "text", "")
            notification.status = "failed"; notification.error_message = f"{exc}: {response_text}"[:1000]; notification.retry_count += 1; logger.warning("telegram_failed listing_id=%s", listing.id)
        notification.save(); return notification
