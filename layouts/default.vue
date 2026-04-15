<template>
  <div class="app-layout">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Import Vant styles
import 'vant/lib/index.css'
</script>

<style>
/* Mobile-first global styles */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-layout {
  min-height: 100vh;
  background: #f7f8fa;
}

/* Vant overrides for better mobile experience */
.van-cell-group--inset {
  margin: 0 16px;
}

.van-button--block {
  margin: 0 16px;
}

.van-nav-bar {
  background: #1989fa;
}

.van-nav-bar__title,
.van-nav-bar__text {
  color: white !important;
}

.van-icon-arrow-left,
.van-nav-bar__left {
  color: white !important;
}
</style>
