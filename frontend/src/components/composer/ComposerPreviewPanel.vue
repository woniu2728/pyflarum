<template>
  <div class="composer-preview">
    <div class="composer-preview-header">
      <span>预览</span>
      <small>{{ statusText }}</small>
    </div>
    <div v-if="loading" class="composer-preview-loading">正在生成预览...</div>
    <div
      v-else
      class="composer-preview-body post-body"
      v-html="html || '<p class=&quot;composer-preview-empty&quot;>输入内容后即可查看预览</p>'"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  html: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  statusText: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.composer-preview {
  display: flex;
  flex: 1;
  min-height: 120px;
  flex-direction: column;
  padding: 4px 0 12px;
}

.composer-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #5c6d7d;
  font-size: 13px;
}

.composer-preview-loading,
.composer-preview-empty {
  color: #7a8794;
  font-size: 14px;
}

.composer-preview-body {
  flex: 1;
  overflow-y: auto;
  line-height: 1.7;
}
</style>
