"""
WebSocket工具函数
"""
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from typing import Dict, Any


class WebSocketService:
    """WebSocket服务"""

    @staticmethod
    def send_notification_to_user(user_id: int, notification_data: Dict[Any, Any]):
        """
        发送通知给指定用户

        Args:
            user_id: 用户ID
            notification_data: 通知数据
        """
        channel_layer = get_channel_layer()
        group_name = f'notifications_{user_id}'

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_message',
                'notification': notification_data
            }
        )

    @staticmethod
    def broadcast_user_status(user_id: int, username: str, status: str):
        """
        广播用户状态变化

        Args:
            user_id: 用户ID
            username: 用户名
            status: 状态 (online/offline)
        """
        channel_layer = get_channel_layer()
        group_name = 'online_users'

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'user_status',
                'user_id': user_id,
                'username': username,
                'status': status
            }
        )

    @staticmethod
    def send_typing_indicator(discussion_id: int, user_id: int, username: str, is_typing: bool):
        """
        发送正在输入指示器

        Args:
            discussion_id: 讨论ID
            user_id: 用户ID
            username: 用户名
            is_typing: 是否正在输入
        """
        channel_layer = get_channel_layer()
        group_name = f'discussion_{discussion_id}'

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'typing_indicator',
                'user_id': user_id,
                'username': username,
                'is_typing': is_typing
            }
        )
