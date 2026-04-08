<template>
  <AdminPage
    className="BasicsPage"
    icon="fas fa-pencil-alt"
    title="基础设置"
    description="配置论坛的基本信息"
  >
    <form @submit.prevent="handleSubmit" class="Form">
      <div class="Form-group">
        <label>论坛名称</label>
        <input
          v-model="settings.forum_title"
          type="text"
          class="FormControl"
          placeholder="我的论坛"
        />
        <p class="Form-help">论坛的名称，显示在页面标题和头部</p>
      </div>

      <div class="Form-group">
        <label>论坛描述</label>
        <textarea
          v-model="settings.forum_description"
          class="FormControl"
          rows="3"
          placeholder="一个很棒的社区"
        ></textarea>
        <p class="Form-help">简短描述你的论坛，用于SEO</p>
      </div>

      <div class="Form-group">
        <label>欢迎标题</label>
        <input
          v-model="settings.welcome_title"
          type="text"
          class="FormControl"
          placeholder="欢迎来到我的论坛"
        />
      </div>

      <div class="Form-group">
        <label>欢迎消息</label>
        <textarea
          v-model="settings.welcome_message"
          class="FormControl"
          rows="3"
          placeholder="这是一个友好的社区..."
        ></textarea>
      </div>

      <div class="Form-group">
        <label>默认语言</label>
        <select v-model="settings.default_locale" class="FormControl">
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>

      <div class="Form-group">
        <label>
          <input
            v-model="settings.show_language_selector"
            type="checkbox"
            class="FormControl-checkbox"
          />
          显示语言选择器
        </label>
      </div>

      <div class="Form-actions">
        <button
          type="submit"
          class="Button Button--primary"
          :disabled="saving"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
        <span v-if="saveSuccess" class="Form-success">✓ 保存成功</span>
        <span v-if="saveError" class="Form-error">保存失败，请重试</span>
      </div>
    </form>
  </AdminPage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminPage from '../components/AdminPage.vue'
import api from '../../api'

const settings = ref({
  forum_title: '',
  forum_description: '',
  welcome_title: '',
  welcome_message: '',
  default_locale: 'zh-CN',
  show_language_selector: false,
})

const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref(false)

onMounted(async () => {
  try {
    const data = await api.get('/admin/settings')
    settings.value = { ...settings.value, ...data }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
})

async function handleSubmit() {
  saving.value = true
  saveSuccess.value = false
  saveError.value = false

  try {
    await api.post('/admin/settings', settings.value)
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('保存设置失败:', error)
    saveError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.Form {
  max-width: 600px;
}

.Form-group {
  margin-bottom: 25px;
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

.FormControl-checkbox {
  width: auto;
  margin-right: 8px;
}

.Form-help {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #999;
}

.Form-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-top: 10px;
}

.Button--primary {
  background: #4d698e;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.Button--primary:hover:not(:disabled) {
  background: #3d5875;
}

.Button--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.Form-success {
  color: #27ae60;
  font-size: 14px;
  font-weight: 500;
}

.Form-error {
  color: #e74c3c;
  font-size: 14px;
  font-weight: 500;
}
</style>
