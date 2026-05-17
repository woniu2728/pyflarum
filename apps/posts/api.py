"""
帖子系统API端点
"""
from typing import Optional
from ninja import Router
from django.db.models import Count
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse

from apps.posts.models import Post, PostLike, PostFlag
from apps.posts.schemas import (
    PostCreateSchema,
    PostUpdateSchema,
    PostReportSchema,
    PostFlagResolveSchema,
    PostFilterSchema,
    PostOutSchema,
    PostListSchema,
)
from apps.posts.services import PostService
from apps.tags.services import TagService
from apps.core.audit import log_admin_action
from apps.core.auth import AuthBearer, get_optional_user
from apps.core.forum_resources import serialize_user_payload
from apps.core.forum_registry import get_forum_registry
from apps.core.resource_api import (
    ResourceQueryOptions,
    merge_resource_includes,
    parse_resource_query_options,
)
from apps.core.resource_registry import get_resource_registry
from apps.core.services import PaginationService
from apps.core.api_errors import api_error

router = Router()
RESOURCE_REGISTRY = get_resource_registry()
FORUM_REGISTRY = get_forum_registry()
STREAM_POST_TYPES = FORUM_REGISTRY.get_stream_post_type_codes()


def _serialize_post(post, user=None, resource_options=None):
    resource_options = resource_options or ResourceQueryOptions()
    response = {
        "id": post.id,
        "discussion_id": post.discussion_id,
        "number": post.number,
        "type": post.type,
        "content": post.content,
        "content_html": post.content_html,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "edited_at": post.edited_at,
        "discussion": {
            "id": post.discussion.id,
            "title": post.discussion.title,
            "slug": post.discussion.slug,
        } if getattr(post, "discussion", None) else None,
        "is_hidden": post.is_hidden,
        "approval_status": post.approval_status,
        "approval_note": post.approval_note,
        "like_count": getattr(post, "like_count", 0),
        "is_liked": getattr(post, "is_liked", False),
    }
    response.update(
        RESOURCE_REGISTRY.serialize(
            "post",
            post,
            {"user": user},
            only=resource_options.fields,
            include=merge_resource_includes(("user", "edited_user"), resource_options.includes),
        )
    )
    return response


def _apply_post_resource_preloads(queryset, user=None, resource_options=None):
    resource_options = resource_options or ResourceQueryOptions()
    return RESOURCE_REGISTRY.apply_preload_plan(
        queryset,
        "post",
        {"user": user},
        only=resource_options.fields,
        include=merge_resource_includes(("user", "edited_user"), resource_options.includes),
    )


def _serialize_flag(flag):
    return {
        "id": flag.id,
        "reason": flag.reason,
        "message": flag.message,
        "status": flag.status,
        "created_at": flag.created_at,
        "resolved_at": flag.resolved_at,
        "resolution_note": flag.resolution_note,
        "post": {
            "id": flag.post.id,
            "number": flag.post.number,
            "content": flag.post.content,
            "discussion_id": flag.post.discussion_id,
            "discussion_title": flag.post.discussion.title if flag.post.discussion else "",
            "author": {
                "id": flag.post.user.id,
                "username": flag.post.user.username,
                "display_name": flag.post.user.display_name,
            } if flag.post.user else None,
        },
        "user": {
            "id": flag.user.id,
            "username": flag.user.username,
            "display_name": flag.user.display_name,
        },
        "resolved_by": {
            "id": flag.resolved_by.id,
            "username": flag.resolved_by.username,
            "display_name": flag.resolved_by.display_name,
        } if flag.resolved_by else None,
    }


