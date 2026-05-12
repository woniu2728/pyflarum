import DashboardPage from './views/DashboardPage.vue'
import ModulesPage from './views/ModulesPage.vue'
import BasicsPage from './views/BasicsPage.vue'
import PermissionsPage from './views/PermissionsPage.vue'
import UsersPage from './views/UsersPage.vue'
import FlagsPage from './views/FlagsPage.vue'
import ApprovalQueuePage from './views/ApprovalQueuePage.vue'
import AuditLogsPage from './views/AuditLogsPage.vue'
import AppearancePage from './views/AppearancePage.vue'
import TagsPage from './views/TagsPage.vue'
import MailPage from './views/MailPage.vue'
import AdvancedPage from './views/AdvancedPage.vue'

const adminRoutes = []
const adminDashboardStats = []
const adminDashboardStatusSummaries = []
const adminDashboardStatusBadges = []
const adminDashboardStatusItems = []
const adminDashboardAlerts = []
const adminDashboardQueueMetrics = []
const adminDashboardCopies = []
const adminDashboardActionsMeta = []
const adminDashboardActions = []
const adminAuditLogsPageCopies = []
const adminAuditLogsPageConfig = []
const adminApprovalQueuePageCopies = []
const adminApprovalQueuePageConfig = []
const adminApprovalQueuePageActionMeta = []
const adminFlagsPageCopies = []
const adminFlagsPageConfig = []
const adminFlagsPageActionMeta = []
const adminPermissionsPageCopies = []
const adminPermissionsPageConfig = []
const adminPermissionsPageActionMeta = []
const adminUsersPageCopies = []
const adminUsersPageActionMeta = []
const adminTagsPageConfig = []
const adminTagsPageCopies = []
const adminTagsPageActionMeta = []

function upsertByPath(target, value) {
  const existingIndex = target.findIndex(item => item.path === value.path)
  if (existingIndex >= 0) {
    target.splice(existingIndex, 1, value)
    return value
  }

  target.push(value)
  return value
}

function upsertByKey(target, value) {
  const existingIndex = target.findIndex(item => item.key === value.key)
  if (existingIndex >= 0) {
    target.splice(existingIndex, 1, value)
    return value
  }

  target.push(value)
  return value
}

function resolveAdminItem(item, context = {}) {
  const isVisible = typeof item.isVisible === 'function' ? item.isVisible(context) : true
  if (!isVisible) {
    return null
  }

  const resolvedItem = typeof item.resolve === 'function'
    ? item.resolve(context)
    : item

  if (!resolvedItem) {
    return null
  }

  return {
    ...item,
    ...resolvedItem,
  }
}

export function registerAdminRoute(route) {
  const normalizedRoute = {
    navSection: 'feature',
    navOrder: 100,
    showInNavigation: true,
    showInDashboardActions: false,
    dashboardActionOrder: null,
    dashboardActionLabel: '',
    navDescription: '',
    navBadge: '',
    ...route
  }

  return upsertByPath(adminRoutes, normalizedRoute)
}

export function getAdminRoutes() {
  return [...adminRoutes].sort((left, right) => {
    if (left.path === '/admin') return -1
    if (right.path === '/admin') return 1
    return (left.navOrder || 100) - (right.navOrder || 100)
  })
}

export function getAdminNavSections() {
  const sections = {
    core: { key: 'core', title: '核心', items: [] },
    feature: { key: 'feature', title: '功能', items: [] }
  }

  for (const route of getAdminRoutes()) {
    if (!route.showInNavigation) {
      continue
    }

    const section = sections[route.navSection] || sections.feature
    section.items.push({
      path: route.path,
      icon: route.icon,
      label: route.label,
      description: route.navDescription || '',
      badge: route.navBadge || '',
      moduleId: route.moduleId || 'core',
      navOrder: route.navOrder || 100
    })
  }

  return Object.values(sections)
    .map(section => ({
      ...section,
      items: section.items.sort((left, right) => left.navOrder - right.navOrder)
    }))
    .filter(section => section.items.length > 0)
}

export function getAdminDashboardActions() {
  return getAdminRoutes()
    .filter(route => route.showInDashboardActions)
    .sort((left, right) => {
      const leftOrder = left.dashboardActionOrder ?? left.navOrder ?? 100
      const rightOrder = right.dashboardActionOrder ?? right.navOrder ?? 100
      return leftOrder - rightOrder
    })
    .map(route => ({
      key: route.name || route.path,
      to: route.path,
      icon: route.icon,
      label: route.dashboardActionLabel || route.label,
      description: route.navDescription || '',
      moduleId: route.moduleId || 'core',
    }))
}

export function registerAdminDashboardStat(item) {
  const normalizedItem = {
    order: 100,
    iconClass: '',
    ...item,
  }

  return upsertByKey(adminDashboardStats, normalizedItem)
}

export function getAdminDashboardStats(context = {}) {
  return [...adminDashboardStats]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .filter(Boolean)
}

export function registerAdminDashboardStatusSummary(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminDashboardStatusSummaries, normalizedItem)
}

export function getAdminDashboardStatusSummaries(context = {}) {
  return [...adminDashboardStatusSummaries]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .filter(Boolean)
}

export function registerAdminDashboardStatusBadge(item) {
  const normalizedItem = {
    order: 100,
    tone: 'neutral',
    ...item,
  }

  return upsertByKey(adminDashboardStatusBadges, normalizedItem)
}

export function getAdminDashboardStatusBadges(context = {}) {
  return [...adminDashboardStatusBadges]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .filter(Boolean)
}

export function registerAdminDashboardStatusItem(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminDashboardStatusItems, normalizedItem)
}

export function getAdminDashboardStatusItems(context = {}) {
  return [...adminDashboardStatusItems]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .filter(Boolean)
}

