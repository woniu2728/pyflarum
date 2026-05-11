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
