"""
标签系统Django Admin配置
"""
from django.contrib import admin
from apps.tags.models import Tag, DiscussionTag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """标签管理"""
    list_display = [
        'id', 'name', 'slug', 'parent', 'position',
        'discussion_count', 'is_hidden', 'is_restricted'
    ]
    list_filter = ['is_hidden', 'is_restricted', 'parent']
    search_fields = ['name', 'slug', 'description']
    readonly_fields = [
        'slug', 'discussion_count', 'last_posted_at',
        'created_at', 'updated_at'
    ]
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'slug', 'description', 'parent')
        }),
        ('样式', {
            'fields': ('color', 'icon', 'background_url')
        }),
        ('设置', {
            'fields': ('position', 'is_hidden', 'is_restricted')
        }),
        ('统计数据', {
            'fields': ('discussion_count', 'last_posted_at', 'last_posted_discussion')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    ordering = ['position', 'name']
    list_editable = ['position', 'is_hidden']


@admin.register(DiscussionTag)
class DiscussionTagAdmin(admin.ModelAdmin):
    """讨论-标签关联管理"""
    list_display = ['id', 'discussion', 'tag', 'created_at']
    list_filter = ['tag', 'created_at']
    search_fields = ['discussion__title', 'tag__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    list_per_page = 50
