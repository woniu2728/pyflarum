"""
WebSocket路由配置
"""
from django.urls import re_path
from apps.core.consumers import DiscussionConsumer, ForumRealtimeConsumer, NotificationConsumer, OnlineUsersConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/online/$', OnlineUsersConsumer.as_asgi()),
    re_path(r'ws/forum/$', ForumRealtimeConsumer.as_asgi()),
    re_path(r'ws/discussions/(?P<discussion_id>\d+)/$', DiscussionConsumer.as_asgi()),
]
