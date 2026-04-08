"""
帖子系统API端点
"""
from typing import Optional
from ninja import Router
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied

from apps.posts.models import Post
from apps.posts.schemas import (
    PostCreateSchema,
    PostUpdateSchema,
    PostFilterSchema,
    PostOutSchema,
    PostListSchema,
)
from apps.posts.services import PostService

router = Router()


@router.post("/discussions/{discussion_id}/posts", response=PostOutSchema, tags=["Posts"])
def create_post(request, discussion_id: int, payload: PostCreateSchema):
    """
    创建帖子（回复讨论）

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    try:
        post = PostService.create_post(
            discussion_id=discussion_id,
            content=payload.content,
            user=request.user,
        )

        # 构建响应
        user = request.user
        response_data = {
            "id": post.id,
            "discussion_id": post.discussion_id,
            "number": post.number,
            "user": {
                "id": post.user.id,
                "username": post.user.username,
                "display_name": post.user.display_name,
                "avatar_url": post.user.avatar_url,
            } if post.user else None,
            "type": post.type,
            "content": post.content,
            "content_html": post.content_html,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "edited_at": post.edited_at,
            "edited_user": None,
            "is_hidden": post.is_hidden,
            "like_count": 0,
            "is_liked": False,
            "can_edit": PostService.can_edit_post(post, user),
            "can_delete": PostService.can_delete_post(post, user),
            "can_like": PostService.can_like_post(post, user),
        }

        return response_data
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400
        )


@router.get("/discussions/{discussion_id}/posts", response=PostListSchema, tags=["Posts"])
def list_posts(
    request,
    discussion_id: int,
    page: int = 1,
    limit: int = 20,
):
    """
    获取帖子列表

    参数:
    - page: 页码
    - limit: 每页数量
    """
    user = request.user if request.user.is_authenticated else None
    posts, total = PostService.get_post_list(
        discussion_id=discussion_id,
        page=page,
        limit=limit,
        user=user,
    )

    # 构建响应
    data = []
    for post in posts:
        post_data = {
            "id": post.id,
            "discussion_id": post.discussion_id,
            "number": post.number,
            "user": {
                "id": post.user.id,
                "username": post.user.username,
                "display_name": post.user.display_name,
                "avatar_url": post.user.avatar_url,
            } if post.user else None,
            "type": post.type,
            "content": post.content,
            "content_html": post.content_html,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "edited_at": post.edited_at,
            "edited_user": {
                "id": post.edited_user.id,
                "username": post.edited_user.username,
                "display_name": post.edited_user.display_name,
                "avatar_url": post.edited_user.avatar_url,
            } if post.edited_user else None,
            "is_hidden": post.is_hidden,
            "like_count": post.like_count,
            "is_liked": post.is_liked,
            "can_edit": PostService.can_edit_post(post, user) if user else False,
            "can_delete": PostService.can_delete_post(post, user) if user else False,
            "can_like": PostService.can_like_post(post, user) if user else False,
        }
        data.append(post_data)

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": data,
    }


@router.get("/posts/{post_id}", response=PostOutSchema, tags=["Posts"])
def get_post(request, post_id: int):
    """
    获取帖子详情
    """
    user = request.user if request.user.is_authenticated else None
    post = PostService.get_post_by_id(post_id, user)

    if not post:
        return router.create_response(
            request,
            {"error": "帖子不存在"},
            status=404
        )

    # 构建响应
    response_data = {
        "id": post.id,
        "discussion_id": post.discussion_id,
        "number": post.number,
        "user": {
            "id": post.user.id,
            "username": post.user.username,
            "display_name": post.user.display_name,
            "avatar_url": post.user.avatar_url,
        } if post.user else None,
        "type": post.type,
        "content": post.content,
        "content_html": post.content_html,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "edited_at": post.edited_at,
        "edited_user": {
            "id": post.edited_user.id,
            "username": post.edited_user.username,
            "display_name": post.edited_user.display_name,
            "avatar_url": post.edited_user.avatar_url,
        } if post.edited_user else None,
        "is_hidden": post.is_hidden,
        "like_count": post.like_count,
        "is_liked": post.is_liked,
        "can_edit": PostService.can_edit_post(post, user) if user else False,
        "can_delete": PostService.can_delete_post(post, user) if user else False,
        "can_like": PostService.can_like_post(post, user) if user else False,
    }

    return response_data


@router.patch("/posts/{post_id}", response=PostOutSchema, tags=["Posts"])
def update_post(request, post_id: int, payload: PostUpdateSchema):
    """
    更新帖子

    需要认证和权限
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    try:
        post = PostService.update_post(
            post_id=post_id,
            user=request.user,
            content=payload.content,
        )

        # 重新获取帖子数据
        post = PostService.get_post_by_id(post.id, request.user)

        # 构建响应
        response_data = {
            "id": post.id,
            "discussion_id": post.discussion_id,
            "number": post.number,
            "user": {
                "id": post.user.id,
                "username": post.user.username,
                "display_name": post.user.display_name,
                "avatar_url": post.user.avatar_url,
            } if post.user else None,
            "type": post.type,
            "content": post.content,
            "content_html": post.content_html,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "edited_at": post.edited_at,
            "edited_user": {
                "id": post.edited_user.id,
                "username": post.edited_user.username,
                "display_name": post.edited_user.display_name,
                "avatar_url": post.edited_user.avatar_url,
            } if post.edited_user else None,
            "is_hidden": post.is_hidden,
            "like_count": post.like_count,
            "is_liked": post.is_liked,
            "can_edit": PostService.can_edit_post(post, request.user),
            "can_delete": PostService.can_delete_post(post, request.user),
            "can_like": PostService.can_like_post(post, request.user),
        }

        return response_data
    except Post.DoesNotExist:
        return router.create_response(
            request,
            {"error": "帖子不存在"},
            status=404
        )
    except PermissionDenied as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=403
        )
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400
        )


@router.delete("/posts/{post_id}", tags=["Posts"])
def delete_post(request, post_id: int):
    """
    删除帖子

    需要认证和权限
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    try:
        PostService.delete_post(post_id, request.user)
        return {"message": "帖子已删除"}
    except Post.DoesNotExist:
        return router.create_response(
            request,
            {"error": "帖子不存在"},
            status=404
        )
    except PermissionDenied as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=403
        )
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400
        )


@router.post("/posts/{post_id}/like", tags=["Posts"])
def like_post(request, post_id: int):
    """
    点赞帖子

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    try:
        PostService.like_post(post_id, request.user)
        return {"message": "点赞成功"}
    except Post.DoesNotExist:
        return router.create_response(
            request,
            {"error": "帖子不存在"},
            status=404
        )
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400
        )


@router.delete("/posts/{post_id}/like", tags=["Posts"])
def unlike_post(request, post_id: int):
    """
    取消点赞

    需要认证
    """
    if not request.user.is_authenticated:
        return router.create_response(
            request,
            {"error": "需要登录"},
            status=401
        )

    try:
        PostService.unlike_post(post_id, request.user)
        return {"message": "取消点赞成功"}
    except Post.DoesNotExist:
        return router.create_response(
            request,
            {"error": "帖子不存在"},
            status=404
        )
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400
        )