@router.get("/posts", tags=["Posts"])
def list_all_posts(
    request,
    author: Optional[str] = None,
    user_id: Optional[int] = None,
    page: int = 1,
    limit: int = 20,
):
    """
    获取全站帖子列表

    参数:
    - author: 作者用户名
    - user_id: 作者ID
    - page: 页码
    - limit: 每页数量
    """
    user = get_optional_user(request)
    page, limit = PaginationService.normalize(page, limit)
    resource_options = parse_resource_query_options(request, "post")

    queryset = Post.objects.select_related(
        "discussion",
    ).annotate(
        like_count=Count("likes", distinct=True)
    ).filter(
        type__in=STREAM_POST_TYPES,
    )
    queryset = _apply_post_resource_preloads(queryset, user=user, resource_options=resource_options)

    queryset = PostService.apply_visibility_filters(queryset, user)
    queryset = PostService.annotate_flag_state(queryset, user)
    queryset = TagService.filter_posts_for_user(queryset, user)

    if author:
        queryset = queryset.filter(user__username=author)

    if user_id:
        queryset = queryset.filter(user_id=user_id)

    total = queryset.count()
    start = (page - 1) * limit
    end = start + limit
    posts = list(queryset.order_by("-created_at")[start:end])

    if user:
        liked_post_ids = set(
            PostLike.objects.filter(
                post_id__in=[post.id for post in posts],
                user=user,
            ).values_list("post_id", flat=True)
        )
        for post in posts:
            post.is_liked = post.id in liked_post_ids

    response_payload = {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [_serialize_post(post, user, resource_options=resource_options) for post in posts],
    }
    return JsonResponse(response_payload)


@router.post("/discussions/{discussion_id}/posts", response=PostOutSchema, auth=AuthBearer(), tags=["Posts"])
def create_post(request, discussion_id: int, payload: PostCreateSchema):
    """
    创建帖子（回复讨论）

    需要认证
    """
    try:
        post = PostService.create_post(
            discussion_id=discussion_id,
            content=payload.content,
            user=request.auth,
            reply_to_post_id=payload.reply_to_post_id,
        )
        post.like_count = 0
        post.is_liked = False
        return _serialize_post(post, request.auth)
    except PermissionDenied as e:
        return api_error(str(e), status=403)
    except ValueError as e:
        return api_error(str(e), status=400)


@router.get("/discussions/{discussion_id}/posts", tags=["Posts"])
def list_posts(
    request,
    discussion_id: int,
    page: int = 1,
    limit: int = 20,
    near: Optional[int] = None,
    before: Optional[int] = None,
    after: Optional[int] = None,
):
    """
    获取帖子列表

    参数:
    - page: 页码
    - limit: 每页数量
    """
    user = get_optional_user(request)
    page, limit = PaginationService.normalize(page, limit)
    resource_options = parse_resource_query_options(request, "post")
    try:
        window = PostService.get_post_window(
        discussion_id=discussion_id,
        limit=limit,
        page=page,
        near=near,
        before=before,
        after=after,
        user=user,
        preload=lambda queryset: _apply_post_resource_preloads(
            queryset,
            user=user,
            resource_options=resource_options,
        ),
        )
    except ValueError as error:
        return api_error(str(error), status=400)

    response_payload = {
        "total": window.total,
        "page": window.page,
        "limit": limit,
        "current_start": window.current_start,
        "current_end": window.current_end,
        "has_previous": window.has_previous,
        "has_more": window.has_more,
        "data": [_serialize_post(post, user, resource_options=resource_options) for post in window.posts],
    }
    return JsonResponse(response_payload)


@router.get("/posts/{post_id}", tags=["Posts"])
def get_post(request, post_id: int):
    """
    获取帖子详情
    """
    user = get_optional_user(request)
    resource_options = parse_resource_query_options(request, "post")
    post = PostService.get_post_by_id(
        post_id,
        user,
        preload=lambda queryset: _apply_post_resource_preloads(
            queryset,
            user=user,
            resource_options=resource_options,
        ),
    )

    if not post:
        return api_error("帖子不存在", status=404)

    return JsonResponse(_serialize_post(post, user, resource_options=resource_options))


@router.patch("/posts/{post_id}", response=PostOutSchema, auth=AuthBearer(), tags=["Posts"])
def update_post(request, post_id: int, payload: PostUpdateSchema):
    """
    更新帖子

    需要认证和权限
    """
    try:
        post = PostService.update_post(
            post_id=post_id,
            user=request.auth,
            content=payload.content,
        )

        # 重新获取帖子数据
        post = PostService.get_post_by_id(post.id, request.auth)

        return _serialize_post(post, request.auth)
    except Post.DoesNotExist:
        return api_error("帖子不存在", status=404)
    except PermissionDenied as e:
        return api_error(str(e), status=403)
    except ValueError as e:
        return api_error(str(e), status=400)


