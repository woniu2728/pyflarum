<template>
  <AdminPage
    className="UsersPage"
    icon="fas fa-users"
    title="用户管理"
    description="管理论坛用户"
  >
    <div class="UsersPage-content">
      <!-- 搜索栏 -->
      <div class="UsersPage-search">
        <input
          v-model="searchQuery"
          type="text"
          class="FormControl"
          placeholder="搜索用户名或邮箱..."
          @input="handleSearch"
        />
      </div>

      <!-- 用户列表 -->
      <div class="UsersPage-list">
        <table class="UserTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>邮箱</th>
              <th>显示名称</th>
              <th>讨论</th>
              <th>回复</th>
              <th>加入时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="UserTable-loading">加载中...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="9" class="UserTable-empty">暂无用户</td>
            </tr>
            <tr v-else v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>
                <strong>{{ user.username }}</strong>
                <span v-if="user.is_staff" class="UserBadge UserBadge--admin">管理员</span>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.display_name }}</td>
              <td>{{ user.discussion_count }}</td>
              <td>{{ user.comment_count }}</td>
              <td>{{ formatDate(user.joined_at) }}</td>
              <td>
                <span
                  class="UserStatus"
                  :class="user.is_email_confirmed ? 'UserStatus--active' : 'UserStatus--pending'"
                >
                  {{ user.is_email_confirmed ? '已激活' : '未激活' }}
                </span>
              </td>
              <td>
                <button @click="editUser(user)" class="Button Button--small">
                  编辑
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="total > limit" class="UsersPage-pagination">
        <button
          @click="changePage(page - 1)"
          :disabled="page === 1"
          class="Button"
        >
          上一页
        </button>
        <span class="Pagination-info">
          第 {{ page }} 页，共 {{ Math.ceil(total / limit) }} 页
        </span>
        <button
          @click="changePage(page + 1)"
          :disabled="page >= Math.ceil(total / limit)"
          class="Button"
        >
          下一页
        </button>
      </div>
    </div>
  </AdminPage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminPage from '../components/AdminPage.vue'
import api from '../../api'

const users = ref([])
const loading = ref(true)
const searchQuery = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)

let searchTimeout = null

onMounted(() => {
  loadUsers()
})

async function loadUsers() {
  loading.value = true
  try {
    const data = await api.get('/admin/users', {
      params: {
        page: page.value,
        limit: limit.value,
        q: searchQuery.value || undefined,
      },
    })
    users.value = data.data
    total.value = data.total
  } catch (error) {
    console.error('加载用户失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 500)
}

function changePage(newPage) {
  page.value = newPage
  loadUsers()
}

function editUser(user) {
  alert(`编辑用户: ${user.username}`)
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.UsersPage-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.UsersPage-search {
  max-width: 400px;
}

.FormControl {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
}

.FormControl:focus {
  outline: none;
  border-color: #4d698e;
}

.UserTable {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #e3e8ed;
  border-radius: 3px;
}

.UserTable thead th {
  padding: 12px;
  background: #f5f8fa;
  border-bottom: 2px solid #e3e8ed;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  color: #666;
}

.UserTable tbody td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.UserTable tbody tr:hover {
  background: #fafbfc;
}

.UserTable-loading,
.UserTable-empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.UserBadge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
}

.UserBadge--admin {
  background: #e74c3c;
  color: white;
}

.UserStatus {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
}

.UserStatus--active {
  background: #d4edda;
  color: #155724;
}

.UserStatus--pending {
  background: #fff3cd;
  color: #856404;
}

.Button {
  background: #f5f8fa;
  border: 1px solid #ddd;
  padding: 6px 12px;
  border-radius: 3px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.Button:hover:not(:disabled) {
  background: #e8eef5;
  border-color: #4d698e;
}

.Button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.Button--small {
  padding: 4px 10px;
  font-size: 12px;
}

.UsersPage-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px 0;
}

.Pagination-info {
  font-size: 14px;
  color: #666;
}
</style>
