<template>
  <div v-if="show" class="Modal" @click.self="$emit('close')">
    <div class="Modal-content AdminActionNoteModal">
      <div class="Modal-header">
        <h3>{{ title }}</h3>
        <button type="button" class="Modal-close" :disabled="saving" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="Modal-body">
        <div class="Form-group">
          <label for="admin-action-note">{{ noteLabel }}</label>
          <textarea
            id="admin-action-note"
            name="note"
            class="FormControl"
            rows="4"
            :value="note"
            :placeholder="placeholder"
            :disabled="saving"
            @input="$emit('update:note', $event.target.value)"
          ></textarea>
        </div>
        <p v-if="description" class="AdminActionNoteModal-description">{{ description }}</p>
      </div>
      <div class="Modal-footer">
        <button type="button" class="Button Button--secondary" :disabled="saving" @click="$emit('close')">
          取消
        </button>
        <button
          type="button"
          class="Button"
          :class="confirmTone === 'danger' ? 'Button--danger' : 'Button--primary'"
          :disabled="saving"
          @click="$emit('submit')"
        >
          {{ saving ? savingText : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  noteLabel: {
    type: String,
    default: '备注'
  },
  note: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  savingText: {
    type: String,
    default: '提交中...'
  },
  confirmTone: {
    type: String,
    default: 'primary'
  },
  saving: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:note', 'close', 'submit'])
</script>

<style scoped>
.AdminActionNoteModal {
  width: min(520px, calc(100vw - 32px));
}

.AdminActionNoteModal-description {
  margin: 10px 0 0;
  color: var(--forum-text-soft);
  font-size: var(--forum-font-size-sm);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .AdminActionNoteModal {
    width: 100%;
    max-width: none;
  }

  .Modal-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .Modal-footer .Button {
    width: 100%;
    justify-content: center;
  }
}
</style>
