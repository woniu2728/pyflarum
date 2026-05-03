<template>
  <AdminPage
    className="MailPage"
    icon="fas fa-envelope"
    title="邮件设置"
    description="配置 Gmail 或其他 SMTP 服务的发信参数。"
  >
    <AdminStateBlock v-if="!loaded" class="MailPage-loading" tone="subtle">加载中...</AdminStateBlock>

    <template v-else>
      <div class="MailContent">
        <form class="Form" @submit.prevent="handleSubmit">
          <AdminInlineMessage v-if="!configIsSendable" tone="warning">
            当前邮件配置尚不可发送。请先补全发件地址和 SMTP 信息。
          </AdminInlineMessage>

          <section class="Form-section">
            <div class="Form-sectionHeader">
              <h3>发件设置</h3>
              <p>默认按 Gmail SMTP 预填。若使用 Gmail，密码处需要填写应用专用密码。</p>
            </div>

            <div class="Form-grid">
              <div class="Form-group Form-group--full">
                <label for="mail-from">发件地址</label>
                <input
                  id="mail-from"
                  v-model="settings.mail_from"
                  name="mail_from"
                  type="text"
                  class="FormControl"
                  placeholder="Bias <your@gmail.com>"
                />
                <p class="Form-hint">支持 `your@gmail.com` 或 `Bias &lt;your@gmail.com&gt;`。</p>
                <div v-if="fieldErrors.mail_from?.length" class="ValidationError">
                  <p v-for="error in fieldErrors.mail_from" :key="error">{{ error }}</p>
                </div>
              </div>

              <div class="Form-group">
                <label for="mail-host">SMTP 主机</label>
                <input
                  id="mail-host"
                  v-model="settings.mail_host"
                  name="mail_host"
                  type="text"
                  class="FormControl"
                  placeholder="smtp.gmail.com"
                />
                <div v-if="fieldErrors.mail_host?.length" class="ValidationError">
                  <p v-for="error in fieldErrors.mail_host" :key="error">{{ error }}</p>
                </div>
              </div>

              <div class="Form-group">
                <label for="mail-port">SMTP 端口</label>
                <input
                  id="mail-port"
                  v-model="settings.mail_port"
                  name="mail_port"
                  type="number"
                  class="FormControl"
                  placeholder="587"
                />
                <div v-if="fieldErrors.mail_port?.length" class="ValidationError">
                  <p v-for="error in fieldErrors.mail_port" :key="error">{{ error }}</p>
                </div>
              </div>

              <div class="Form-group">
                <label for="mail-encryption">加密方式</label>
                <select
                  id="mail-encryption"
                  v-model="settings.mail_encryption"
                  name="mail_encryption"
                  class="FormControl"
                >
                  <option value="">无</option>
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                </select>
                <p class="Form-hint">Gmail 通常使用 `TLS + 587`。</p>
                <div v-if="fieldErrors.mail_encryption?.length" class="ValidationError">
                  <p v-for="error in fieldErrors.mail_encryption" :key="error">{{ error }}</p>
                </div>
              </div>

              <div class="Form-group">
                <label for="mail-format">邮件格式</label>
                <select
                  id="mail-format"
                  v-model="settings.mail_format"
                  name="mail_format"
                  class="FormControl"
                >
                  <option value="multipart">Multipart</option>
                  <option value="plain">Plain Text</option>
                  <option value="html">HTML</option>
                </select>
                <p class="Form-hint">`Multipart` 兼容性最好。</p>
                <div v-if="fieldErrors.mail_format?.length" class="ValidationError">
                  <p v-for="error in fieldErrors.mail_format" :key="error">{{ error }}</p>
                </div>
              </div>

              <div class="Form-group">
                <label for="mail-username">SMTP 用户名</label>
                <input
                  id="mail-username"
                  v-model="settings.mail_username"
                  name="mail_username"
                  type="text"
                  class="FormControl"
                  placeholder="your@gmail.com"
                />
              </div>

              <div class="Form-group">
                <label for="mail-password">SMTP 密码</label>
                <input
                  id="mail-password"
                  v-model="settings.mail_password"
                  name="mail_password"
                  type="password"
                  class="FormControl"
                  placeholder="应用专用密码"
                />
                <p class="Form-hint">保存后会按当前输入覆盖运行时密码。</p>
              </div>
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
            <AdminInlineMessage v-if="saveError" tone="danger">保存失败，请检查当前配置</AdminInlineMessage>
          </section>
        </form>

        <section class="Form-section Form-section--test">
          <div class="Form-sectionHeader">
            <h3>发送测试邮件</h3>
            <p>优先发送到你填写的测试收件箱。留空时，会回退到当前管理员邮箱。</p>
          </div>

          <div class="TestMailPanel">
            <div class="Form-group TestMailPanel-input">
              <label for="mail-test-recipient">测试收件箱</label>
              <input
                id="mail-test-recipient"
                v-model="settings.mail_test_recipient"
                name="mail_test_recipient"
                type="email"
                class="FormControl"
                placeholder="admin@example.com"
              />
              <p class="Form-hint">建议填写一个真实可收信邮箱，便于直接验证 SMTP 是否可用。</p>
            </div>

            <div class="TestMailPanel-meta">
              <div class="TestMailPanel-target">
                实际发送到：<strong>{{ effectiveTestToEmail || '（未设置）' }}</strong>
              </div>
              <div v-if="hasUnsavedChanges" class="Form-hint">
                请先保存当前修改，再发送测试邮件。
              </div>
            </div>

            <div class="Form-actions TestMailPanel-actions">
              <button
                type="button"
                class="Button Button--primary"
                :disabled="testing || hasUnsavedChanges || !configIsSendable || !effectiveTestToEmail"
                @click="sendTestEmail"
              >
                {{ testing ? '发送中...' : '发送测试邮件' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </template>
  </AdminPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminInlineMessage from '../components/AdminInlineMessage.vue'
import AdminPage from '../components/AdminPage.vue'
import AdminStateBlock from '../components/AdminStateBlock.vue'
import { useAdminSaveFeedback } from '../composables/useAdminSaveFeedback'
import api from '../../api'
import { useModalStore } from '../../stores/modal'

const defaultSettings = () => ({
  mail_from: '',
  mail_format: 'multipart',
  mail_host: 'smtp.gmail.com',
  mail_port: 587,
  mail_encryption: 'tls',
  mail_username: '',
  mail_password: '',
  mail_test_recipient: '',
})

const settings = ref(defaultSettings())
const fieldErrors = ref({})
const loaded = ref(false)
const fallbackTestToEmail = ref('')
const saving = ref(false)
const testing = ref(false)
const initialSnapshot = ref('')
const modalStore = useModalStore()
const { saveSuccess, saveError, resetSaveFeedback, showSaveSuccess, showSaveError } = useAdminSaveFeedback()

const hasUnsavedChanges = computed(() => JSON.stringify(buildConfigPayload()) !== initialSnapshot.value)
const effectiveTestToEmail = computed(() => settings.value.mail_test_recipient || fallbackTestToEmail.value)
const configIsSendable = computed(() => {
  const mailFrom = String(settings.value.mail_from || '').trim()
  const mailHost = String(settings.value.mail_host || '').trim()
  const encryption = String(settings.value.mail_encryption || '').trim().toLowerCase()
  const mailFormat = String(settings.value.mail_format || '').trim().toLowerCase()
  const rawPort = String(settings.value.mail_port || '').trim()
  const port = Number(rawPort)

  return Boolean(
    mailFrom
    && mailHost
    && rawPort
    && Number.isInteger(port)
    && port > 0
    && ['', 'tls', 'ssl'].includes(encryption)
    && ['multipart', 'plain', 'html'].includes(mailFormat)
  )
})

function composeMailFrom(source) {
  const mailFrom = String(source?.mail_from || '').trim()
  if (mailFrom) {
    return mailFrom
  }

  const address = String(source?.mail_from_address || '').trim()
  const name = String(source?.mail_from_name || '').trim()
  if (!address) {
    return ''
  }
  return name ? `${name} <${address}>` : address
}

function buildConfigPayload() {
  return {
    mail_driver: 'smtp',
    mail_from: settings.value.mail_from || '',
    mail_format: settings.value.mail_format || 'multipart',
    mail_host: settings.value.mail_host || '',
    mail_port: settings.value.mail_port || '',
    mail_encryption: settings.value.mail_encryption || '',
    mail_username: settings.value.mail_username || '',
    mail_password: settings.value.mail_password || '',
  }
}

function buildSavePayload() {
  return {
    ...buildConfigPayload(),
    mail_test_recipient: settings.value.mail_test_recipient || '',
  }
}

function applyResponse(data, options = {}) {
  const { preferLocalValues = false } = options
  const source = data?.settings && typeof data.settings === 'object' ? data.settings : data
  const currentValues = { ...settings.value }
  settings.value = {
    ...defaultSettings(),
    ...currentValues,
    ...Object.fromEntries(
      Object.keys(defaultSettings()).map((key) => {
        if (preferLocalValues) {
          return [key, currentValues[key] ?? source?.[key] ?? defaultSettings()[key]]
        }
        return [key, source?.[key] ?? currentValues[key] ?? defaultSettings()[key]]
      })
    ),
  }
  settings.value.mail_from = preferLocalValues
    ? (currentValues.mail_from || composeMailFrom(source) || '')
    : (composeMailFrom(source) || settings.value.mail_from || '')
  fieldErrors.value = data?.errors || {}
  fallbackTestToEmail.value =
    String((preferLocalValues ? currentValues.mail_test_recipient : source?.mail_test_recipient) || '').trim()
    || String(source?.mail_test_recipient || '').trim()
    || String(data?.test_to_email || '').trim()
    || fallbackTestToEmail.value
  initialSnapshot.value = JSON.stringify(buildConfigPayload())
  loaded.value = true
}

async function loadSettings() {
  const data = await api.get('/admin/mail')
  applyResponse(data)
}

onMounted(async () => {
  try {
    await loadSettings()
  } catch (error) {
    console.error('加载邮件设置失败:', error)
    loaded.value = true
  }
})

async function handleSubmit() {
  saving.value = true
  resetSaveFeedback()

  try {
    const data = await api.post('/admin/mail', buildSavePayload())
    applyResponse(data, { preferLocalValues: true })
    showSaveSuccess()
  } catch (error) {
    console.error('保存邮件设置失败:', error)
    showSaveError()
    if (error.response?.data) {
      applyResponse(error.response.data)
    }
  } finally {
    saving.value = false
  }
}

async function sendTestEmail() {
  testing.value = true
  try {
    await api.post('/admin/mail/test', {
      to_email: effectiveTestToEmail.value,
    })
    await modalStore.alert({
      title: '测试邮件已发送',
      message: `测试邮件已发送到 ${effectiveTestToEmail.value}，请检查收件箱`,
      tone: 'success'
    })
  } catch (error) {
    await modalStore.alert({
      title: '发送测试邮件失败',
      message: error.response?.data?.error || '未知错误',
      tone: 'danger'
    })
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.Form {
  width: 100%;
}

.MailContent {
  max-width: 820px;
  width: 100%;
}

.Form-section {
  margin-bottom: 20px;
}

.Form-group {
  min-width: 0;
}

.Form-group--full {
  grid-column: 1 / -1;
}

.TestMailPanel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.TestMailPanel-input {
  margin: 0;
}

.TestMailPanel-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.TestMailPanel-target {
  color: var(--forum-text-muted);
  font-size: var(--forum-font-size-md);
  word-break: break-word;
}

.TestMailPanel-actions {
  margin-top: 0;
}

@media (max-width: 768px) {
  .Form {
    max-width: none;
  }

  .TestMailPanel-meta {
    flex-direction: column;
  }
}
</style>
