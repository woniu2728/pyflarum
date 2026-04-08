"""
通知系统API端点
"""
from typing import Optional
from ninja import Router
from django.shortcuts import get_object_or_404

from apps.notifications.models import Notification
from apps.notifications.schemas import (
    NotificationFilterSchema,
    NotificationOutSchema,
    NotificationListSchema,
    NotificationStatsSchema,
)
from apps.notifications.services import NotificationService

router = Router()


@router.get("/notifications", response=NotificationListSchema, tags=["Notifications"])
def list_notifications(
    request,
    is_read: Optional[bool] = None,
    type: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
):
    """
    获取通知列表

    需要认证

    参数:
    - is_read: 是否已读（不传表示全部）
    - type: 通知类型
    - page: 页码
    - limit: 每页数量
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    notifications, total, unread_count = NotificationService.get_notification_list(
        user=request.user,
        is_read=is_read,
        type=type,
        page=page,
        limit=limit,
    )

    return {
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "limit": limit,
        "data": notifications,
    }


@router.get("/notifications/stats", response=NotificationStatsSchema, tags=["Notifications"])
def get_notification_stats(request):
    """
    获取通知统计

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    stats = NotificationService.get_stats(request.user)
    return stats


@router.get("/notifications/{notification_id}", response=NotificationOutSchema, tags=["Notifications"])
def get_notification(request, notification_id: int):
    """
    获取通知详情

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    notification = NotificationService.get_notification_by_id(notification_id, request.user)

    if not notification:
        return router.create_response(
            request,
            {"error": "通知不存在"},
            status=404
        )

    return notification


@router.post("/notifications/{notification_id}/read", tags=["Notifications"])
def mark_notification_as_read(request, notification_id: int):
    """
    标记通知为已读

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    success = NotificationService.mark_as_read(notification_id, request.user)

    if not success:
        return router.create_response(
            request,
            {"error": "通知不存在"},
            status=404
        )

    return {"message": "已标记为已读"}


@router.post("/notifications/read-all", tags=["Notifications"])
def mark_all_as_read(request):
    """
    标记所有通知为已读

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    count = NotificationService.mark_all_as_read(request.user)

    return {"message": f"已标记{count}条通知为已读", "count": count}


@router.delete("/notifications/{notification_id}", tags=["Notifications"])
def delete_notification(request, notification_id: int):
    """
    删除通知

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    success = NotificationService.delete_notification(notification_id, request.user)

    if not success:
        return router.create_response(
            request,
            {"error": "通知不存在"},
            status=404
        )

    return {"message": "通知已删除"}


@router.delete("/notifications/read", tags=["Notifications"])
def delete_all_read(request):
    """
    删除所有已读通知

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    count = NotificationService.delete_all_read(request.user)

    return {"message": f"已删除{count}条已读通知", "count": count}