export function registerAdminDashboardAlert(item) {
  const normalizedItem = {
    order: 100,
    tone: 'warning',
    ...item,
  }

  return upsertByKey(adminDashboardAlerts, normalizedItem)
}

export function getAdminDashboardAlerts(context = {}) {
  return [...adminDashboardAlerts]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .filter(Boolean)
}

export function registerAdminDashboardQueueMetric(item) {
  const normalizedItem = {
    order: 100,
    variant: 'stat',
    ...item,
  }

  return upsertByKey(adminDashboardQueueMetrics, normalizedItem)
}

export function getAdminDashboardQueueMetrics(context = {}) {
  return [...adminDashboardQueueMetrics]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .filter(Boolean)
}

export function registerAdminDashboardCopy(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminDashboardCopies, normalizedItem)
}

export function getAdminDashboardCopy(context = {}) {
  return [...adminDashboardCopies]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminDashboardActionMeta(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminDashboardActionsMeta, normalizedItem)
}

export function getAdminDashboardActionMeta(context = {}) {
  return [...adminDashboardActionsMeta]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminDashboardAction(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminDashboardActions, normalizedItem)
}

export function getAdminDashboardAction(context = {}, key = '') {
  if (!key) return null

  return [...adminDashboardActions]
    .filter(item => item.key === key)
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminAuditLogsPageCopy(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminAuditLogsPageCopies, normalizedItem)
}

export function getAdminAuditLogsPageCopy(context = {}) {
  return [...adminAuditLogsPageCopies]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminAuditLogsPageConfig(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminAuditLogsPageConfig, normalizedItem)
}

export function getAdminAuditLogsPageConfig(context = {}) {
  return [...adminAuditLogsPageConfig]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminApprovalQueuePageCopy(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminApprovalQueuePageCopies, normalizedItem)
}

export function getAdminApprovalQueuePageCopy(context = {}) {
  return [...adminApprovalQueuePageCopies]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminApprovalQueuePageConfig(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminApprovalQueuePageConfig, normalizedItem)
}

export function getAdminApprovalQueuePageConfig(context = {}) {
  return [...adminApprovalQueuePageConfig]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminApprovalQueuePageActionMeta(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminApprovalQueuePageActionMeta, normalizedItem)
}

export function getAdminApprovalQueuePageActionMeta(context = {}) {
  return [...adminApprovalQueuePageActionMeta]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminFlagsPageCopy(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminFlagsPageCopies, normalizedItem)
}

export function getAdminFlagsPageCopy(context = {}) {
  return [...adminFlagsPageCopies]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminFlagsPageConfig(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminFlagsPageConfig, normalizedItem)
}

export function getAdminFlagsPageConfig(context = {}) {
  return [...adminFlagsPageConfig]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminFlagsPageActionMeta(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminFlagsPageActionMeta, normalizedItem)
}

export function getAdminFlagsPageActionMeta(context = {}) {
  return [...adminFlagsPageActionMeta]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminPermissionsPageCopy(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminPermissionsPageCopies, normalizedItem)
}

export function getAdminPermissionsPageCopy(context = {}) {
  return [...adminPermissionsPageCopies]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminPermissionsPageConfig(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminPermissionsPageConfig, normalizedItem)
}

export function getAdminPermissionsPageConfig(context = {}) {
  return [...adminPermissionsPageConfig]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminPermissionsPageActionMeta(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminPermissionsPageActionMeta, normalizedItem)
}

export function getAdminPermissionsPageActionMeta(context = {}) {
  return [...adminPermissionsPageActionMeta]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminUsersPageCopy(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminUsersPageCopies, normalizedItem)
}

export function getAdminUsersPageCopy(context = {}) {
  return [...adminUsersPageCopies]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminUsersPageActionMeta(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminUsersPageActionMeta, normalizedItem)
}

export function getAdminUsersPageActionMeta(context = {}) {
  return [...adminUsersPageActionMeta]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminTagsPageConfig(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminTagsPageConfig, normalizedItem)
}

export function getAdminTagsPageConfig(context = {}) {
  return [...adminTagsPageConfig]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminTagsPageCopy(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminTagsPageCopies, normalizedItem)
}

