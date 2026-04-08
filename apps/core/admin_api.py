"""
管理后台API端点
"""
from ninja import Router, Body
from ninja.security import HttpBearer
from django.shortcuts import get_object_or_404
from typing import List, Dict, Any
from django.db.models import Count
import sys
import functools

from apps.users.models import User, Group, Permission
from apps.discussions.models import Discussion
from apps.posts.models import Post
from apps.tags.models import Tag

router = Router()


class AuthBearer(HttpBearer):
    """JWT认证"""
    def authenticate(self, request, token):
        try:
            from ninja_jwt.authentication import JWTAuth
            jwt_auth = JWTAuth()
            return jwt_auth.authenticate(request, token)
        except Exception:
            return None


def require_staff(func):
    """装饰器：要求管理员权限"""
    @functools.wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.auth or not request.auth.is_staff:
            return router.create_response(
                request,
                {"error": "需要管理员权限"},
                status=403
            )
        return func(request, *args, **kwargs)
    return wrapper


# ==================== 统计数据 ====================

@router.get("/stats", auth=AuthBearer(), tags=["Admin"])
@require_staff
def get_stats(request):
    """获取系统统计数据"""
    return {
        "phpVersion": f"Python {sys.version.split()[0]}",
        "dbDriver": "SQLite/PostgreSQL/MySQL",
        "queueDriver": "sync",
        "sessionDriver": "database",
        "totalUsers": User.objects.count(),
        "totalDiscussions": Discussion.objects.count(),
        "totalPosts": Post.objects.count(),
    }


# ==================== 设置管理 ====================

@router.get("/settings", auth=AuthBearer(), tags=["Admin"])
@require_staff
def get_settings(request):
    """获取论坛设置"""
    from django.conf import settings

    # 这里应该从数据库读取设置，暂时返回默认值
    return {
        "forum_title": getattr(settings, 'FORUM_TITLE', 'PyFlarum'),
        "forum_description": getattr(settings, 'FORUM_DESCRIPTION', ''),
        "welcome_title": "欢迎来到PyFlarum",
        "welcome_message": "这是一个基于Django和Vue 3的现代化论坛",
        "default_locale": "zh-CN",
        "show_language_selector": False,
    }


@router.post("/settings", auth=AuthBearer(), tags=["Admin"])
@require_staff
def save_settings(request, payload: Dict[str, Any] = Body(...)):
    """保存论坛设置"""
    # TODO: 实现设置保存到数据库
    # 可以创建一个Setting模型来存储键值对
    return {"message": "设置保存成功"}


# ==================== 用户组管理 ====================

@router.get("/groups", auth=AuthBearer(), tags=["Admin"])
@require_staff
def list_groups(request):
    """获取用户组列表"""
    groups = Group.objects.all()
    return [
        {
            "id": g.id,
            "name": g.name,
            "name_singular": g.name_singular,
            "name_plural": g.name_plural,
            "color": g.color,
            "icon": g.icon,
            "is_hidden": g.is_hidden,
        }
        for g in groups
    ]


@router.post("/groups", auth=AuthBearer(), tags=["Admin"])
@require_staff
def create_group(request, payload: Dict[str, Any] = Body(...)):
    """创建用户组"""
    group = Group.objects.create(
        name=payload.get('name'),
        name_singular=payload.get('name_singular'),
        name_plural=payload.get('name_plural'),
        color=payload.get('color', '#000000'),
        icon=payload.get('icon', ''),
        is_hidden=payload.get('is_hidden', False),
    )
    return {
        "id": group.id,
        "name": group.name,
        "color": group.color,
    }


# ==================== 权限管理 ====================

@router.get("/permissions", auth=AuthBearer(), tags=["Admin"])
@require_staff
def get_permissions(request):
    """获取权限配置"""
    permissions = Permission.objects.select_related('group').all()

    # 按用户组组织权限
    result = {}
    for perm in permissions:
        group_id = perm.group.id
        if group_id not in result:
            result[group_id] = []
        result[group_id].append(perm.permission)

    return result


