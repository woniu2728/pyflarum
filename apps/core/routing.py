"""
WebSocket路由配置
"""
from django.urls import re_path
from apps.core.consumers import NotificationConsumer, OnlineUsersConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/online/$', OnlineUsersConsumer.as_asgi()),
]