@router.delete("/posts/{post_id}", auth=AuthBearer(), tags=["Posts"])
def delete_post(request, post_id: int):
    """
    删除帖子

    需要认证和权限
    """
    try:
        post = Post.objects.select_related("discussion", "user").get(id=post_id)
        snapshot = {
            "discussion_id": post.discussion_id,
            "discussion_title": post.discussion.title if post.discussion else "",
            "number": post.number,
            "author_id": post.user_id,
            "deleted_by_owner": post.user_id == request.auth.id,
        }
        PostService.delete_post(post_id, request.auth)
        if request.auth.is_staff or not snapshot["deleted_by_owner"]:
            log_admin_action(
                request,
                "admin.post.delete",
                target_type="post",
                target_id=post_id,
                data=snapshot,
            )
        return {"message": "帖子已删除"}
    except Post.DoesNotExist:
        return api_error("帖子不存在", status=404)
    except PermissionDenied as e:
        return api_error(str(e), status=403)
    except ValueError as e:
        return api_error(str(e), status=400)


@router.post("/posts/{post_id}/hide", auth=AuthBearer(), tags=["Posts"])
def toggle_hide_post(request, post_id: int):
    try:
        post = Post.objects.select_related("discussion", "user").get(id=post_id)
        next_hidden = post.hidden_at is None
        PostService.set_hidden_state(post, request.auth, next_hidden)
        post.refresh_from_db()
        log_admin_action(
            request,
            "admin.post.hide" if post.hidden_at else "admin.post.restore",
            target_type="post",
            target_id=post.id,
            data={
                "discussion_id": post.discussion_id,
                "discussion_title": post.discussion.title if post.discussion else "",
                "number": post.number,
                "is_hidden": bool(post.hidden_at),
            },
        )
        return {
            "message": "操作成功",
            "is_hidden": bool(post.hidden_at),
        }
    except Post.DoesNotExist:
        return api_error("帖子不存在", status=404)
    except PermissionDenied as e:
        return api_error(str(e), status=403)
    except ValueError as e:
        return api_error(str(e), status=400)


@router.post("/posts/{post_id}/like", auth=AuthBearer(), tags=["Posts"])
def like_post(request, post_id: int):
    """
    点赞帖子

    需要认证
    """
    try:
        PostService.like_post(post_id, request.auth)
        return {"message": "点赞成功"}
    except Post.DoesNotExist:
        return api_error("帖子不存在", status=404)
    except PermissionDenied as e:
        return api_error(str(e), status=403)
    except ValueError as e:
        return api_error(str(e), status=400)


@router.delete("/posts/{post_id}/like", auth=AuthBearer(), tags=["Posts"])
def unlike_post(request, post_id: int):
    """
    取消点赞

    需要认证
    """
    try:
        PostService.unlike_post(post_id, request.auth)
        return {"message": "取消点赞成功"}
    except Post.DoesNotExist:
        return api_error("帖子不存在", status=404)
    except PermissionDenied as e:
        return api_error(str(e), status=403)
    except ValueError as e:
        return api_error(str(e), status=400)


@router.post("/posts/{post_id}/report", auth=AuthBearer(), tags=["Posts"])
def report_post(request, post_id: int, payload: PostReportSchema):
    """举报帖子"""
    try:
        flag = PostService.report_post(
            post_id=post_id,
            user=request.auth,
            reason=payload.reason,
            message=payload.message,
        )
        return _serialize_flag(flag)
    except Post.DoesNotExist:
        return api_error("帖子不存在", status=404)
    except PermissionDenied as e:
        return api_error(str(e), status=403)
    except ValueError as e:
        return api_error(str(e), status=400)


@router.post("/posts/{post_id}/flags/resolve", auth=AuthBearer(), tags=["Posts"])
def resolve_post_flags(request, post_id: int, payload: PostFlagResolveSchema):
    try:
        resolved_count = PostService.resolve_post_flags(
            post_id=post_id,
            admin_user=request.auth,
            status=payload.status,
            resolution_note=payload.resolution_note,
        )
        log_admin_action(
            request,
            "admin.flag.resolve",
            target_type="post",
            target_id=post_id,
            data={
                "status": payload.status,
                "resolved_count": resolved_count,
                "resolution_note": payload.resolution_note,
            },
        )
        post = PostService.get_post_by_id(post_id, request.auth)
        if not post:
            return api_error("帖子不存在", status=404)
        return {
            "message": "举报已处理",
            "resolved_count": resolved_count,
            "post": _serialize_post(post, request.auth),
        }
    except Post.DoesNotExist:
        return api_error("帖子不存在", status=404)
    except PermissionDenied as e:
        return api_error(str(e), status=403)
    except ValueError as e:
        return api_error(str(e), status=400)
