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

      <section class="Form-section">
        <div class="Form-sectionHeader">
          <h3>SEO 设置</h3>
          <p>这些字段会进入公开论坛设置，并在前台页面标题与 meta 标签中生效。</p>
        </div>

        <div class="Form-group">
          <label>SEO 标题</label>
          <input
            v-model="settings.seo_title"
            type="text"
            class="FormControl"
            placeholder="留空时使用论坛名称"
          />
          <p class="Form-help">建议控制在 30-60 字符，留空时自动回退到论坛名称。</p>
        </div>

        <div class="Form-group">
          <label>SEO 描述</label>
          <textarea
            v-model="settings.seo_description"
            class="FormControl"
            rows="3"
            placeholder="留空时使用论坛描述"
          ></textarea>
          <p class="Form-help">建议控制在 80-160 字符，留空时自动回退到论坛描述。</p>
        </div>

        <div class="Form-group">
          <label>SEO 关键词</label>
          <input
            v-model="settings.seo_keywords"
            type="text"
            class="FormControl"
            placeholder="论坛, 社区, 技术讨论"
          />
          <p class="Form-help">使用英文逗号分隔多个关键词，例如：Python, Django, Vue。</p>
        </div>

        <div class="Form-grid">
          <label class="Form-toggle">
            <input
              v-model="settings.seo_robots_index"
              type="checkbox"
              class="FormControl-checkbox"
            />
            <span>允许搜索引擎建立索引</span>
          </label>

          <label class="Form-toggle">
            <input
              v-model="settings.seo_robots_follow"
              type="checkbox"
              class="FormControl-checkbox"
            />
            <span>允许搜索引擎跟踪页面链接</span>
          </label>
        </div>

        <div class="Form-note Form-note--compact">
          SEO 设置保存后，对外访问的论坛页面通常刷新即可生效；若站点前面接了 CDN 或反向代理缓存，请同步清理缓存。
        </div>
      </section>

      <section class="Form-section">
        <div class="Form-sectionHeader">
          <h3>站点公告</h3>
          <p>在前台顶部展示一条全站公告，适合发布维护预告、运营通知或临时提醒。</p>
        </div>

        <label class="Form-toggle Announcement-toggle">
          <input
            v-model="settings.announcement_enabled"
            type="checkbox"
            class="FormControl-checkbox"
          />
          <span>启用全站公告</span>
        </label>

        <div class="Form-group">
          <label>公告内容</label>
          <textarea
            v-model="settings.announcement_message"
            class="FormControl"
            rows="3"
            maxlength="240"
            placeholder="例如：今晚 23:00-23:30 将进行短暂维护。"
          ></textarea>
          <p class="Form-help">最多 240 个字符，内容为空时前台不会展示公告。</p>
        </div>

        <div class="Form-group">
          <label>公告样式</label>
          <select v-model="settings.announcement_tone" class="FormControl">
            <option value="info">信息</option>
            <option value="warning">提醒</option>
            <option value="success">成功</option>
          </select>
        </div>
      </section>

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
      </div>
      <AdminInlineMessage v-if="saveSuccess" tone="success">保存成功</AdminInlineMessage>
      <AdminInlineMessage v-if="saveError" tone="danger">保存失败，请重试</AdminInlineMessage>
    </form>
  </AdminPage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminInlineMessage from '../components/AdminInlineMessage.vue'
import AdminPage from '../components/AdminPage.vue'
import { useAdminSaveFeedback } from '../composables/useAdminSaveFeedback'
import api from '../../api'

const settings = ref({
  forum_title: '',
  forum_description: '',
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  seo_robots_index: true,
  seo_robots_follow: true,
  announcement_enabled: false,
  announcement_message: '',
  announcement_tone: 'info',
  default_locale: 'zh-CN',
  show_language_selector: false,
})

const saving = ref(false)
const { saveSuccess, saveError, resetSaveFeedback, showSaveSuccess, showSaveError } = useAdminSaveFeedback()

onMounted(async () => {
  try {
    const data = await api.get('/admin/settings')
    settings.value = {
      forum_title: data.forum_title || '',
      forum_description: data.forum_description || '',
      seo_title: data.seo_title || '',
      seo_description: data.seo_description || '',
      seo_keywords: data.seo_keywords || '',
      seo_robots_index: data.seo_robots_index !== false,
      seo_robots_follow: data.seo_robots_follow !== false,
      announcement_enabled: Boolean(data.announcement_enabled),
      announcement_message: data.announcement_message || '',
      announcement_tone: ['info', 'warning', 'success'].includes(data.announcement_tone) ? data.announcement_tone : 'info',
      default_locale: data.default_locale || 'zh-CN',
      show_language_selector: Boolean(data.show_language_selector),
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
})

async function handleSubmit() {
  saving.value = true
  resetSaveFeedback()

  try {
    await api.post('/admin/settings', settings.value)
    showSaveSuccess()
  } catch (error) {
    console.error('保存设置失败:', error)
    showSaveError()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.Form {
  max-width: 600px;
}

.Form-section {
  padding: 18px 18px 4px;
  background: var(--forum-bg-elevated-strong);
}

.Form-sectionHeader h3 {
  font-size: 15px;
}

.Form-note {
  margin-bottom: 25px;
}

.Form-note--compact {
  margin-top: -6px;
  margin-bottom: 20px;
}

.Form-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 22px;
}

.Form-toggle {
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-md);
  background: var(--forum-bg-elevated);
}

.Form-actions {
  padding-top: 10px;
}

.Announcement-toggle {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .Form {
    max-width: none;
  }

  .Form-section {
    padding: 16px 16px 2px;
    border-radius: 14px;
  }

  .Form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
