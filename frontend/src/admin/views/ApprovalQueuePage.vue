<template>
  <AdminPage
    className="ApprovalQueuePage"
    icon="fas fa-user-check"
    title="审核队列"
    description="审核未验证邮箱用户提交的讨论和回复"
  >
    <div class="ApprovalQueue-toolbar">
      <button
        v-for="option in filters"
        :key="option.value"
        @click="changeType(option.value)"
        class="FilterButton"
        :class="{ active: contentType === option.value }"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="ApprovalQueue-list">
      <div v-if="loading" class="ApprovalQueue-empty">加载中...</div>
      <div v-else-if="items.length === 0" class="ApprovalQueue-empty">当前没有待审核内容</div>
      <div v-else class="ApprovalList">
        <article v-for="item in items" :key="`${item.type}-${item.id}`" class="ApprovalCard">
          <div class="ApprovalCard-header">
            <div>
              <div class="ApprovalCard-title">
                <span class="ApprovalType" :class="`ApprovalType--${item.type}`">
                  {{ item.type === 'discussion' ? '讨论' : '回复' }}
                </span>
                {{ item.title }}
              </div>
              <div class="ApprovalCard-meta">
                作者：{{ item.author?.display_name || item.author?.username || '未知' }}
                · 提交于 {{ formatDate(item.created_at) }}
                <span v-if="item.post?.number"> · 楼层 #{{ item.post.number }}</span>
              </div>
            </div>
            <a :href="itemLink(item)" class="ApprovalCard-link">查看内容</a>
          </div>

          <div class="ApprovalCard-body">
            <p>{{ item.content || '暂无正文内容' }}</p>
          </div>

          <div class="ApprovalCard-actions">
            <button @click="openAction(item, 'approve')" class="Button Button--primary">审核通过</button>
            <button @click="openAction(item, 'reject')" class="Button Button--secondary">拒绝并隐藏</button>
          </div>
        </article>
      </div>
    </div>

    <div v-if="showModal" class="Modal" @click.self="closeModal">
      <div class="Modal-content">
        <div class="Modal-header">
          <h3>{{ pendingAction === 'approve' ? '审核通过' : '拒绝内容' }}</h3>
          <button @click="closeModal" class="Modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="Modal-body">
          <div class="Form-group">
            <label>备注</label>
            <textarea
              v-model="actionNote"
              class="FormControl"
              rows="4"
              :placeholder="pendingAction === 'approve' ? '例如：内容符合社区规范，已放行' : '例如：内容质量不足，已拒绝'"
            ></textarea>
          </div>
        </div>
        <div class="Modal-footer">
          <button @click="closeModal" class="Button Button--secondary">取消</button>
          <button @click="submitAction" class="Button Button--primary" :disabled="saving">
            {{ saving ? '提交中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </AdminPage>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AdminPage from '../components/AdminPage.vue'
import api from '../../api'

const loading = ref(true)
const saving = ref(false)
const items = ref([])
const contentType = ref('all')
const showModal = ref(false)
const selectedItem = ref(null)
const pendingAction = ref('approve')
const actionNote = ref('')

const filters = [
  { value: 'all', label: '全部' },
  { value: 'discussion', label: '讨论' },
  { value: 'post', label: '回复' },
]

onMounted(() => {
  loadItems()
})

async function loadItems() {
  loading.value = true
  try {
    const data = await api.get('/admin/approval-queue', {
      params: { content_type: contentType.value }
    })
    items.value = data.data || []
  } catch (error) {
    console.error('加载审核队列失败:', error)
  } finally {
    loading.value = false
  }
}

function changeType(value) {
  if (contentType.value === value) return
  contentType.value = value
  loadItems()
}

function itemLink(item) {
  if (item.type === 'discussion') {
    return `/d/${item.discussion.id}`
  }
  return `/d/${item.discussion.id}?near=${item.post.number}`
}

function openAction(item, action) {
  selectedItem.value = item
  pendingAction.value = action
  actionNote.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedItem.value = null
  pendingAction.value = 'approve'
  actionNote.value = ''
  saving.value = false
}

async function submitAction() {
  if (!selectedItem.value) return

  saving.value = true
  try {
    await api.post(
      `/admin/approval-queue/${selectedItem.value.type}/${selectedItem.value.id}/${pendingAction.value}`,
      { note: actionNote.value }
    )
    closeModal()
    await loadItems()
  } catch (error) {
    console.error('审核提交失败:', error)
    alert('提交失败: ' + (error.response?.data?.error || error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知时间'
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.ApprovalQueue-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.FilterButton,
.Button {
  border-radius: 3px;
  transition: all 0.2s;
}

.FilterButton {
  border: 1px solid #dbe2ea;
  background: white;
  padding: 8px 14px;
  cursor: pointer;
}

.FilterButton.active {
  background: #4d698e;
  border-color: #4d698e;
  color: white;
}

.ApprovalQueue-empty {
  padding: 40px;
  background: white;
  border: 1px solid #e3e8ed;
  border-radius: 3px;
  text-align: center;
  color: #999;
}

.ApprovalList {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ApprovalCard {
  background: white;
  border: 1px solid #e3e8ed;
  border-radius: 3px;
  padding: 18px 20px;
}

.ApprovalCard-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.ApprovalCard-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #2f3c4d;
}

.ApprovalType {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.ApprovalType--discussion {
  background: #e8f1fb;
  color: #2d6aa3;
}

.ApprovalType--post {
  background: #f3ecff;
  color: #7046a3;
}

.ApprovalCard-meta {
  margin-top: 6px;
  color: #7f8c8d;
  font-size: 13px;
}

.ApprovalCard-link {
  color: #4d698e;
  white-space: nowrap;
}

.ApprovalCard-body {
  background: #f8fafc;
  border-radius: 3px;
  padding: 14px;
}

.ApprovalCard-body p {
  margin: 0;
  color: #556270;
  line-height: 1.7;
  white-space: pre-wrap;
}

.ApprovalCard-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.Button {
  border: 1px solid transparent;
  padding: 8px 14px;
  cursor: pointer;
}

.Button--primary {
  background: #4d698e;
  color: white;
}

.Button--secondary {
  background: #f5f8fa;
  border-color: #dbe2ea;
}

.Modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.Modal-content {
  width: min(520px, calc(100vw - 32px));
  background: white;
  border-radius: 3px;
}

.Modal-header,
.Modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
}

.Modal-header {
  border-bottom: 1px solid #e3e8ed;
}

.Modal-footer {
  justify-content: flex-end;
  border-top: 1px solid #e3e8ed;
}

.Modal-header h3 {
  margin: 0;
}

.Modal-close {
  border: 0;
  background: transparent;
  color: #999;
  font-size: 20px;
  cursor: pointer;
}

.Modal-body {
  padding: 20px;
}

.Form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.FormControl {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  resize: vertical;
}

@media (max-width: 768px) {
  .ApprovalQueue-toolbar {
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .ApprovalQueue-toolbar::-webkit-scrollbar {
    display: none;
  }

  .FilterButton {
    flex: 0 0 auto;
    min-height: 38px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .ApprovalCard {
    border-radius: 16px;
    padding: 16px;
  }

  .ApprovalCard-header,
  .ApprovalCard-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .ApprovalCard-title {
    align-items: flex-start;
    flex-wrap: wrap;
    font-size: 16px;
  }

  .ApprovalCard-link,
  .ApprovalCard-actions .Button {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .Modal {
    align-items: flex-end;
    padding: 0;
  }

  .Modal-content {
    width: 100%;
    max-width: none;
    border-radius: 18px 18px 0 0;
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
