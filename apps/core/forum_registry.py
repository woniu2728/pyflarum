from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Tuple

from apps.core.version import APP_VERSION


@dataclass(frozen=True)
class PermissionDefinition:
    code: str
    label: str
    section: str
    section_label: str
    module_id: str
    icon: str = "fas fa-key"
    description: str = ""
    aliases: Tuple[str, ...] = ()
    required_permissions: Tuple[str, ...] = ()


@dataclass(frozen=True)
class AdminPageDefinition:
    path: str
    label: str
    icon: str
    module_id: str
    nav_section: str = "feature"
    description: str = ""


@dataclass(frozen=True)
class ForumModuleDefinition:
    module_id: str
    name: str
    description: str
    version: str = APP_VERSION
    category: str = "feature"
    is_core: bool = False
    enabled: bool = True
    dependencies: Tuple[str, ...] = ()
    permissions: Tuple[PermissionDefinition, ...] = ()
    admin_pages: Tuple[AdminPageDefinition, ...] = ()
    capabilities: Tuple[str, ...] = ()


class ForumRegistry:
    def __init__(self):
        self._modules: Dict[str, ForumModuleDefinition] = {}
        self._permissions: Dict[str, PermissionDefinition] = {}
        self._permission_aliases: Dict[str, str] = {}
        self._admin_pages: List[AdminPageDefinition] = []

    def register_module(self, module: ForumModuleDefinition) -> ForumModuleDefinition:
        self._modules[module.module_id] = module

        for permission in module.permissions:
            self._permissions[permission.code] = permission
            for alias in permission.aliases:
                self._permission_aliases[alias] = permission.code

        for page in module.admin_pages:
            self._admin_pages.append(page)

        self._admin_pages.sort(key=lambda item: (item.nav_section, item.label, item.path))
        return module

    def get_modules(self) -> List[ForumModuleDefinition]:
        return sorted(
            self._modules.values(),
            key=lambda item: (
                int(not item.is_core),
                item.category,
                item.name.lower(),
                item.module_id,
            ),
        )

    def get_module(self, module_id: str) -> ForumModuleDefinition | None:
        return self._modules.get(module_id)

    def get_permission(self, code: str) -> PermissionDefinition | None:
        return self._permissions.get(code)

    def get_permission_aliases(self) -> Dict[str, str]:
        return dict(sorted(self._permission_aliases.items()))

    def get_valid_permission_codes(self) -> set[str]:
        return set(self._permissions.keys())

    def normalize_permission_code(self, permission: str) -> str | None:
        normalized = self._permission_aliases.get(permission, permission)
        if normalized in self._permissions:
            return normalized
        return None

    def get_admin_pages(self) -> List[AdminPageDefinition]:
        return list(self._admin_pages)

    def get_permission_sections(self) -> List[dict]:
        sections: Dict[str, dict] = {}
        for permission in self._permissions.values():
            section = sections.setdefault(
                permission.section,
                {
                    "name": permission.section,
                    "label": permission.section_label,
                    "permissions": [],
                },
            )
            section["permissions"].append(
                {
                    "name": permission.code,
                    "label": permission.label,
                    "icon": permission.icon,
                    "description": permission.description,
                    "module_id": permission.module_id,
                    "required_permissions": list(permission.required_permissions),
                    "aliases": list(permission.aliases),
                }
            )

        return [
            {
                **section,
                "permissions": sorted(section["permissions"], key=lambda item: (item["module_id"], item["label"])),
            }
            for section in sorted(sections.values(), key=lambda item: item["label"])
        ]


_registry: ForumRegistry | None = None


def get_forum_registry() -> ForumRegistry:
    global _registry
    if _registry is None:
        _registry = ForumRegistry()
        _register_builtin_modules(_registry)
    return _registry


