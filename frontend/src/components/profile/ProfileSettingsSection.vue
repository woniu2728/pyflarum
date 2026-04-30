<template>
  <div class="content-section settings-section">
    <div class="section-header">
      <div>
        <h2>个人设置</h2>
        <p>维护你的显示名称、邮箱、个人简介和通知偏好。</p>
      </div>
    </div>

    <ForumInlineMessage v-if="settingsSuccess" tone="success">{{ settingsSuccess }}</ForumInlineMessage>
    <ForumInlineMessage v-if="settingsError" tone="danger">{{ settingsError }}</ForumInlineMessage>

    <div class="settings-card">
      <div class="form-group">
        <label>显示名称</label>
        <input
          v-model="editForm.display_name"
          type="text"
          class="form-control"
          placeholder="显示名称"
        />
      </div>

      <div class="form-group">
        <label>邮箱</label>
        <input
          v-model="editForm.email"
          type="email"
          class="form-control"
          placeholder="name@example.com"
        />
        <small class="form-help">
          {{ user.is_email_confirmed ? '当前邮箱已完成验证。' : '修改邮箱后会重新进入未验证状态。' }}
        </small>
      </div>

      <div class="form-group">
        <label>个人简介</label>
        <textarea
          v-model="editForm.bio"
          class="form-control"
          rows="5"
          placeholder="介绍一下自己..."
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-primary" :disabled="saving" @click="$emit('save-profile')">
          {{ saving ? '保存中...' : '保存资料' }}
        </button>
      </div>
    </div>

    <div class="settings-card settings-card--stacked">
      <div class="settings-card-header">
        <div>
          <h3>通知偏好</h3>
          <p>按照 Flarum 的习惯，把自动关注和新回复通知放在个人设置中管理。</p>
        </div>
        <button
          type="button"
          class="btn-secondary"
          :disabled="loadingPreferences || savingPreferences"
          @click="$emit('save-preferences')"
        >
          {{ savingPreferences ? '保存中...' : '保存偏好' }}
        </button>
      </div>

      <ForumInlineMessage v-if="preferencesSuccess" tone="success">{{ preferencesSuccess }}</ForumInlineMessage>
      <ForumInlineMessage v-if="preferencesError" tone="danger">{{ preferencesError }}</ForumInlineMessage>
      <ForumStateBlock v-if="loadingPreferences" class="section-state-block section-state-block--compact">加载偏好中...</ForumStateBlock>
      <div v-else class="preferences-list">
        <label class="preference-item">
          <span class="preference-copy">
            <strong>回复后自动关注</strong>
            <small>参与讨论后，自动把该讨论加入关注列表。</small>
          </span>
          <input v-model="preferences.follow_after_reply" type="checkbox">
        </label>

        <label class="preference-item">
          <span class="preference-copy">
            <strong>发起讨论后自动关注</strong>
            <small>你创建的新讨论会默认出现在关注中。</small>
          </span>
          <input v-model="preferences.follow_after_create" type="checkbox">
        </label>

        <label class="preference-item">
          <span class="preference-copy">
            <strong>关注讨论有新回复时通知我</strong>
            <small>关闭后，仍会保留关注状态，但不再接收新回复通知。</small>
          </span>
          <input v-model="preferences.notify_new_post" type="checkbox">
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import ForumInlineMessage from '@/components/forum/ForumInlineMessage.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'

defineProps({
  user: {
    type: Object,
    required: true
  },
  editForm: {
    type: Object,
    required: true
  },
  preferences: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  },
  settingsSuccess: {
    type: String,
    default: ''
  },
  settingsError: {
    type: String,
    default: ''
  },
  loadingPreferences: {
    type: Boolean,
    default: false
  },
  savingPreferences: {
    type: Boolean,
    default: false
  },
  preferencesSuccess: {
    type: String,
    default: ''
  },
  preferencesError: {
    type: String,
    default: ''
  }
})

defineEmits(['save-profile', 'save-preferences'])
</script>

<style scoped>
.content-section {
  padding: 25px;
  min-height: 200px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 22px;
  color: #24313f;
  margin-bottom: 8px;
}

.section-header p {
  color: #6b7a88;
  line-height: 1.6;
}

.section-state-block {
  margin: 0;
}

.section-state-block--compact {
  padding: 18px 16px;
}

.settings-card {
  border: 1px solid #e5ebf0;
  border-radius: 12px;
  padding: 22px 24px;
  background: #fbfcfd;
}

.settings-card--stacked {
  margin-top: 18px;
}

.settings-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.settings-card-header h3 {
  font-size: 18px;
  color: #24313f;
  margin-bottom: 6px;
}

.settings-card-header p {
  color: #6b7a88;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #4d698e;
}

.form-help {
  display: block;
  margin-top: 6px;
  color: #7a8895;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.preferences-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e7edf2;
}

.preference-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #324150;
}

.preference-copy small {
  color: #7d8b97;
}

.preference-item input {
  width: 18px;
  height: 18px;
  accent-color: #4d698e;
  flex-shrink: 0;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #4d698e;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3d5875;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e3e8ed;
  color: #555;
}

.btn-secondary:hover:not(:disabled) {
  background: #d3d8dd;
}

@media (max-width: 768px) {
  .settings-card-header,
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
