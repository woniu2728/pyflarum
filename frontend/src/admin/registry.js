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