def _register_builtin_modules(registry: ForumRegistry) -> None:
    registry.register_module(
        ForumModuleDefinition(
            module_id="core",
            name="Core",
            description="论坛核心配置、权限、外观与高级设置底座。",
            category="core",
            is_core=True,
            admin_pages=(
                AdminPageDefinition(
                    path="/admin",
                    label="仪表盘",
                    icon="fas fa-chart-bar",
                    module_id="core",
                    nav_section="core",
                    description="查看论坛概况和系统状态。",
                ),
                AdminPageDefinition(
                    path="/admin/modules",
                    label="模块中心",
                    icon="fas fa-cubes",
                    module_id="core",
                    nav_section="core",
                    description="查看内置模块、依赖、权限和后台入口。",
                ),
                AdminPageDefinition(
                    path="/admin/basics",
                    label="基础设置",
                    icon="fas fa-pencil-alt",
                    module_id="core",
                    nav_section="core",
                    description="维护论坛标题、公告与 SEO 基础信息。",
                ),
                AdminPageDefinition(
                    path="/admin/permissions",
                    label="权限管理",
                    icon="fas fa-key",
                    module_id="core",
                    nav_section="core",
                    description="配置用户组权限矩阵。",
                ),
                AdminPageDefinition(
                    path="/admin/appearance",
                    label="外观设置",
                    icon="fas fa-paint-brush",
                    module_id="core",
                    nav_section="core",
                    description="维护主题色、Logo 与自定义样式。",
                ),
                AdminPageDefinition(
                    path="/admin/mail",
                    label="邮件设置",
                    icon="fas fa-envelope",
                    module_id="core",
                    nav_section="feature",
                    description="配置邮件驱动与测试投递。",
                ),
                AdminPageDefinition(
                    path="/admin/advanced",
                    label="高级设置",
                    icon="fas fa-cog",
                    module_id="core",
                    nav_section="feature",
                    description="管理缓存、队列、存储和维护模式。",
                ),
                AdminPageDefinition(
                    path="/admin/audit-logs",
                    label="审计日志",
                    icon="fas fa-clipboard-list",
                    module_id="core",
                    nav_section="feature",
                    description="查看后台关键管理操作审计记录。",
                ),
            ),
            capabilities=(
                "settings",
                "permissions",
                "appearance",
                "mail",
                "advanced",
                "audit-log",
            ),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="discussions",
            name="Discussions",
            description="讨论、回复与内容管理的核心论坛能力。",
            category="feature",
            permissions=(
                PermissionDefinition(
                    code="viewForum",
                    label="查看论坛",
                    section="view",
                    section_label="查看权限",
                    module_id="discussions",
                    icon="fas fa-eye",
                    description="允许访问论坛讨论流和讨论详情。",
                ),
                PermissionDefinition(
                    code="startDiscussion",
                    label="发起讨论",
                    section="start",
                    section_label="发帖权限",
                    module_id="discussions",
                    icon="fas fa-edit",
                    description="允许创建新讨论。",
                ),
                PermissionDefinition(
                    code="startDiscussionWithoutApproval",
                    label="发起讨论免审核",
                    section="start",
                    section_label="发帖权限",
                    module_id="discussions",
                    icon="fas fa-user-check",
                    description="发起讨论后直接公开，无需进入审核队列。",
                    required_permissions=("startDiscussion",),
                ),
                PermissionDefinition(
                    code="discussion.reply",
                    label="回复讨论",
                    section="reply",
                    section_label="回复权限",
                    module_id="discussions",
                    icon="fas fa-reply",
                    description="允许在讨论中发布回复。",
                    aliases=("reply",),
                    required_permissions=("viewForum",),
                ),
                PermissionDefinition(
                    code="replyWithoutApproval",
                    label="回复免审核",
                    section="reply",
                    section_label="回复权限",
                    module_id="discussions",
                    icon="fas fa-user-check",
                    description="回复后直接公开，无需进入审核队列。",
                    required_permissions=("discussion.reply",),
                ),
                PermissionDefinition(
                    code="discussion.editOwn",
                    label="编辑自己的帖子",
                    section="reply",
                    section_label="回复权限",
                    module_id="discussions",
                    icon="fas fa-pencil-alt",
                    description="允许作者编辑自己的讨论首帖或回复。",
                    aliases=("editOwnPosts",),
                ),
                PermissionDefinition(
                    code="discussion.deleteOwn",
                    label="删除自己的帖子",
                    section="reply",
                    section_label="回复权限",
                    module_id="discussions",
                    icon="fas fa-times",
                    description="允许作者删除自己的讨论或回复。",
                    aliases=("deleteOwnPosts",),
                ),
                PermissionDefinition(
                    code="discussion.edit",
                    label="编辑任意帖子",
                    section="moderate",
                    section_label="内容管理",
                    module_id="discussions",
                    icon="fas fa-pencil-alt",
                    description="允许管理任意讨论首帖与回复。",
                    aliases=("editPosts",),
                    required_permissions=("viewForum",),
                ),
                PermissionDefinition(
                    code="discussion.delete",
                    label="删除任意帖子",
                    section="moderate",
                    section_label="内容管理",
                    module_id="discussions",
                    icon="fas fa-trash",
                    description="允许删除任意讨论或回复。",
                    aliases=("deletePosts",),
                    required_permissions=("discussion.hide",),
                ),
                PermissionDefinition(
                    code="discussion.hide",
                    label="隐藏内容",
                    section="moderate",
                    section_label="内容管理",
                    module_id="discussions",
                    icon="fas fa-eye-slash",
                    description="允许隐藏或恢复讨论内容。",
                    aliases=("hideDiscussions",),
                    required_permissions=("viewForum",),
                ),
                PermissionDefinition(
                    code="discussion.rename",
                    label="重命名讨论",
                    section="moderate",
                    section_label="内容管理",
                    module_id="discussions",
                    icon="fas fa-heading",
                    description="允许修改讨论标题。",
                    required_permissions=("viewForum",),
                ),
                PermissionDefinition(
                    code="discussion.lock",
                    label="锁定讨论",
                    section="moderate",
                    section_label="内容管理",
                    module_id="discussions",
                    icon="fas fa-lock",
                    description="允许锁定或解锁讨论。",
                    aliases=("lockDiscussions",),
                    required_permissions=("viewForum",),
                ),
                PermissionDefinition(
                    code="discussion.sticky",
                    label="置顶讨论",
                    section="moderate",
                    section_label="内容管理",
                    module_id="discussions",
                    icon="fas fa-thumbtack",
                    description="允许置顶或取消置顶讨论。",
                    aliases=("stickyDiscussions",),
                    required_permissions=("viewForum",),
                ),
            ),
            capabilities=("discussion-list", "discussion-detail", "composer", "moderation"),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="users",
            name="Users",
            description="用户资料、用户组、权限分配与封禁管理。",
            category="feature",
            permissions=(
                PermissionDefinition(
                    code="viewUserList",
                    label="查看用户列表",
                    section="view",
                    section_label="查看权限",
                    module_id="users",
                    icon="fas fa-users",
                    description="允许浏览用户列表与公开资料。",
                ),
                PermissionDefinition(
                    code="searchUsers",
                    label="搜索用户",
                    section="view",
                    section_label="查看权限",
                    module_id="users",
                    icon="fas fa-search",
                    description="允许在论坛搜索中查询用户。",
                ),
                PermissionDefinition(
                    code="user.edit",
                    label="编辑用户资料",
                    section="user",
                    section_label="用户管理",
                    module_id="users",
                    icon="fas fa-user-edit",
                    description="允许管理员编辑任意用户资料与用户组。",
                ),
                PermissionDefinition(
                    code="user.suspend",
                    label="封禁用户",
                    section="user",
                    section_label="用户管理",
                    module_id="users",
                    icon="fas fa-user-slash",
                    description="允许暂停用户发言能力。",
                ),
            ),
            admin_pages=(
                AdminPageDefinition(
                    path="/admin/users",
                    label="用户管理",
                    icon="fas fa-users",
                    module_id="users",
                    nav_section="core",
                    description="查看、编辑、分组与封禁论坛用户。",
                ),
            ),
            capabilities=("profiles", "groups", "suspension"),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="tags",
            name="Tags",
            description="讨论标签、层级标签、标签可见性与标签权限。",
            category="feature",
            admin_pages=(
                AdminPageDefinition(
                    path="/admin/tags",
                    label="标签管理",
                    icon="fas fa-tags",
                    module_id="tags",
                    nav_section="feature",
                    description="维护标签结构、排序与访问范围。",
                ),
            ),
            capabilities=("tagging", "tag-permissions", "tag-hierarchy"),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="approval",
            name="Approval",
            description="讨论与回复审核队列、审核通知和审核流程。",
            category="feature",
            dependencies=("discussions", "notifications"),
            admin_pages=(
                AdminPageDefinition(
                    path="/admin/approval",
                    label="审核队列",
                    icon="fas fa-user-check",
                    module_id="approval",
                    nav_section="feature",
                    description="处理待审核讨论与回复。",
                ),
            ),
            capabilities=("discussion-approval", "post-approval"),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="flags",
            name="Flags",
            description="帖子举报、处理状态和管理后台举报流。",
            category="feature",
            dependencies=("discussions", "users"),
            admin_pages=(
                AdminPageDefinition(
                    path="/admin/flags",
                    label="举报管理",
                    icon="fas fa-flag",
                    module_id="flags",
                    nav_section="feature",
                    description="查看并处理帖子举报。",
                ),
            ),
            capabilities=("post-flags", "flag-resolution"),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="subscriptions",
            name="Subscriptions",
            description="讨论关注、关注流与关注后通知逻辑。",
            category="feature",
            dependencies=("discussions", "notifications"),
            capabilities=("follow-discussion", "following-feed"),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="likes",
            name="Likes",
            description="帖子点赞与点赞通知。",
            category="feature",
            dependencies=("discussions", "notifications"),
            capabilities=("post-likes",),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="mentions",
            name="Mentions",
            description="用户提及与提及通知。",
            category="feature",
            dependencies=("discussions", "notifications", "users"),
            capabilities=("user-mentions",),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="notifications",
            name="Notifications",
            description="站内通知、未读状态、通知列表与通知投递。",
            category="feature",
            dependencies=("users",),
            capabilities=("in-app-notifications", "notification-stats", "notification-websocket"),
        )
    )

    registry.register_module(
        ForumModuleDefinition(
            module_id="realtime",
            name="Realtime",
            description="WebSocket 连接、通知实时推送和论坛实时信号。",
            category="infrastructure",
            dependencies=("notifications",),
            capabilities=("websocket", "presence", "typing"),
        )
    )
