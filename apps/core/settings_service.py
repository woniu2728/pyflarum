"""
论坛设置读取与保存服务
"""
import json

from django.conf import settings

from apps.core.models import Setting


BASIC_SETTINGS_DEFAULTS = {
    "forum_title": "PyFlarum",
    "forum_description": "",
    "welcome_title": "欢迎来到PyFlarum",
    "welcome_message": "这是一个基于Django和Vue 3的现代化论坛",
    "default_locale": "zh-CN",
    "show_language_selector": False,
}

APPEARANCE_SETTINGS_DEFAULTS = {
    "primary_color": "#4d698e",
    "accent_color": "#e74c3c",
    "logo_url": "",
    "favicon_url": "",
    "custom_css": "",
    "custom_header": "",
}

MAIL_SETTINGS_DEFAULTS = {
    "mail_driver": "smtp",
    "mail_host": getattr(settings, "EMAIL_HOST", ""),
    "mail_port": getattr(settings, "EMAIL_PORT", 587),
    "mail_encryption": "tls" if getattr(settings, "EMAIL_USE_TLS", False) else "",
    "mail_username": getattr(settings, "EMAIL_HOST_USER", ""),
    "mail_password": "",
    "mail_from_address": getattr(settings, "DEFAULT_FROM_EMAIL", ""),
    "mail_from_name": "PyFlarum",
}

ADVANCED_SETTINGS_DEFAULTS = {
    "cache_driver": "redis" if "redis" in settings.CACHES.get("default", {}).get("BACKEND", "").lower() else "file",
    "cache_lifetime": 3600,
    "queue_driver": "redis" if "redis" in getattr(settings, "CELERY_BROKER_URL", "") else "sync",
    "queue_enabled": False,
    "maintenance_mode": False,
    "maintenance_message": "论坛正在维护中，请稍后再试...",
    "debug_mode": settings.DEBUG,
    "log_queries": False,
}


def get_setting_group(prefix: str, defaults: dict) -> dict:
    values = defaults.copy()
    stored_settings = Setting.objects.filter(
        key__in=[f"{prefix}.{key}" for key in defaults.keys()]
    )

    for setting in stored_settings:
        key = setting.key.split(".", 1)[1]
        try:
            values[key] = json.loads(setting.value)
        except json.JSONDecodeError:
            values[key] = setting.value

    return values


def save_setting_group(prefix: str, defaults: dict, payload: dict) -> dict:
    values = get_setting_group(prefix, defaults)

    for key in defaults.keys():
        if key not in payload:
            continue

        values[key] = payload[key]
        Setting.objects.update_or_create(
            key=f"{prefix}.{key}",
            defaults={"value": json.dumps(payload[key], ensure_ascii=False)}
        )

    return values


def get_public_forum_settings() -> dict:
    forum_settings = get_setting_group("basic", BASIC_SETTINGS_DEFAULTS)
    forum_settings.update(
        get_setting_group("appearance", APPEARANCE_SETTINGS_DEFAULTS)
    )
    return forum_settings
