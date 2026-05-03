<template>
  <div class="profile-section settings-section">
    <div class="profile-section-header">
      <div>
        <h2>个人设置</h2>
        <p>维护你的显示名称、邮箱、个人简介和通知偏好。</p>
      </div>
    </div>

    <ForumInlineMessage v-if="settingsSuccess" tone="success">{{ settingsSuccess }}</ForumInlineMessage>
    <ForumInlineMessage v-if="settingsError" tone="danger">{{ settingsError }}</ForumInlineMessage>

    <div class="profile-settings-card">
      <div class="profile-form-group">
        <label for="profile-display-name">显示名称</label>
        <input
          id="profile-display-name"
          v-model="editForm.display_name"
          name="display_name"
          type="text"
          class="profile-form-control"
          placeholder="显示名称"
        />
      </div>

      <div class="profile-form-group">
        <label for="profile-email">邮箱</label>
        <input
          id="profile-email"
          v-model="editForm.email"
          name="email"
          type="email"
          class="profile-form-control"
          placeholder="name@example.com"
        />
        <small class="profile-form-help">
          {{ user.is_email_confirmed ? '当前邮箱已完成验证。' : '修改邮箱后会重新进入未验证状态。' }}
        </small>
      </div>

      <div class="profile-form-group">
        <label for="profile-bio">个人简介</label>
        <textarea
          id="profile-bio"
          v-model="editForm.bio"
          name="bio"
          class="profile-form-control"
          rows="5"
          placeholder="介绍一下自己..."
        ></textarea>
      </div>

      <div class="profile-form-actions">
        <button type="button" class="primary" :disabled="saving" @click="$emit('save-profile')">
          {{ saving ? '保存中...' : '保存资料' }}
        </button>
      </div>
    </div>

    <div class="profile-settings-card profile-settings-card--stacked">
      <div class="profile-card-header">
        <div>
          <h3>通知偏好</h3>
          <p>按照 Flarum 的习惯，把自动关注和新回复通知放在个人设置中管理。</p>
        </div>
        <button
          type="button"
          class="secondary"
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
          <input
            v-model="preferences.follow_after_reply"
            name="follow_after_reply"
            type="checkbox"
          >
        </label>

        <label class="preference-item">
          <span class="preference-copy">
            <strong>发起讨论后自动关注</strong>
            <small>你创建的新讨论会默认出现在关注中。</small>
          </span>
          <input
            v-model="preferences.follow_after_create"
            name="follow_after_create"
            type="checkbox"
          >
        </label>

        <label class="preference-item">
          <span class="preference-copy">
            <strong>关注讨论有新回复时通知我</strong>
            <small>关闭后，仍会保留关注状态，但不再接收新回复通知。</small>
          </span>
          <input
            v-model="preferences.notify_new_post"
            name="notify_new_post"
            type="checkbox"
          >
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
.section-state-block {
  margin: 0;
}

.section-state-block--compact {
  padding: 18px 16px;
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
  min-width: 0;
}

.preference-copy small {
  color: #7d8b97;
  overflow-wrap: anywhere;
}

.preference-item input {
  width: 18px;
  height: 18px;
  accent-color: #4d698e;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .preference-item {
    gap: 12px;
  }
}
</style>
