"""
搜索功能业务逻辑层
"""
from typing import Optional, List, Tuple, Dict
from django.db.models import Q, Count
from apps.discussions.models import Discussion
from apps.posts.models import Post
from apps.users.models import User


class SearchService:
    """搜索服务"""

    @staticmethod
    def search_all(
        query: str,
        page: int = 1,
        limit: int = 20,
    ) -> Dict:
        """
        全局搜索

        Args:
            query: 搜索关键词
            page: 页码
            limit: 每页数量

        Returns:
            Dict: 搜索结果
        """
        # 搜索讨论
        discussions = SearchService._search_discussions(query, limit=5)

        # 搜索帖子
        posts = SearchService._search_posts(query, limit=5)

        # 搜索用户
        users = SearchService._search_users(query, limit=5)

        total = len(discussions) + len(posts) + len(users)

        return {
            'total': total,
            'page': page,
            'limit': limit,
            'type': 'all',
            'discussions': discussions,
            'posts': posts,
            'users': users,
        }

    @staticmethod
    def search_discussions(
        query: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Discussion], int]:
        """
        搜索讨论

        Args:
            query: 搜索关键词
            page: 页码
            limit: 每页数量

        Returns:
            Tuple[List[Discussion], int]: (讨论列表, 总数)
        """
        discussions = SearchService._search_discussions(query, page, limit)

        # 计算总数
        total = Discussion.objects.filter(
            Q(title__icontains=query) | Q(slug__icontains=query),
            hidden_at__isnull=True
        ).count()

        return discussions, total

    @staticmethod
    def _search_discussions(
        query: str,
        page: int = 1,
        limit: int = 20,
    ) -> List[Discussion]:
        """
        内部方法：搜索讨论

        Args:
            query: 搜索关键词
            page: 页码
            limit: 每页数量

        Returns:
            List[Discussion]: 讨论列表
        """
        queryset = Discussion.objects.filter(
            Q(title__icontains=query) | Q(slug__icontains=query),
            hidden_at__isnull=True
        ).select_related('user', 'last_posted_user')

        # 排序：置顶优先，然后按相关度（评论数、浏览数）
        queryset = queryset.order_by('-is_sticky', '-comment_count', '-view_count')

        # 分页
        offset = (page - 1) * limit
        discussions = list(queryset[offset:offset + limit])

        # 添加摘要
        for discussion in discussions:
            # 获取第一条帖子作为摘要
            if discussion.first_post_id:
                try:
                    first_post = Post.objects.get(id=discussion.first_post_id)
                    discussion.excerpt = first_post.content[:200] + '...' if len(first_post.content) > 200 else first_post.content
                except Post.DoesNotExist:
                    discussion.excerpt = ''
            else:
                discussion.excerpt = ''

        return discussions

    @staticmethod
    def search_posts(
        query: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[Post], int]:
        """
        搜索帖子

        Args:
            query: 搜索关键词
            page: 页码
            limit: 每页数量

        Returns:
            Tuple[List[Post], int]: (帖子列表, 总数)
        """
        posts = SearchService._search_posts(query, page, limit)

        # 计算总数
        total = Post.objects.filter(
            Q(content__icontains=query),
            hidden_at__isnull=True
        ).count()

        return posts, total

    @staticmethod
    def _search_posts(
        query: str,
        page: int = 1,
        limit: int = 20,
    ) -> List[Post]:
        """
        内部方法：搜索帖子

        Args:
            query: 搜索关键词
            page: 页码
            limit: 每页数量

        Returns:
            List[Post]: 帖子列表
        """
        queryset = Post.objects.filter(
            Q(content__icontains=query),
            hidden_at__isnull=True
        ).select_related('user', 'discussion')

        # 排序：按创建时间倒序
        queryset = queryset.order_by('-created_at')

        # 分页
        offset = (page - 1) * limit
        posts = list(queryset[offset:offset + limit])

        # 添加摘要和讨论标题
        for post in posts:
            post.discussion_title = post.discussion.title
            # 高亮关键词周围的内容
            content = post.content
            query_lower = query.lower()
            content_lower = content.lower()

            if query_lower in content_lower:
                index = content_lower.index(query_lower)
                start = max(0, index - 50)
                end = min(len(content), index + len(query) + 50)
                post.excerpt = ('...' if start > 0 else '') + content[start:end] + ('...' if end < len(content) else '')
            else:
                post.excerpt = content[:200] + '...' if len(content) > 200 else content

        return posts

    @staticmethod
    def search_users(
        query: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[User], int]:
        """
        搜索用户

        Args:
            query: 搜索关键词
            page: 页码
            limit: 每页数量

        Returns:
            Tuple[List[User], int]: (用户列表, 总数)
        """
        users = SearchService._search_users(query, page, limit)

        # 计算总数
        total = User.objects.filter(
            Q(username__icontains=query) |
            Q(display_name__icontains=query) |
            Q(bio__icontains=query)
        ).count()

        return users, total

    @staticmethod
    def _search_users(
        query: str,
        page: int = 1,
        limit: int = 20,
    ) -> List[User]:
        """
        内部方法：搜索用户

        Args:
            query: 搜索关键词
            page: 页码
            limit: 每页数量

        Returns:
            List[User]: 用户列表
        """
        queryset = User.objects.filter(
            Q(username__icontains=query) |
            Q(display_name__icontains=query) |
            Q(bio__icontains=query)
        )

        # 排序：按讨论数和评论数
        queryset = queryset.order_by('-discussion_count', '-comment_count')

        # 分页
        offset = (page - 1) * limit
        users = list(queryset[offset:offset + limit])

        return users

    @staticmethod
    def get_search_suggestions(query: str, limit: int = 5) -> List[str]:
        """
        获取搜索建议

        Args:
            query: 搜索关键词
            limit: 返回数量

        Returns:
            List[str]: 建议列表
        """
        suggestions = []

        # 从讨论标题中获取建议
        discussions = Discussion.objects.filter(
            title__icontains=query,
            hidden_at__isnull=True
        ).values_list('title', flat=True)[:limit]

        suggestions.extend(discussions)

        return suggestions[:limit]