export function getAdminTagsPageCopy(context = {}) {
  return [...adminTagsPageCopies]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

export function registerAdminTagsPageActionMeta(item) {
  const normalizedItem = {
    order: 100,
    ...item,
  }

  return upsertByKey(adminTagsPageActionMeta, normalizedItem)
}

export function getAdminTagsPageActionMeta(context = {}) {
  return [...adminTagsPageActionMeta]
    .sort((left, right) => (left.order || 100) - (right.order || 100))
    .map(item => resolveAdminItem(item, context))
    .find(Boolean) || null
}

registerAdminRoute({
  path: '/admin',
  name: 'admin-dashboard',
  component: DashboardPage,
  icon: 'fas fa-chart-bar',
  label: '仪表盘',
  navDescription: '查看论坛运行状态、模块概况和系统入口。',
  navSection: 'core',
  navOrder: 10,
  moduleId: 'core'
})

registerAdminRoute({
  path: '/admin/modules',
  name: 'admin-modules',
  component: ModulesPage,
  icon: 'fas fa-cubes',
  label: '模块中心',
  navDescription: '查看内置模块、扩展能力和注册快照。',
  navSection: 'core',
  navOrder: 20,
  showInDashboardActions: true,
  moduleId: 'core'
})

registerAdminRoute({
  path: '/admin/basics',
  name: 'admin-basics',
  component: BasicsPage,
  icon: 'fas fa-pencil-alt',
  label: '基础设置',
  navDescription: '维护论坛标题、公告和基础信息。',
  navSection: 'core',
  navOrder: 30,
  showInDashboardActions: true,
  dashboardActionLabel: '编辑基础设置',
  moduleId: 'core'
})

registerAdminRoute({
  path: '/admin/permissions',
  name: 'admin-permissions',
  component: PermissionsPage,
  icon: 'fas fa-key',
  label: '权限管理',
  navDescription: '管理用户组和访问权限矩阵。',
  navSection: 'core',
  navOrder: 40,
  showInDashboardActions: true,
  dashboardActionLabel: '管理权限',
  moduleId: 'core'
})

registerAdminRoute({
  path: '/admin/appearance',
  name: 'admin-appearance',
  component: AppearancePage,
  icon: 'fas fa-paint-brush',
  label: '外观设置',
  navDescription: '调整主题、Logo 和界面外观。',
  navSection: 'core',
  navOrder: 50,
  showInDashboardActions: true,
  dashboardActionLabel: '自定义外观',
  moduleId: 'core'
})

registerAdminRoute({
  path: '/admin/users',
  name: 'admin-users',
  component: UsersPage,
  icon: 'fas fa-users',
  label: '用户管理',
  navDescription: '查看用户资料、分组和封禁状态。',
  navSection: 'core',
  navOrder: 60,
  showInDashboardActions: true,
  dashboardActionLabel: '管理用户',
  moduleId: 'users'
})

registerAdminRoute({
  path: '/admin/approval',
  name: 'admin-approval',
  component: ApprovalQueuePage,
  icon: 'fas fa-user-check',
  label: '审核队列',
  navDescription: '集中处理待审核讨论和回复。',
  navSection: 'feature',
  navOrder: 110,
  showInDashboardActions: true,
  dashboardActionLabel: '处理审核',
  moduleId: 'approval'
})

registerAdminRoute({
  path: '/admin/flags',
  name: 'admin-flags',
  component: FlagsPage,
  icon: 'fas fa-flag',
  label: '举报管理',
  navDescription: '查看和处理社区举报内容。',
  navSection: 'feature',
  navOrder: 120,
  showInDashboardActions: true,
  dashboardActionLabel: '处理举报',
  moduleId: 'flags'
})

registerAdminRoute({
  path: '/admin/audit-logs',
  name: 'admin-audit-logs',
  component: AuditLogsPage,
  icon: 'fas fa-clipboard-list',
  label: '审计日志',
  navDescription: '追踪后台关键操作记录。',
  navSection: 'feature',
  navOrder: 130,
  showInDashboardActions: true,
  dashboardActionLabel: '查看审计',
  moduleId: 'core'
})

registerAdminRoute({
  path: '/admin/tags',
  name: 'admin-tags',
  component: TagsPage,
  icon: 'fas fa-tags',
  label: '标签管理',
  navDescription: '维护标签结构、排序和可见范围。',
  navSection: 'feature',
  navOrder: 140,
  moduleId: 'tags'
})

registerAdminRoute({
  path: '/admin/mail',
  name: 'admin-mail',
  component: MailPage,
  icon: 'fas fa-envelope',
  label: '邮件设置',
  navDescription: '配置邮件服务和发信能力。',
  navSection: 'feature',
  navOrder: 150,
  moduleId: 'core'
})

registerAdminRoute({
  path: '/admin/advanced',
  name: 'admin-advanced',
  component: AdvancedPage,
  icon: 'fas fa-cog',
  label: '高级设置',
  navDescription: '管理缓存、队列和系统级能力。',
  navSection: 'feature',
  navOrder: 160,
  moduleId: 'core'
})

registerAdminDashboardStat({
  key: 'users',
  order: 10,
  icon: 'fas fa-users',
  label: '用户总数',
  moduleId: 'users',
  resolve: ({ stats }) => ({
    value: stats?.totalUsers || 0,
  }),
})

registerAdminDashboardStat({
  key: 'discussions',
  order: 20,
  icon: 'fas fa-comments',
  label: '讨论总数',
  moduleId: 'core',
  resolve: ({ stats }) => ({
    value: stats?.totalDiscussions || 0,
  }),
})

registerAdminDashboardStat({
  key: 'posts',
  order: 30,
  icon: 'fas fa-comment',
  label: '帖子总数',
  moduleId: 'core',
  resolve: ({ stats }) => ({
    value: stats?.totalPosts || 0,
  }),
})

registerAdminDashboardStat({
  key: 'pending-approvals',
  order: 40,
  icon: 'fas fa-user-check',
  iconClass: 'StatsWidget-icon--info',
  label: '待审核内容',
  moduleId: 'approval',
  resolve: ({ stats }) => ({
    value: stats?.pendingApprovals || 0,
  }),
})

registerAdminDashboardStat({
  key: 'open-flags',
  order: 50,
  icon: 'fas fa-flag',
  iconClass: 'StatsWidget-icon--warning',
  label: '待处理举报',
  moduleId: 'flags',
  resolve: ({ stats }) => ({
    value: stats?.openFlags || 0,
  }),
})

registerAdminDashboardStatusSummary({
  key: 'runtime',
  order: 10,
  resolve: ({ stats }) => ({
    label: '运行时',
    value: stats?.runtimeName || 'Python',
    meta: `Python ${stats?.pythonVersion || '-'}`,
  }),
})

registerAdminDashboardStatusBadge({
  key: 'debug-mode',
  order: 10,
  resolve: ({ stats }) => ({
    text: stats?.debugMode ? 'DEBUG' : 'PRODUCTION',
    tone: stats?.debugMode ? 'warning' : 'success',
  }),
})

registerAdminDashboardStatusBadge({
  key: 'maintenance-mode',
  order: 20,
  resolve: ({ stats }) => ({
    text: stats?.maintenanceMode ? '维护模式开启' : '维护模式关闭',
    tone: stats?.maintenanceMode ? 'warning' : 'neutral',
  }),
})

registerAdminDashboardStatusBadge({
  key: 'redis-status',
  order: 30,
  resolve: ({ stats }) => ({
    text: stats?.redisEnabled ? 'Redis 已启用' : 'Redis 未启用',
    tone: stats?.redisEnabled ? 'success' : 'neutral',
  }),
})

registerAdminDashboardStatusBadge({
  key: 'queue-worker-status',
  order: 40,
  resolve: ({ stats }) => ({
    text: stats?.queueWorkerLabel || '队列未检测',
    tone: !stats?.queueEnabled || ['disabled', 'sync'].includes(stats?.queueWorkerStatus)
      ? 'neutral'
      : (stats?.queueWorkerAvailable ? 'success' : 'warning'),
  }),
})

registerAdminDashboardStatusItem({
  key: 'python-version',
  order: 10,
  label: 'Python 版本',
  resolve: ({ stats }) => ({
    value: stats?.pythonVersion || '-',
  }),
})

registerAdminDashboardStatusItem({
  key: 'django-version',
  order: 20,
  label: 'Django 版本',
  resolve: ({ stats }) => ({
    value: stats?.djangoVersion || '-',
  }),
})

registerAdminDashboardStatusItem({
  key: 'database',
  order: 30,
  label: '数据库',
  resolve: ({ stats }) => ({
    value: stats?.databaseLabel || '-',
  }),
})

registerAdminDashboardStatusItem({
  key: 'cache-driver',
  order: 40,
  label: '缓存驱动',
  resolve: ({ stats }) => ({
    value: stats?.cacheDriver || '-',
  }),
})

registerAdminDashboardStatusItem({
  key: 'realtime-driver',
  order: 50,
  label: '实时层',
  resolve: ({ stats }) => ({
    value: stats?.realtimeDriver || '-',
  }),
})

registerAdminDashboardStatusItem({
  key: 'queue-driver',
  order: 60,
  label: '队列执行',
  resolve: ({ stats }) => ({
    value: stats?.queueLabel || '-',
  }),
})

registerAdminDashboardStatusItem({
  key: 'queue-worker',
  order: 70,
  label: '队列 Worker',
  resolve: ({ stats }) => ({
    value: stats?.queueWorkerLabel || '-',
    help: stats?.queueWorkerMessage || '',
  }),
})

registerAdminDashboardAlert({
  key: 'runtime-risks',
  order: 10,
  isVisible: ({ stats }) => Array.isArray(stats?.runtimeRisks) && stats.runtimeRisks.length > 0,
  resolve: ({ stats }) => {
    const risks = Array.isArray(stats?.runtimeRisks) ? stats.runtimeRisks : []
    return {
      title: '运行时风险提示：',
      tone: risks.some(item => item?.level === 'danger') ? 'danger' : 'warning',
      text: risks.map(item => item.title).join('；'),
    }
  },
})

registerAdminDashboardQueueMetric({
  key: 'queue-enqueued',
  order: 10,
  variant: 'stat',
  label: '入队',
  resolve: ({ stats }) => ({
    value: stats?.queueMetrics?.enqueued_count || 0,
  }),
})

registerAdminDashboardQueueMetric({
  key: 'queue-sync',
  order: 20,
  variant: 'stat',
  label: '同步',
  resolve: ({ stats }) => ({
    value: stats?.queueMetrics?.sync_count || 0,
  }),
})

registerAdminDashboardQueueMetric({
  key: 'queue-fallback',
  order: 30,
  variant: 'stat',
  label: '回退',
  resolve: ({ stats }) => ({
    value: stats?.queueMetrics?.fallback_count || 0,
  }),
})

registerAdminDashboardQueueMetric({
  key: 'queue-last-task',
  order: 40,
  variant: 'detail',
  label: '最近任务',
  resolve: ({ stats }) => ({
    value: stats?.queueMetrics?.last_task || '-',
    error: stats?.queueMetrics?.last_error || '',
  }),
})

registerAdminDashboardCopy({
  key: 'core-dashboard-copy',
  order: 10,
  resolve: () => ({
    pageTitle: '仪表盘',
    pageDescription: '查看论坛概况和系统状态',
    statusWidgetTitle: '系统状态',
    statsWidgetTitle: '论坛统计',
    actionsWidgetTitle: '快速操作',
  }),
})

registerAdminDashboardActionMeta({
  key: 'core-dashboard-actions-meta',
  order: 10,
  resolve: () => ({
    loadingErrorText: '加载统计数据失败，请稍后重试',
    queueResetIdleText: '重置指标',
    queueResetPendingText: '重置中...',
    queueResetConfirmTitle: '重置队列指标',
    queueResetConfirmMessage: '确定重置队列运行指标吗？当前累计的入队、同步和回退计数会清零。',
    queueResetConfirmText: '重置',
    queueResetCancelText: '取消',
    queueResetSuccessTitle: '指标已重置',
    queueResetSuccessMessage: '队列运行指标已重置',
    queueResetErrorMessage: '重置失败，请稍后重试',
  }),
})

registerAdminDashboardAction({
  key: 'reset-queue-metrics',
  order: 10,
  resolve: ({ api, modalStore, stats, setStats, setMessage, setMessageTone, setPending, copy }) => ({
    run: async () => {
      const confirmed = await modalStore.confirm({
        title: copy?.queueResetConfirmTitle || '重置队列指标',
        message: copy?.queueResetConfirmMessage || '确定重置队列运行指标吗？当前累计的入队、同步和回退计数会清零。',
        confirmText: copy?.queueResetConfirmText || '重置',
        cancelText: copy?.queueResetCancelText || '取消',
        tone: 'warning'
      })
      if (!confirmed) {
        return
      }

      setPending(true)
      setMessage('')
      setMessageTone('success')

      try {
        const data = await api.post('/admin/queue/metrics/reset')
        setStats({
          ...stats,
          queueMetrics: data.metrics || stats.queueMetrics
        })
        const successMessage = data.message || copy?.queueResetSuccessMessage || '队列运行指标已重置'
        setMessage(successMessage)
        await modalStore.alert({
          title: copy?.queueResetSuccessTitle || '指标已重置',
          message: successMessage,
          tone: 'success'
        })
      } catch (error) {
        console.error('重置队列指标失败:', error)
        setMessageTone('error')
        setMessage(error.response?.data?.error || copy?.queueResetErrorMessage || '重置失败，请稍后重试')
      } finally {
        setPending(false)
      }
    },
  }),
})

registerAdminTagsPageCopy({
  key: 'core-tags-page-copy',
  order: 10,
  resolve: () => ({
    pageTitle: '标签管理',
    pageDescription: '管理讨论标签和分类',
    createLabel: '创建标签',
    refreshLabel: '刷新统计',
    refreshingLabel: '刷新中...',
    loadingText: '加载中...',
    emptyText: '暂无标签',
    previewLabel: '实时预览',
    previewRootText: '当前会作为顶级标签显示在列表中。',
    previewChildText: '当前会作为子标签显示在父标签下方。',
    previewFallbackName: '新标签',
    modalCreateTitle: '创建标签',
    modalEditTitle: '编辑标签',
    modalSubtitle: '参考 Flarum 的标签编辑流程，并补齐父子层级、排序和显示状态配置。',
    tablePreviewHeader: '预览',
    tableNameHeader: '标签名称',
    tableSlugHeader: '别名',
    tableHierarchyHeader: '层级',
    tableStatusHeader: '状态',
    tableDiscussionCountHeader: '讨论数',
    tableActionHeader: '操作',
    nameLabel: '标签名称 *',
    namePlaceholder: '例如：技术讨论',
    slugLabel: '别名 / Slug',
    slugPlaceholder: '例如：tech-talk',
    slugHelpText: '留空时自动生成，建议使用短横线风格。',
    descriptionLabel: '描述',
    descriptionPlaceholder: '标签的简短描述',
    parentLabel: '父标签',
    parentRootOptionLabel: '作为顶级标签',
    parentHelpText: '只能选择顶级标签作为父标签；设置后，这个标签会显示在对应父标签下方。',
    parentChildrenBlockedText: '当前标签下已有子标签，不能再把它设为次标签。',
    positionLabel: '排序位置',
    positionPlaceholder: '0',
    positionHelpTextPrefix: '数字越小越靠前',
    positionHelpRootText: '顶级标签层',
    positionHelpParentText: '当前父标签下',
    colorLabel: '颜色',
    colorPlaceholder: '#888888',
    colorPickerAriaLabel: '标签颜色选择器',
    iconLabel: '图标',
    clearIconLabel: '清除图标',
    iconSearchPlaceholder: '搜索图标，例如 code、comments、tag',
    iconNoMatchText: '没有找到匹配的图标',
    iconHelpText: '标签仍然保存为 Font Awesome 类名，但现在可以直接搜索和点选。',
    iconManualLabel: '手动输入图标类名',
    iconManualPlaceholder: '高级模式：手动输入 Font Awesome 类名',
    visibilityLabel: '显示与发帖限制',
    hiddenLabel: '隐藏标签',
    restrictedLabel: '限制发帖',
    viewScopeLabel: '查看权限',
    startScopeLabel: '发帖权限',
    replyScopeLabel: '回帖权限',
    startScopeHelpText: '发帖权限不能比查看权限更宽松。',
    restrictedHelpText: '“限制发帖”开启后，普通用户无法在该标签下发起讨论；回帖权限仍按这里的配置生效。',
    postingHelpText: '标签级权限会作用到讨论列表、详情页、发帖和回帖流程。',
    editLabel: '编辑',
    moveUpLabel: '上移',
    moveDownLabel: '下移',
    deleteLabel: '删除',
    saveLabel: '保存',
    savingLabel: '保存中...',
    cancelLabel: '取消',
    tagPreviewCardLabel: '实时预览',
    tagPreviewRootText: '当前会作为顶级标签显示在列表中。',
    tagPreviewChildText: '当前会作为子标签显示在父标签下方。',
    sortTextPrefix: '排序',
    rootLevelText: '顶级标签',
    childLevelText: '子标签',
    childOwnedPrefix: '隶属',
    viewTextPrefix: '查看',
    startTextPrefix: '发帖',
    replyTextPrefix: '回帖',
    publicText: '公开',
    summaryTagTotalLabel: '标签总数',
    summaryTagHierarchyLabel: '顶级 / 子标签',
    summaryHiddenLabel: '隐藏标签',
    summaryRestrictedLabel: '限制发帖',
    configHierarchyLabel: '层级',
    configSortLabel: '排序',
    configViewLabel: '查看范围',
    configPostingLabel: '发帖 / 回帖',
  }),
})

registerAdminTagsPageConfig({
  key: 'core-tags-page-config',
  order: 10,
  resolve: () => ({
    colorPresets: [
      '#3c78d8',
      '#4d698e',
      '#0e7490',
      '#0f766e',
      '#2f855a',
      '#65a30d',
      '#ca8a04',
      '#ea580c',
      '#dc2626',
      '#c026d3',
      '#7c3aed',
      '#475569',
    ],
    scopeOptions: [
      { value: 'public', label: '所有人' },
      { value: 'members', label: '已登录用户' },
      { value: 'staff', label: '仅管理员' },
    ],
    iconOptions: [
      { value: 'fas fa-comments', label: '讨论' },
      { value: 'fas fa-comment-dots', label: '对话' },
      { value: 'fas fa-code', label: '代码' },
      { value: 'fas fa-terminal', label: '终端' },
      { value: 'fas fa-bug', label: '问题' },
      { value: 'fas fa-lightbulb', label: '想法' },
      { value: 'fas fa-rocket', label: '发布' },
      { value: 'fas fa-book', label: '文档' },
      { value: 'fas fa-graduation-cap', label: '教程' },
      { value: 'fas fa-wrench', label: '工具' },
      { value: 'fas fa-cubes', label: '框架' },
      { value: 'fas fa-plug', label: '插件' },
      { value: 'fas fa-cloud', label: '云服务' },
      { value: 'fas fa-server', label: '服务端' },
      { value: 'fas fa-database', label: '数据库' },
      { value: 'fas fa-shield-alt', label: '安全' },
      { value: 'fas fa-mobile-alt', label: '移动端' },
      { value: 'fas fa-desktop', label: '桌面端' },
      { value: 'fas fa-image', label: '图片' },
      { value: 'fas fa-video', label: '视频' },
      { value: 'fas fa-music', label: '音频' },
      { value: 'fas fa-gamepad', label: '游戏' },
      { value: 'fas fa-briefcase', label: '工作' },
      { value: 'fas fa-chart-line', label: '增长' },
      { value: 'fas fa-bullhorn', label: '公告' },
      { value: 'fas fa-fire', label: '热门' },
      { value: 'fas fa-star', label: '精选' },
      { value: 'fas fa-heart', label: '喜欢' },
      { value: 'fas fa-users', label: '社区' },
      { value: 'fas fa-user-shield', label: '管理' },
      { value: 'fas fa-tags', label: '标签' },
      { value: 'fas fa-thumbtack', label: '置顶' },
      { value: 'fas fa-lock', label: '锁定' },
      { value: 'fas fa-language', label: '语言' },
      { value: 'fas fa-globe', label: '全球' },
      { value: 'fas fa-seedling', label: '新手' },
    ],
  }),
})

registerAdminTagsPageActionMeta({
  key: 'core-tags-page-actions-meta',
  order: 10,
  resolve: () => ({
    loadErrorText: '加载标签失败，请稍后重试',
    saveIncompleteTitle: '信息不完整',
    saveIncompleteMessage: '请输入标签名称',
    saveFailedTitle: '保存失败',
    saveUnknownErrorText: '未知错误',
    deleteConfirmTitle: '删除标签',
    deleteConfirmMessage: tag => `确定要删除标签“${tag}”吗？`,
    deleteConfirmText: '删除',
    deleteCancelText: '取消',
    deleteSuccessTitle: '标签已删除',
    deleteSuccessMessage: tag => `标签“${tag}”已删除。`,
    deleteFailedTitle: '删除失败',
    deleteFailedMessage: '未知错误',
    refreshConfirmTitle: '刷新标签统计',
    refreshConfirmMessage: '确定刷新全部标签的讨论数和最后发帖信息吗？数据量较大时建议在低峰期执行。',
    refreshConfirmText: '刷新',
    refreshCancelText: '取消',
    refreshFailedTitle: '刷新标签统计失败',
    refreshFailedMessage: '未知错误',
    moveFailedTitle: '调整排序失败',
    moveFailedMessage: '未知错误',
  }),
})

registerAdminAuditLogsPageCopy({
  key: 'core-audit-logs-page-copy',
  order: 10,
  resolve: () => ({
    pageTitle: '审计日志',
    pageDescription: '查看管理员关键操作记录',
    actionFilterLabel: '筛选操作',
    targetFilterLabel: '筛选对象',
    allActionsLabel: '全部操作',
    allTargetsLabel: '全部对象',
    refreshLabel: '刷新',
    loadingText: '加载中...',
    loadErrorText: '加载审计日志失败',
    emptyText: '暂无审计日志',
    tableTimeHeader: '时间',
    tableUserHeader: '管理员',
    tableActionHeader: '操作',
    tableTargetHeader: '对象',
    tableSourceHeader: '来源',
    tableDetailHeader: '详情',
    timeLabel: '时间',
    userLabel: '管理员',
    actionLabel: '操作',
    targetLabel: '对象',
    sourceLabel: '来源',
    detailLabel: '详情',
    systemUserLabel: '系统',
    unknownActionLabel: '未知操作',
  }),
})

registerAdminAuditLogsPageConfig({
  key: 'core-audit-logs-page-config',
  order: 10,
  resolve: () => ({
    actionLabels: {
      'admin.appearance_asset.upload': '上传外观资源',
      'admin.approval.approve': '审核通过',
      'admin.approval.reject': '审核拒绝',
      'admin.cache.clear': '清除缓存',
      'admin.discussion.delete': '删除讨论',
      'admin.discussion.hide': '隐藏讨论',
      'admin.discussion.lock': '锁定讨论',
      'admin.discussion.restore': '恢复讨论',
      'admin.discussion.sticky': '置顶讨论',
      'admin.discussion.unlock': '解锁讨论',
      'admin.discussion.unsticky': '取消置顶',
      'admin.flag.resolve': '处理举报',
      'admin.group.create': '创建用户组',
      'admin.group.delete': '删除用户组',
      'admin.group.update': '更新用户组',
      'admin.mail.test': '发送测试邮件',
      'admin.permissions.update': '更新权限',
      'admin.post.delete': '删除回复',
      'admin.post.hide': '隐藏回复',
      'admin.post.restore': '恢复回复',
      'admin.queue_metrics.reset': '重置队列指标',
      'admin.search_indexes.rebuild': '重建搜索索引',
      'admin.settings.update': '更新设置',
      'admin.tag.create': '创建标签',
      'admin.tag.delete': '删除标签',
      'admin.tag.move': '移动标签',
      'admin.tag.refresh_stats': '刷新标签统计',
      'admin.tag.update': '更新标签',
      'admin.user.delete': '删除用户',
      'admin.user.update': '更新用户',
    },
    targetLabels: {
      appearance_asset: '外观资源',
      cache: '缓存',
      discussion: '讨论',
      group: '用户组',
      mail: '邮件',
      search_index: '搜索索引',
      permissions: '权限',
      post: '回复',
      post_flag: '举报',
      settings: '设置',
      tag: '标签',
      user: '用户',
    },
  }),
})

registerAdminApprovalQueuePageCopy({
  key: 'core-approval-queue-page-copy',
  order: 10,
  resolve: () => ({
    pageTitle: '审核队列',
    pageDescription: '审核未验证邮箱用户提交的讨论和回复',
    loadingText: '加载中...',
    emptyText: '当前没有待审核内容',
    discussionTypeLabel: '讨论',
    postTypeLabel: '回复',
    unknownAuthorLabel: '未知',
    authorPrefix: '作者',
    submittedAtPrefix: '提交于',
    floorPrefix: '楼层',
    viewContentLabel: '查看内容',
    emptyContentText: '暂无正文内容',
    approveLabel: '审核通过',
    rejectLabel: '拒绝并隐藏',
    modalApproveTitle: '审核通过',
    modalRejectTitle: '拒绝内容',
    modalApproveDescription: '通过后内容会对有权限的用户可见。',
    modalRejectDescription: '拒绝后作者仍可看到审核反馈。',
    noteLabel: '审核备注',
    approveNotePlaceholder: '例如：内容符合社区规范，已放行',
    rejectNotePlaceholder: '例如：内容质量不足，已拒绝',
    confirmApproveText: '通过审核',
    confirmRejectText: '拒绝并隐藏',
    unknownTimeText: '未知时间',
  }),
})

registerAdminApprovalQueuePageConfig({
  key: 'core-approval-queue-page-config',
  order: 10,
  resolve: () => ({
    filters: [
      { value: 'all', label: '全部', icon: 'fas fa-layer-group' },
      { value: 'discussion', label: '讨论', icon: 'fas fa-comments' },
      { value: 'post', label: '回复', icon: 'fas fa-reply' },
    ],
  }),
})

registerAdminApprovalQueuePageActionMeta({
  key: 'core-approval-queue-page-actions-meta',
  order: 10,
  resolve: () => ({
    loadErrorText: '加载审核队列失败，请稍后重试',
    approveSuccessTitle: '审核已通过',
    approveSuccessMessage: '内容已放行，用户现在可以正常查看。',
    rejectSuccessTitle: '内容已拒绝',
    rejectSuccessMessage: '内容已拒绝并隐藏。',
    submitFailedTitle: '提交失败',
    submitFailedMessage: '未知错误',
  }),
})

registerAdminFlagsPageCopy({
  key: 'core-flags-page-copy',
  order: 10,
  resolve: () => ({
    pageTitle: '举报管理',
    pageDescription: '处理用户提交的帖子举报',
    loadingText: '加载中...',
    emptyText: '暂无举报记录',
    reporterPrefix: '举报人',
    discussionPrefix: '讨论',
    postPrefix: '帖子',
    viewPostLabel: '查看帖子',
    reasonBlockTitle: '举报说明',
    postBlockTitle: '帖子内容',
    emptyReasonText: '用户未填写补充说明',
    resolveLabel: '标记已处理',
    ignoreLabel: '忽略举报',
    resolverPrefix: '处理人',
    resolutionNotePrefix: '备注',
    unknownResolverLabel: '未知',
    statusOpenLabel: '待处理',
    statusResolvedLabel: '已处理',
    statusIgnoredLabel: '已忽略',
    modalResolveTitle: '标记举报已处理',
    modalIgnoreTitle: '忽略举报',
    modalResolveDescription: '标记后这条举报会从待处理列表移出。',
    modalIgnoreDescription: '忽略后举报会进入已忽略列表，便于后续追溯。',
    noteLabel: '处理备注',
    resolveNotePlaceholder: '例如：已隐藏帖子并警告用户',
    ignoreNotePlaceholder: '例如：举报理由不足，暂不处理',
  }),
})

registerAdminFlagsPageConfig({
  key: 'core-flags-page-config',
  order: 10,
  resolve: () => ({
    filters: [
      { value: 'open', label: '待处理', icon: 'fas fa-inbox' },
      { value: 'resolved', label: '已处理', icon: 'fas fa-check-circle' },
      { value: 'ignored', label: '已忽略', icon: 'fas fa-ban' },
    ],
  }),
})

registerAdminFlagsPageActionMeta({
  key: 'core-flags-page-actions-meta',
  order: 10,
  resolve: () => ({
    loadErrorText: '加载举报失败，请稍后重试',
    resolveSuccessTitle: '举报已处理',
    resolveSuccessMessage: '举报状态已更新为已处理。',
    ignoreSuccessTitle: '举报已忽略',
    ignoreSuccessMessage: '举报状态已更新为已忽略。',
    resolveFailedTitle: '处理失败',
    resolveFailedMessage: '未知错误',
  }),
})

registerAdminPermissionsPageCopy({
  key: 'core-permissions-page-copy',
  order: 10,
  resolve: () => ({
    pageTitle: '权限管理',
    pageDescription: '配置用户组和权限，并检查权限来源与依赖关系',
    metaSummaryText: ({ permissionCount, moduleCount }) => `当前共注册 ${permissionCount} 项权限，来自 ${moduleCount} 个模块。保存时会自动补齐依赖权限，避免出现“子权限已勾选但前置权限缺失”的配置。`,
    editGroupTitle: '编辑用户组',
    addGroupLabel: '添加用户组',
    permissionHeaderLabel: '权限',
    dependencyPrefix: '依赖',
    mobilePermissionCountText: count => `${count} 项权限`,
    savePermissionsLabel: '保存权限',
    savingPermissionsLabel: '保存中...',
    saveSuccessText: '保存成功',
    createGroupTitle: '创建用户组',
    updateGroupTitle: '编辑用户组',
    groupNameLabel: '名称',
    groupNamePlaceholder: '例如：Moderator',
    groupIconLabel: '图标',
    groupIconPlaceholder: '例如：fas fa-shield-alt',
    groupColorLabel: '颜色',
    groupColorPickerAriaLabel: '用户组颜色选择器',
    groupColorPlaceholder: '#4d698e',
    groupHiddenLabel: '隐藏用户组',
    deleteGroupLabel: '删除用户组',
    deletingGroupLabel: '删除中...',
    deleteGroupBlockedText: '系统默认用户组不允许删除',
    cancelLabel: '取消',
    saveGroupLabel: '保存',
    savingGroupLabel: '保存中...',
    unknownModuleLabel: '未知模块',
  }),
})

registerAdminPermissionsPageConfig({
  key: 'core-permissions-page-config',
  order: 10,
  resolve: () => ({
    groupColorFallback: '#6b7c93',
    groupColorDefault: '#4d698e',
  }),
})

registerAdminPermissionsPageActionMeta({
  key: 'core-permissions-page-actions-meta',
  order: 10,
  resolve: () => ({
    loadGroupsFailedMessage: '加载用户组失败',
    loadPermissionsFailedMessage: '加载权限失败',
    loadPermissionMetaFailedMessage: '加载权限定义失败',
    savePermissionsConfirmTitle: '保存权限配置',
    savePermissionsConfirmMessage: '权限变更会立即影响用户操作能力。确定保存当前配置吗？',
    savePermissionsConfirmText: '保存',
    savePermissionsCancelText: '取消',
    savePermissionsFailedMessage: '保存权限失败',
    groupIncompleteTitle: '信息不完整',
    groupIncompleteMessage: '请输入用户组名称',
    saveGroupFailedTitle: '保存失败',
    saveGroupFailedMessage: '未知错误',
    deleteGroupConfirmTitle: '删除用户组',
    deleteGroupConfirmMessage: name => `确定删除用户组“${name}”吗？现有成员会失去该用户组权限。`,
    deleteGroupConfirmText: '删除',
    deleteGroupCancelText: '取消',
    deleteGroupSuccessTitle: '用户组已删除',
    deleteGroupSuccessMessage: name => `用户组“${name}”已删除。`,
    deleteGroupFailedTitle: '删除失败',
    deleteGroupFailedMessage: '未知错误',
  }),
})

registerAdminUsersPageCopy({
  key: 'core-users-page-copy',
  order: 10,
  resolve: () => ({
    pageTitle: '用户管理',
    pageDescription: '管理论坛用户',
    searchLabel: '搜索用户',
    searchPlaceholder: '搜索用户名或邮箱...',
    tableIdHeader: 'ID',
    tableUsernameHeader: '用户名',
    tableEmailHeader: '邮箱',
    tableDisplayNameHeader: '显示名称',
    tableDiscussionHeader: '讨论',
    tableReplyHeader: '回复',
    tableJoinedHeader: '加入时间',
    tableStatusHeader: '状态',
    tableActionHeader: '操作',
    loadingText: '加载中...',
    emptyText: '暂无用户',
    editLabel: '编辑',
    mobileEmailLabel: '邮箱',
    mobileIdLabel: 'ID',
    mobileDiscussionLabel: '讨论',
    mobileReplyLabel: '回复',
    mobileJoinedLabel: '加入时间',
    modalTitle: '编辑用户',
    usernameLabel: '用户名',
    emailLabel: '邮箱',
    displayNameLabel: '显示名称',
    bioLabel: '个人简介',
    bioPlaceholder: '管理员后台可直接维护用户简介',
    staffLabel: '管理员',
    emailConfirmedLabel: '邮箱已验证',
    groupsLabel: '用户组',
    suspendedUntilLabel: '封禁截止时间',
    suspendedUntilHelpText: '留空表示未封禁',
    suspendReasonLabel: '封禁原因',
    suspendReasonPlaceholder: '例如：垃圾广告、违规内容',
    suspendMessageLabel: '对用户显示的信息',
    suspendMessagePlaceholder: '显示给被封禁用户的提示',
    deleteLabel: '删除用户',
    deletingLabel: '删除中...',
    cancelLabel: '取消',
    saveLabel: '保存',
    savingLabel: '保存中...',
    deleteBlockedText: '当前登录管理员账号不允许删除',
    statusSuspendedLabel: '已封禁',
    statusActiveLabel: '已激活',
    statusPendingLabel: '未激活',
    riskAdminLabel: '管理员权限',
    riskGroupLabel: '用户组',
    riskSuspensionLabel: '封禁状态',
    noEmailValueText: '-',
  }),
})

registerAdminUsersPageActionMeta({
  key: 'core-users-page-actions-meta',
  order: 10,
  resolve: () => ({
    loadUsersFailedMessage: '加载用户失败，请稍后重试',
    loadDetailFailedTitle: '加载用户详情失败',
    loadDetailFailedMessage: '未知错误',
    saveRiskConfirmTitle: '保存用户变更',
    saveRiskConfirmMessage: changes => `以下变更会立即影响用户权限或账号状态：${changes}。确定保存吗？`,
    saveConfirmText: '保存',
    saveCancelText: '取消',
    saveSuccessTitle: '用户已保存',
    saveSuccessMessage: '用户资料和状态已更新。',
    saveFailedTitle: '保存失败',
    saveFailedMessage: '未知错误',
    deleteConfirmTitle: '删除用户',
    deleteConfirmMessage: user => `确定删除用户“${user}”吗？该操作不可撤销。`,
    deleteConfirmText: '删除',
    deleteCancelText: '取消',
    deleteSuccessTitle: '用户已删除',
    deleteSuccessMessage: user => `用户“${user}”已删除。`,
    deleteFailedTitle: '删除失败',
    deleteFailedMessage: '未知错误',
  }),
})
