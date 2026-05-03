<template>
  <div class="Modal Modal--small Modal--simple fade" :class="{ in: showing }" @click.stop>
    <div class="Modal-content">
      <div class="Modal-close">
        <button
          type="button"
          class="Button Button--icon Button--link"
          aria-label="关闭"
          @click="modalStore.dismiss()"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="Modal-header">
        <h3>{{ title }}</h3>
      </div>

      <div class="Modal-body">
        <p class="ModerationActionModal-description">{{ description }}</p>

        <div v-if="errorMessage" class="ModerationActionModal-error">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="moderation-action-note">处理备注</label>
          <textarea
            id="moderation-action-note"
            v-model="note"
            name="note"
            rows="4"
            class="moderation-textarea"
            :placeholder="placeholder"
          ></textarea>
          <p class="ModerationActionModal-help">备注会同步显示给内容作者，建议简明说明处理原因。</p>
        </div>
      </div>

      <div class="Modal-footer Modal-footer--split">
        <button type="button" class="Button Button--secondary" :disabled="submitting" @click="modalStore.dismiss()">
          取消
        </button>
        <button type="button" class="Button" :class="confirmButtonClass" :disabled="submitting" @click="submit">
          {{ submitting ? '提交中...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useModalStore } from '@/stores/modal'

const props = defineProps({
  title: {
    type: String,
    default: '处理内容'
  },
  description: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: '提交'
  },
  confirmTone: {
    type: String,
    default: 'primary'
  },
  placeholder: {
    type: String,
    default: '例如：内容符合社区规范，已通过审核'
  },
  submitAction: {
    type: Function,
    required: true
  },
  showing: {
    type: Boolean,
    default: false
  }
})

const modalStore = useModalStore()
const note = ref('')
const submitting = ref(false)
const errorMessage = ref('')

const confirmButtonClass = {
  'Button--primary': props.confirmTone === 'primary',
  'Button--danger': props.confirmTone === 'danger'
}

async function submit() {
  submitting.value = true
  errorMessage.value = ''

  try {
    const result = await props.submitAction({
      note: note.value.trim()
    })
    modalStore.close(result || { success: true, note: note.value.trim() })
  } catch (error) {
    errorMessage.value = error.response?.data?.error || error.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.ModerationActionModal-description {
  margin: 0 0 18px;
  color: #6a7886;
  line-height: 1.7;
}

.ModerationActionModal-error {
  margin-bottom: 16px;
  border-radius: 8px;
  padding: 11px 12px;
  background: #fdf1f1;
  color: #b33a3a;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #30404f;
  font-weight: 600;
}

.moderation-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d7dee6;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 112px;
}

.ModerationActionModal-help {
  margin: 8px 0 0;
  color: #748292;
  font-size: 12px;
  line-height: 1.6;
}
</style>
