<template>
  <AdminPage
    className="TagsPage"
    icon="fas fa-tags"
    title="标签管理"
    description="管理讨论标签和分类"
  >
    <div class="TagsPage-content">
      <div class="TagsPage-toolbar">
        <button @click="showCreateModal = true" class="Button Button--primary">
          <i class="fas fa-plus"></i>
          创建标签
        </button>
      </div>

      <div class="TagsPage-list">
        <table class="TagTable">
          <thead>
            <tr>
              <th style="width: 50px"></th>
              <th>标签名称</th>
              <th>别名</th>
              <th>描述</th>
              <th>讨论数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="TagTable-loading">加载中...</td>
            </tr>
            <tr v-else-if="tags.length === 0">
              <td colspan="6" class="TagTable-empty">暂无标签</td>
            </tr>
            <tr v-else v-for="tag in tags" :key="tag.id">
              <td>
                <div
                  class="TagColor"
                  :style="{ backgroundColor: tag.color }"
                ></div>
              </td>
              <td>
                <strong>{{ tag.name }}</strong>
              </td>
              <td>{{ tag.slug }}</td>
              <td>{{ tag.description || '-' }}</td>
              <td>{{ tag.discussion_count }}</td>
              <td>
                <button @click="editTag(tag)" class="Button Button--small">
                  编辑
                </button>
                <button @click="deleteTag(tag)" class="Button Button--small Button--danger">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 创建/编辑标签模态框 -->
    <div v-if="showCreateModal || showEditModal" class="Modal" @click.self="closeModal">
      <div class="Modal-content">
        <div class="Modal-header">
          <h3>{{ showEditModal ? '编辑标签' : '创建标签' }}</h3>
          <button @click="closeModal" class="Modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="Modal-body">
          <div class="Form-group">
            <label>标签名称 *</label>
            <input
              v-model="formData.name"
              type="text"
              class="FormControl"
              placeholder="例如：技术讨论"
            />
          </div>

          <div class="Form-group">
            <label>描述</label>
            <textarea
              v-model="formData.description"
              class="FormControl"
              rows="3"
              placeholder="标签的简短描述"
            ></textarea>
          </div>

          <div class="Form-group">
            <label>颜色</label>
            <div class="ColorPicker">
              <input
                v-model="formData.color"
                type="color"
                class="ColorPicker-input"
              />
              <input
                v-model="formData.color"
                type="text"
                class="FormControl ColorPicker-text"
                placeholder="#888888"
              />
            </div>
          </div>

          <div class="Form-group">
            <label>图标（Font Awesome类名）</label>
            <input
              v-model="formData.icon"
              type="text"
              class="FormControl"
              placeholder="例如：fas fa-code"
            />
          </div>
        </div>

        <div class="Modal-footer">
          <button @click="closeModal" class="Button">
            取消
          </button>
          <button @click="saveTag" class="Button Button--primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
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

const tags = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const saving = ref(false)
const editingTag = ref(null)

const formData = ref({
  name: '',
  description: '',
  color: '#888888',
  icon: '',
})

onMounted(() => {
  loadTags()
})

async function loadTags() {
  loading.value = true
  try {
    const data = await api.get('/admin/tags')
    tags.value = data
  } catch (error) {
    console.error('加载标签失败:', error)
  } finally {
    loading.value = false
  }
}

function editTag(tag) {
  editingTag.value = tag
  formData.value = {
    name: tag.name,
    description: tag.description,
    color: tag.color,
    icon: tag.icon,
  }
  showEditModal.value = true
}

async function saveTag() {
  if (!formData.value.name) {
    alert('请输入标签名称')
    return
  }

  saving.value = true
  try {
    if (showEditModal.value) {
      // 更新标签
      await api.put(`/admin/tags/${editingTag.value.id}`, formData.value)
    } else {
      // 创建标签
      await api.post('/admin/tags', formData.value)
    }

    closeModal()
    loadTags()
  } catch (error) {
    console.error('保存标签失败:', error)
    const errorMsg = error.response?.data?.error
      || error.response?.data?.detail
      || error.message
      || '未知错误'
    alert('保存失败: ' + errorMsg)
  } finally {
    saving.value = false
  }
}

async function deleteTag(tag) {
  if (!confirm(`确定要删除标签"${tag.name}"吗？这将影响 ${tag.discussion_count} 个讨论。`)) {
    return
  }

  try {
    await api.delete(`/admin/tags/${tag.id}`)
    loadTags()
  } catch (error) {
    alert('删除失败: ' + (error.response?.data?.error || '未知错误'))
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  editingTag.value = null
  formData.value = {
    name: '',
    description: '',
    color: '#888888',
    icon: '',
  }
}
</script>

<style scoped>
.TagsPage-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.TagsPage-toolbar {
  display: flex;
  justify-content: flex-end;
}

.Button {
  background: #f5f8fa;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.Button:hover:not(:disabled) {
  background: #e8eef5;
  border-color: #4d698e;
}

.Button--primary {
  background: #4d698e;
  color: white;
  border-color: #4d698e;
}

.Button--primary:hover:not(:disabled) {
  background: #3d5875;
}

.Button--small {
  padding: 4px 10px;
  font-size: 12px;
}

.Button--danger {
  color: #e74c3c;
}

.Button--danger:hover:not(:disabled) {
  background: #fee;
  border-color: #e74c3c;
}

.Button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.TagTable {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #e3e8ed;
  border-radius: 3px;
}

.TagTable thead th {
  padding: 12px;
  background: #f5f8fa;
  border-bottom: 2px solid #e3e8ed;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  color: #666;
}

.TagTable tbody td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.TagTable tbody tr:hover {
  background: #fafbfc;
}

.TagTable-loading,
.TagTable-empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.TagColor {
  width: 30px;
  height: 30px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 模态框 */
.Modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.Modal-content {
  background: white;
  border-radius: 3px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
}

.Modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e3e8ed;
}

.Modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.Modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.Modal-close:hover {
  background: #f5f8fa;
  color: #333;
}

.Modal-body {
  padding: 20px;
}

.Modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e3e8ed;
}

.Form-group {
  margin-bottom: 20px;
}

.Form-group:last-child {
  margin-bottom: 0;
}

.Form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.FormControl {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.FormControl:focus {
  outline: none;
  border-color: #4d698e;
}

.ColorPicker {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ColorPicker-input {
  width: 60px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
}

.ColorPicker-text {
  flex: 1;
}
</style>
