<template>
  <AdminPage
    className="FlagsPage"
    icon="fas fa-flag"
    title="举报管理"
    description="处理用户提交的帖子举报"
  >
    <div class="FlagsPage-toolbar">
      <button
        v-for="option in filters"
        :key="option.value"
        @click="changeStatus(option.value)"
        class="FilterButton"
        :class="{ active: status === option.value }"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="FlagsPage-list">
      <div v-if="loading" class="FlagsPage-empty">加载中...</div>
      <div v-else-if="flags.length === 0" class="FlagsPage-empty">暂无举报记录</div>
      <div v-else class="FlagList">
        <article v-for="flag in flags" :key="flag.id" class="FlagCard">
          <div class="FlagCard-header">
            <div>
              <div class="FlagCard-title">
                {{ flag.reason }}
                <span class="FlagStatus" :class="`FlagStatus--${flag.status}`">
                  {{ statusLabel(flag.status) }}
                </span>
              </div>
              <div class="FlagCard-meta">
                举报人：{{ flag.user.display_name || flag.user.username }}
                · 讨论：{{ flag.post.discussion_title }}
                · 帖子 #{{ flag.post.number }}
              </div>
            </div>
            <a :href="`/d/${flag.post.discussion_id}?near=${flag.post.number}`" class="FlagCard-link">
              查看帖子
            </a>
          </div>

          <div class="FlagCard-body">
            <div class="FlagBlock">
              <strong>举报说明</strong>
              <p>{{ flag.message || '用户未填写补充说明' }}</p>
            </div>
            <div class="FlagBlock">
              <strong>帖子内容</strong>
              <p>{{ flag.post.content }}</p>
            </div>
          </div>

          <div v-if="flag.status === 'open'" class="FlagCard-actions">
            <button @click="openResolve(flag, 'resolved')" class="Button Button--primary">标记已处理</button>
            <button @click="openResolve(flag, 'ignored')" class="Button Button--secondary">忽略举报</button>
          </div>
          <div v-else class="FlagCard-footer">
            处理人：{{ flag.resolved_by?.display_name || flag.resolved_by?.username || '未知' }}
            <span v-if="flag.resolution_note"> · 备注：{{ flag.resolution_note }}</span>
          </div>
        </article>
      </div>
    </div>

    <div v-if="showResolveModal" class="Modal" @click.self="closeResolveModal">
      <div class="Modal-content">
        <div class="Modal-header">
          <h3>{{ pendingStatus === 'resolved' ? '标记举报已处理' : '忽略举报' }}</h3>
          <button @click="closeResolveModal" class="Modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="Modal-body">
          <div class="Form-group">
            <label>处理备注</label>
            <textarea
              v-model="resolutionNote"
              class="FormControl"
              rows="4"
              :placeholder="pendingStatus === 'resolved' ? '例如：已隐藏帖子并警告用户' : '例如：举报理由不足，暂不处理'"
            ></textarea>
          </div>
        </div>
        <div class="Modal-footer">
          <button @click="closeResolveModal" class="Button Button--secondary">取消</button>
          <button @click="resolveFlag" class="Button Button--primary" :disabled="saving">
            {{ saving ? '提交中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </AdminPage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminPage from '../components/AdminPage.vue'
import api from '../../api'

const loading = ref(true)
const saving = ref(false)
const flags = ref([])
const status = ref('open')
const showResolveModal = ref(false)
const pendingStatus = ref('resolved')
const selectedFlag = ref(null)
const resolutionNote = ref('')

const filters = [
  { value: 'open', label: '待处理' },
  { value: 'resolved', label: '已处理' },
  { value: 'ignored', label: '已忽略' },
]

onMounted(() => {
  loadFlags()
})

async function loadFlags() {
  loading.value = true
  try {
    const data = await api.get('/admin/flags', {
      params: { status: status.value }
    })
    flags.value = data.data || []
  } catch (error) {
    console.error('加载举报失败:', error)
  } finally {
    loading.value = false
  }
}

function changeStatus(nextStatus) {
  if (status.value === nextStatus) return
  status.value = nextStatus
  loadFlags()
}

function statusLabel(value) {
  if (value === 'resolved') return '已处理'
  if (value === 'ignored') return '已忽略'
  return '待处理'
}

function openResolve(flag, nextStatus) {
  selectedFlag.value = flag
  pendingStatus.value = nextStatus
  resolutionNote.value = ''
  showResolveModal.value = true
}

function closeResolveModal() {
  showResolveModal.value = false
  selectedFlag.value = null
  pendingStatus.value = 'resolved'
  resolutionNote.value = ''
  saving.value = false
}

async function resolveFlag() {
  if (!selectedFlag.value) return

  saving.value = true
  try {
    await api.post(`/admin/flags/${selectedFlag.value.id}/resolve`, {
      status: pendingStatus.value,
      resolution_note: resolutionNote.value,
    })
    closeResolveModal()
    await loadFlags()
  } catch (error) {
    console.error('处理举报失败:', error)
    alert('处理失败: ' + (error.response?.data?.error || error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.FlagsPage-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.FilterButton {
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-sm);
  background: var(--forum-bg-elevated);
  padding: 8px 14px;
  cursor: pointer;
  color: var(--forum-text-muted);
  transition: all 0.2s;
}

.FilterButton.active {
  background: var(--forum-primary-color);
  border-color: var(--forum-primary-color);
  color: var(--forum-text-inverse);
}

.FlagsPage-empty {
  padding: 40px;
  background: var(--forum-bg-elevated);
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-sm);
  text-align: center;
  color: var(--forum-text-soft);
  box-shadow: var(--forum-shadow-sm);
}

.FlagList {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.FlagCard {
  background: var(--forum-bg-elevated);
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-md);
  padding: 18px 20px;
  box-shadow: var(--forum-shadow-sm);
}

.FlagCard-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.FlagCard-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--forum-text-color);
}

.FlagCard-meta {
  margin-top: 6px;
  color: var(--forum-text-soft);
  font-size: var(--forum-font-size-sm);
}

.FlagStatus {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--forum-radius-pill);
  font-size: var(--forum-font-size-xs);
  font-weight: 600;
}

.FlagStatus--open {
  background: var(--forum-warning-bg-strong);
  color: var(--forum-warning-color);
}

.FlagStatus--resolved {
  background: color-mix(in srgb, var(--forum-success-color) 18%, white);
  color: #155724;
}

.FlagStatus--ignored {
  background: var(--forum-bg-subtle);
  color: var(--forum-text-muted);
}

.FlagCard-link {
  color: var(--forum-primary-color);
  white-space: nowrap;
}

.FlagCard-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.FlagBlock {
  background: var(--forum-bg-elevated-strong);
  border-radius: var(--forum-radius-sm);
  padding: 14px;
}

.FlagBlock strong {
  display: block;
  margin-bottom: 8px;
  color: var(--forum-text-muted);
}

.FlagBlock p {
  margin: 0;
  color: var(--forum-text-muted);
  line-height: 1.6;
  white-space: pre-wrap;
}

.FlagCard-actions,
.FlagCard-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.FlagCard-footer {
  color: var(--forum-text-soft);
  font-size: var(--forum-font-size-sm);
}

.Modal-content {
  width: min(520px, calc(100vw - 32px));
}

@media (max-width: 768px) {
  .FlagsPage-toolbar {
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .FlagsPage-toolbar::-webkit-scrollbar {
    display: none;
  }

  .FilterButton {
    flex: 0 0 auto;
    min-height: 38px;
    border-radius: var(--forum-radius-pill);
    white-space: nowrap;
  }

  .FlagCard {
    border-radius: 16px;
    padding: 16px;
  }

  .FlagCard-header,
  .FlagCard-actions,
  .FlagCard-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .FlagCard-body {
    grid-template-columns: 1fr;
  }

  .FlagCard-title {
    align-items: flex-start;
    flex-wrap: wrap;
    font-size: 16px;
  }

  .FlagCard-link,
  .FlagCard-actions .Button {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .Modal-content {
    width: 100%;
    max-width: none;
  }

  .Modal-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .Modal-footer .Button {
    width: 100%;
    justify-content: center;
  }
}
</style>
