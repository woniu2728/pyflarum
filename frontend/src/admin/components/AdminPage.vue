<template>
  <div class="AdminPage" :class="className">
    <div class="AdminPage-header">
      <div class="AdminPage-headerIcon">
        <i :class="icon"></i>
      </div>
      <div class="AdminPage-headerContent">
        <h2 class="AdminPage-title">{{ title }}</h2>
        <p class="AdminPage-description">{{ description }}</p>
      </div>
    </div>

    <div class="AdminPage-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  className: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.AdminPage {
  background: var(--forum-bg-elevated);
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-md);
  box-shadow: var(--forum-shadow-sm);
}

.AdminPage-header {
  display: flex;
  align-items: flex-start;
  gap: var(--forum-space-5);
  padding: var(--forum-space-7);
  border-bottom: 1px solid var(--forum-border-soft);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 100%);
}

.AdminPage-headerIcon {
  width: 50px;
  height: 50px;
  background: var(--forum-bg-subtle);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.AdminPage-headerIcon i {
  font-size: 20px;
  color: var(--forum-primary-color);
}

.AdminPage-headerContent {
  flex: 1;
}

.AdminPage-title {
  font-size: var(--forum-font-size-2xl);
  font-weight: 600;
  color: var(--forum-text-color);
  margin: 0 0 8px 0;
}

.AdminPage-description {
  font-size: var(--forum-font-size-md);
  color: var(--forum-text-muted);
  margin: 0;
  line-height: 1.6;
}

.AdminPage-content {
  padding: var(--forum-space-7);
}

@media (max-width: 768px) {
  .AdminPage {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    box-shadow: none;
  }

  .AdminPage-header {
    gap: 14px;
    padding: 18px 16px;
    background: var(--forum-bg-subtle);
  }

  .AdminPage-headerIcon {
    width: 42px;
    height: 42px;
  }

  .AdminPage-headerIcon i {
    font-size: 18px;
  }

  .AdminPage-title {
    font-size: 20px;
  }

  .AdminPage-description {
    font-size: var(--forum-font-size-sm);
  }

  .AdminPage-content {
    padding: 18px 16px;
  }
}

@media (max-width: 480px) {
  .AdminPage-header {
    align-items: flex-start;
    padding: 16px 14px;
  }

  .AdminPage-title {
    font-size: 18px;
  }

  .AdminPage-content {
    padding: 16px 14px;
  }
}
</style>