@router.post("/permissions", auth=AuthBearer(), tags=["Admin"])
@require_staff
def save_permissions(request, payload: Dict[int, List[str]] = Body(...)):
    """保存权限配置"""
    # 删除所有现有权限
    Permission.objects.all().delete()

    # 创建新权限
    for group_id, permissions in payload.items():
        group = Group.objects.get(id=group_id)
        for permission in permissions:
            Permission.objects.create(
                group=group,
                permission=permission
            )

    return {"message": "权限保存成功"}


# ==================== 用户管理 ====================

@router.get("/users", auth=AuthBearer(), tags=["Admin"])
@require_staff
def list_admin_users(request, page: int = 1, limit: int = 20, q: str = None):
    """获取用户列表（管理后台）"""
    queryset = User.objects.all()

    if q:
        queryset = queryset.filter(username__icontains=q) | queryset.filter(email__icontains=q)

    total = queryset.count()
    offset = (page - 1) * limit
    users = queryset[offset:offset + limit]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "display_name": u.display_name,
                "is_email_confirmed": u.is_email_confirmed,
                "is_staff": u.is_staff,
                "joined_at": u.joined_at,
                "discussion_count": u.discussion_count,
                "comment_count": u.comment_count,
            }
            for u in users
        ]
    }


# ==================== 标签管理 ====================

@router.get("/tags", auth=AuthBearer(), tags=["Admin"])
@require_staff
def list_admin_tags(request):
    """获取标签列表（管理后台）"""
    tags = Tag.objects.all().order_by('position', 'name')

    return [
        {
            "id": tag.id,
            "name": tag.name,
            "slug": tag.slug,
            "description": tag.description,
            "color": tag.color or "#888",
            "icon": tag.icon,
            "position": tag.position,
            "discussion_count": tag.discussion_count,
            "is_hidden": tag.is_hidden,
            "is_restricted": tag.is_restricted,
        }
        for tag in tags
    ]


@router.post("/tags", auth=AuthBearer(), tags=["Admin"])
@require_staff
def create_admin_tag(request, payload: Dict[str, Any] = Body(...)):
    """创建标签"""
    try:
        tag = Tag.objects.create(
            name=payload.get('name'),
            description=payload.get('description', ''),
            color=payload.get('color', '#888'),
            icon=payload.get('icon', ''),
            position=payload.get('position', 0),
            is_hidden=payload.get('is_hidden', False),
            is_restricted=payload.get('is_restricted', False),
        )

        return {
            "id": tag.id,
            "name": tag.name,
            "slug": tag.slug,
            "description": tag.description,
            "color": tag.color,
            "icon": tag.icon,
            "position": tag.position,
            "discussion_count": tag.discussion_count,
            "is_hidden": tag.is_hidden,
            "is_restricted": tag.is_restricted,
        }
    except Exception as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400
        )


@router.put("/tags/{tag_id}", auth=AuthBearer(), tags=["Admin"])
@require_staff
def update_admin_tag(request, tag_id: int, payload: Dict[str, Any] = Body(...)):
    """更新标签"""
    try:
        tag = get_object_or_404(Tag, id=tag_id)

        if 'name' in payload:
            tag.name = payload['name']
        if 'description' in payload:
            tag.description = payload['description']
        if 'color' in payload:
            tag.color = payload['color']
        if 'icon' in payload:
            tag.icon = payload['icon']
        if 'position' in payload:
            tag.position = payload['position']
        if 'is_hidden' in payload:
            tag.is_hidden = payload['is_hidden']
        if 'is_restricted' in payload:
            tag.is_restricted = payload['is_restricted']

        tag.save()

        return {
            "id": tag.id,
            "name": tag.name,
            "slug": tag.slug,
            "description": tag.description,
            "color": tag.color,
            "icon": tag.icon,
            "position": tag.position,
            "discussion_count": tag.discussion_count,
            "is_hidden": tag.is_hidden,
            "is_restricted": tag.is_restricted,
        }
    except Exception as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400
        )


@router.delete("/tags/{tag_id}", auth=AuthBearer(), tags=["Admin"])
@require_staff
def delete_admin_tag(request, tag_id: int):
    """删除标签"""
    tag = get_object_or_404(Tag, id=tag_id)
    tag.delete()

    return {"message": "标签删除成功"}

