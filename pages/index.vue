<template>
  <div class="home-page">
    <!-- 顶部品牌区 -->
    <div class="hero">
      <h1 class="logo">🎧 英语学习平台</h1>
      <p class="slogan">听出来的英语力</p>
      <p class="desc">高效的单词记忆 · 科学的听写训练 · 精准的错词复习</p>
      <div v-if="!isLoggedIn" class="hero-actions">
        <van-button type="primary" size="large" round @click="goLogin">
          登录 / 注册
        </van-button>
        <van-button size="large" round @click="goDictation">
          立即体验
        </van-button>
      </div>
      <div v-else class="hero-user">
        <van-tag type="success" size="large">已登录</van-tag>
      </div>
    </div>

    <!-- 功能入口 -->
    <van-cell-group inset class="feature-group">
      <van-cell title="📖 我的单词本" label="管理单词库" is-link to="/wordbooks" />
      <van-cell title="🎧 听写训练" label="随机听写测试" is-link to="/dictation" />
      <van-cell title="📝 错词本" label="智能复习错题" is-link to="/mistakes" />
      <van-cell title="📅 学习日历" label="记录每日进步" is-link to="/calendar" />
      <van-cell title="👤 个人中心" label="设置和学习统计" is-link to="/profile" />
    </van-cell-group>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <div class="quick-title">快捷开始</div>
      <van-row gutter="12">
        <van-col span="12">
          <div class="quick-card" @click="goDictation">
            <div class="quick-icon">🎧</div>
            <div class="quick-text">开始听写</div>
          </div>
        </van-col>
        <van-col span="12">
          <div class="quick-card" @click="goMistakes">
            <div class="quick-icon">📝</div>
            <div class="quick-text">复习错词</div>
          </div>
        </van-col>
      </van-row>
    </div>

    <!-- 底部版权 -->
    <div class="footer">
      © 2026 英语学习平台 · 听出来的英语力
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '英语学习平台 - 听出来的英语力',
  meta: [
    { name: 'description', content: '在线英语学习平台，单词库管理、听写训练、错词复习，科学高效的记忆方法' }
  ]
})

const router = useRouter()

// 模拟登录状态（等Auth API完成后改成真实检测）
const isLoggedIn = computed(() => {
  if (process.client) {
    return !!localStorage.getItem('token')
  }
  return false
})

const goLogin = () => router.push('/login')
const goDictation = () => {
  if (isLoggedIn.value) {
    router.push('/dictation')
  } else {
    router.push('/login')
  }
}
const goMistakes = () => {
  if (isLoggedIn.value) {
    router.push('/mistakes')
  } else {
    router.push('/login')
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40px;
}

.hero {
  text-align: center;
  padding: 48px 24px 32px;
  color: white;
}

.logo {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 8px;
}

.slogan {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
  opacity: 0.95;
}

.desc {
  font-size: 14px;
  margin: 0 0 24px;
  opacity: 0.8;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.hero-actions .van-button--primary {
  background: white;
  border: none;
  color: #764ba2;
  font-weight: bold;
  width: 200px;
}

.hero-actions .van-button:not(.van-button--primary) {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  width: 200px;
}

.hero-user {
  padding: 8px 0;
}

.feature-group {
  margin: 0 16px;
}

.quick-actions {
  margin: 24px 16px 0;
}

.quick-title {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-left: 4px;
}

.quick-card {
  background: white;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.quick-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.quick-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.footer {
  text-align: center;
  margin-top: 40px;
  padding: 0 16px;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
}
</style>
