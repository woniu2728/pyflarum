from django.db import models
from django.utils.text import slugify
from apps.users.models import User


class Discussion(models.Model):
    """
    讨论模型 - 对标Flarum的Discussion模型
    """
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)

    # 作者
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='discussions')

    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_posted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    # 最后发帖用户
    last_posted_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='last_posted_discussions'
    )
    last_post_id = models.IntegerField(null=True, blank=True)
    last_post_number = models.IntegerField(null=True, blank=True)

    # 统计数据
    comment_count = models.IntegerField(default=0)
    participant_count = models.IntegerField(default=0)

    # 第一个帖子
    first_post_id = models.IntegerField(null=True, blank=True)

    # 状态标志
    is_locked = models.BooleanField(default=False)
    is_sticky = models.BooleanField(default=False, db_index=True)
    is_private = models.BooleanField(default=False)

    # 隐藏相关
    hidden_at = models.DateTimeField(null=True, blank=True)
    hidden_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='hidden_discussions'
    )

    # 浏览次数
    view_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'discussions'
        ordering = ['-is_sticky', '-last_posted_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_posted_at']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_sticky', 'last_posted_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # 自动生成slug
        if not self.slug:
            self.slug = slugify(self.title)
            # 确保slug唯一
            original_slug = self.slug
            counter = 1
            while Discussion.objects.filter(slug=self.slug).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)

    @property
    def is_hidden(self):
        """检查讨论是否被隐藏"""
        return self.hidden_at is not None

    def increment_comment_count(self):
        """增加评论数"""
        self.comment_count += 1
        self.save(update_fields=['comment_count'])

    def decrement_comment_count(self):
        """减少评论数"""
        if self.comment_count > 0:
            self.comment_count -= 1
            self.save(update_fields=['comment_count'])

    def increment_view_count(self):
        """增加浏览次数"""
        self.view_count += 1
        self.save(update_fields=['view_count'])


class DiscussionUser(models.Model):
    """
    讨论-用户状态表 - 对标Flarum的discussion_user表
    """
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name='user_states')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='discussion_states')

    # 阅读状态
    last_read_at = models.DateTimeField(null=True, blank=True)
    last_read_post_number = models.IntegerField(default=0)

    # 订阅状态
    is_subscribed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'discussion_user'
        unique_together = [['discussion', 'user']]
        indexes = [
            models.Index(fields=['discussion']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.discussion.title}"
