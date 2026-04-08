"""
搜索功能API端点
"""
from typing import Optional
from ninja import Router
from apps.core.schemas import (
    SearchQuerySchema,
    SearchResultSchema,
    SearchSuggestionSchema,
    DiscussionSearchResultSchema,
    PostSearchResultSchema,
    UserSearchResultSchema,
)
from apps.core.services import SearchService

router = Router()


@router.get("/search", response=SearchResultSchema, tags=["Search"])
def search(
    request,
    q: str,
    type: str = 'all',
    page: int = 1,
    limit: int = 20,
):
    """
    全局搜索

    参数:
    - q: 搜索关键词
    - type: 搜索类型 (all, discussions, posts, users)
    - page: 页码
    - limit: 每页数量
    """
    if not q or len(q.strip()) == 0:
        return {
            'total': 0,
            'page': page,
            'limit': limit,
            'type': type,
            'discussions': [],
            'posts': [],
            'users': [],
        }

    query = q.strip()

    if type == 'all':
        result = SearchService.search_all(query, page, limit)
        return result

    elif type == 'discussions':
        discussions, total = SearchService.search_discussions(query, page, limit)

        # 构建响应
        discussion_data = []
        for discussion in discussions:
            discussion_data.append({
                'id': discussion.id,
                'title': discussion.title,
                'slug': discussion.slug,
                'user': {
                    'id': discussion.user.id,
                    'username': discussion.user.username,
                    'display_name': discussion.user.display_name,
                    'avatar_url': discussion.user.avatar_url,
                } if discussion.user else None,
                'comment_count': discussion.comment_count,
                'view_count': discussion.view_count,
                'is_sticky': discussion.is_sticky,
                'is_locked': discussion.is_locked,
                'created_at': discussion.created_at,
                'last_posted_at': discussion.last_posted_at,
                'excerpt': discussion.excerpt,
            })

        return {
            'total': total,
            'page': page,
            'limit': limit,
            'type': type,
            'discussions': discussion_data,
            'posts': [],
            'users': [],
        }

    elif type == 'posts':
        posts, total = SearchService.search_posts(query, page, limit)

        # 构建响应
        post_data = []
        for post in posts:
            post_data.append({
                'id': post.id,
                'discussion_id': post.discussion_id,
                'discussion_title': post.discussion_title,
                'number': post.number,
                'user': {
                    'id': post.user.id,
                    'username': post.user.username,
                    'display_name': post.user.display_name,
                    'avatar_url': post.user.avatar_url,
                } if post.user else None,
                'content': post.content,
                'created_at': post.created_at,
                'excerpt': post.excerpt,
            })

        return {
            'total': total,
            'page': page,
            'limit': limit,
            'type': type,
            'discussions': [],
            'posts': post_data,
            'users': [],
        }

    elif type == 'users':
        users, total = SearchService.search_users(query, page, limit)

        return {
            'total': total,
            'page': page,
            'limit': limit,
            'type': type,
            'discussions': [],
            'posts': [],
            'users': users,
        }

    else:
        return router.create_response(
            request,
            {"error": "无效的搜索类型"},
            status=400
        )


@router.get("/search/suggestions", response=SearchSuggestionSchema, tags=["Search"])
def get_search_suggestions(request, q: str, limit: int = 5):
    """
    获取搜索建议

    参数:
    - q: 搜索关键词
    - limit: 返回数量
    """
    if not q or len(q.strip()) == 0:
        return {'suggestions': []}

    suggestions = SearchService.get_search_suggestions(q.strip(), limit)
    return {'suggestions': suggestions}
