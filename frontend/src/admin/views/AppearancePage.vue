<template>
  <AdminPage
    className="AppearancePage"
    icon="fas fa-paint-brush"
    title="外观设置"
    description="自定义论坛的外观和主题"
  >
    <div class="AppearancePage-content">
      <div class="AppearancePage-section">
        <h3 class="Section-title">颜色</h3>
        <div class="Form-group">
          <label>主题色</label>
          <div class="ColorPicker">
            <input
              v-model="settings.primary_color"
              type="color"
              class="ColorPicker-input"
            />
            <input
              v-model="settings.primary_color"
              type="text"
              class="FormControl ColorPicker-text"
              placeholder="#4d698e"
            />
          </div>
          <p class="Form-help">论坛的主题颜色</p>
        </div>

        <div class="Form-group">
          <label>强调色</label>
          <div class="ColorPicker">
            <input
              v-model="settings.accent_color"
              type="color"
              class="ColorPicker-input"
            />
            <input
              v-model="settings.accent_color"
              type="text"
              class="FormControl ColorPicker-text"
              placeholder="#e74c3c"
            />
          </div>
          <p class="Form-help">用于按钮和链接的强调色</p>
        </div>
      </div>

      <div class="AppearancePage-section">
        <h3 class="Section-title">Logo</h3>
        <div class="Form-group">
          <label>Logo URL</label>
          <input
            v-model="settings.logo_url"
            type="text"
            class="FormControl"
            placeholder="https://example.com/logo.png"
          />
          <p class="Form-help">论坛Logo的URL地址</p>
        </div>

        <div class="Form-group">
          <label>Favicon URL</label>
          <input
            v-model="settings.favicon_url"
            type="text"
            class="FormControl"
            placeholder="https://example.com/favicon.ico"
          />
          <p class="Form-help">浏览器标签页图标的URL地址</p>
        </div>
      </div>

      <div class="AppearancePage-section">
        <h3 class="Section-title">自定义样式</h3>
        <div class="Form-group">
          <label>自定义CSS</label>
          <textarea
            v-model="settings.custom_css"
            class="FormControl"
            rows="10"
            placeholder="/* 在这里添加自定义CSS */"
          ></textarea>
          <p class="Form-help">添加自定义CSS样式来进一步定制论坛外观</p>
        </div>

        <div class="Form-group">
          <label>自定义Header HTML</label>
          <textarea
            v-model="settings.custom_header"
            class="FormControl"
            rows="5"
            placeholder="<!-- 在这里添加自定义HTML -->"
          ></textarea>
          <p class="Form-help">在页面头部添加自定义HTML（如统计代码）</p>
        </div>
      </div>

      <div class="Form-actions">
        <button
          @click="saveSettings"
          class="Button Button--primary"
          :disabled="saving"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
        <span v-if="saveSuccess" class="Form-success">✓ 保存成功</span>
        <span v-if="saveError" class="Form-error">保存失败，请重试</span>
      </div>
    </div>
  </AdminPage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminPage from '../components/AdminPage.vue'
import api from '../../api'

const settings = ref({
  primary_color: '#4d698e',
  accent_color: '#e74c3c',
  logo_url: '',
  favicon_url: '',
  custom_css: '',
  custom_header: '',
})

const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref(false)

onMounted(async () => {
  try {
    const data = await api.get('/admin/appearance')
    settings.value = { ...settings.value, ...data }
  } catch (error) {
    console.error('加载外观设置失败:', error)
  }
})

async function saveSettings() {
  saving.value = true
  saveSuccess.value = false
  saveError.value = false

  try {
    await api.post('/admin/appearance', settings.value)
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('保存外观设置失败:', error)
    saveError.value = true
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.AppearancePage-content {
  max-width: 800px;
}

.AppearancePage-section {
  background: white;
  border: 1px solid #e3e8ed;
  border-radius: 3px;
  padding: 20px;
  margin-bottom: 20px;
}

.Section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #e3e8ed;
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
  max-width: 200px;
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
