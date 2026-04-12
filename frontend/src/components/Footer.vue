<template>
  <footer class="footer">
    <div class="container">
      <p>Powered by <strong>{{ forumStore.settings.forum_title }}</strong> - Django + Vue 3</p>
    </div>
  </footer>
</template>

<script setup>
import { useForumStore } from '@/stores/forum'

const forumStore = useForumStore()
</script>

<style scoped>
.footer {
  background: white;
  border-top: 1px solid #e3e8ed;
  color: #999;
  padding: 20px 0;
  text-align: center;
  margin-top: 40px;
  font-size: 12px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer p {
  margin: 0;
}

.footer strong {
  color: var(--forum-primary-color);
  font-weight: 600;
}
</style>
