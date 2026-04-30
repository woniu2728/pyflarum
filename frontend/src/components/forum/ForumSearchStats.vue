<template>
  <div class="search-stats">
    <span class="search-stat">
      <strong>{{ discussionTotal }}</strong>
      <span>讨论</span>
    </span>
    <span class="search-stat">
      <strong>{{ postTotal }}</strong>
      <span>帖子</span>
    </span>
    <span class="search-stat">
      <strong>{{ userTotal }}</strong>
      <span>用户</span>
    </span>
  </div>
</template>

<script setup>
defineProps({
  discussionTotal: {
    type: Number,
    required: true
  },
  postTotal: {
    type: Number,
    required: true
  },
  userTotal: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.search-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.search-stat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: var(--forum-radius-pill);
  background: rgba(255, 255, 255, 0.88);
  color: #4a5d70;
}

.search-stat strong {
  color: #263646;
  font-size: 15px;
}
</style>
