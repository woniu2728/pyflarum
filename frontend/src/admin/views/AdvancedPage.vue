<template>
  <AdminPage
    className="AdvancedPage"
    icon="fas fa-cog"
    title="高级设置"
    description="配置缓存、队列和维护模式"
  >
    <div class="AdvancedPage-content">
      <div class="Form-section">
        <h3 class="Section-title">缓存设置</h3>

        <div class="Form-group">
          <label>缓存驱动</label>
          <select v-model="settings.cache_driver" class="FormControl">
            <option value="file">文件</option>
            <option value="redis">Redis</option>
            <option value="memcached">Memcached</option>
          </select>
          <p class="Form-help">选择缓存存储方式</p>
        </div>

        <div class="Form-group">
          <label>缓存时间（秒）</label>
          <input
            v-model.number="settings.cache_lifetime"
            type="number"
            class="FormControl"
            placeholder="3600"
          />
          <p class="Form-help">默认缓存过期时间</p>
        </div>

        <div class="Form-actions">
          <button @click="clearCache" class="Button" :disabled="clearing">
            {{ clearing ? '清除中...' : '清除缓存' }}
          </button>
        </div>
      </div>

      <div class="Form-section">
        <h3 class="Section-title">队列设置</h3>

        <div class="Form-group">
          <label>队列驱动</label>
          <select v-model="settings.queue_driver" class="FormControl">
            <option value="sync">同步</option>
            <option value="database">数据库</option>
            <option value="redis">Redis</option>
          </select>
          <p class="Form-help">选择队列处理方式</p>
        </div>

        <div class="Form-group">
          <label>
            <input
              v-model="settings.queue_enabled"
              type="checkbox"
              class="FormControl-checkbox"
            />
            启用队列处理
          </label>
          <p class="Form-help">异步处理耗时任务</p>
        </div>
      </div>

      <div class="Form-section">
        <h3 class="Section-title">维护模式</h3>

        <div class="Form-group">
          <label>
            <input
              v-model="settings.maintenance_mode"
              type="checkbox"
              class="FormControl-checkbox"
            />
            启用维护模式
          </label>
          <p class="Form-help">启用后，普通用户将无法访问论坛</p>
        </div>

        <div class="Form-group">
          <label>维护提示信息</label>
          <textarea
            v-model="settings.maintenance_message"
            class="FormControl"
            rows="3"
            placeholder="论坛正在维护中，请稍后再试..."
          ></textarea>
        </div>
      </div>

      <div class="Form-section">
        <h3 class="Section-title">调试设置</h3>

        <div class="Form-group">
          <label>
            <input
              v-model="settings.debug_mode"
              type="checkbox"
              class="FormControl-checkbox"
            />
            启用调试模式
          </label>
          <p class="Form-help">显示详细错误信息（仅用于开发环境）</p>
        </div>

        <div class="Form-group">
          <label>
            <input
              v-model="settings.log_queries"
              type="checkbox"
              class="FormControl-checkbox"
            />
            记录数据库查询
          </label>
          <p class="Form-help">记录所有数据库查询到日志</p>
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
  cache_driver: 'file',
  cache_lifetime: 3600,
  queue_driver: 'sync',
  queue_enabled: false,
  maintenance_mode: false,
  maintenance_message: '',
  debug_mode: false,
  log_queries: false,
})

const saving = ref(false)
const clearing = ref(false)
const saveSuccess = ref(false)
const saveError = ref(false)

onMounted(async () => {
  try {
    const data = await api.get('/admin/advanced')
    settings.value = { ...settings.value, ...data }
  } catch (error) {
    console.error('加载高级设置失败:', error)
  }
})

async function saveSettings() {
  saving.value = true
  saveSuccess.value = false
  saveError.value = false

  try {
    await api.post('/admin/advanced', settings.value)
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('保存高级设置失败:', error)
    saveError.value = true
  } finally {
    saving.value = false
  }
}

async function clearCache() {
  clearing.value = true
  try {
    await api.post('/admin/cache/clear')
    alert('缓存已清除')
  } catch (error) {
    alert('清除缓存失败: ' + (error.response?.data?.error || '未知错误'))
  } finally {
    clearing.value = false
  }
}
</script>

<style scoped>
.AdvancedPage-content {
  max-width: 800px;
}

.Form-section {
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

.Button {
  background: #f5f8fa;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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

.Button:disabled {
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
