<template>
  <div class="login-page">
    <div class="header">
      <h1>🎧 英语学习平台</h1>
      <p>听出来的英语力</p>
    </div>

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.username"
          label="用户名"
          placeholder="请输入用户名或邮箱"
          :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
          v-model="form.password"
          type="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
      </van-cell-group>

      <div class="form-actions">
        <van-button
          type="primary"
          round
          block
          :loading="loading"
          native-type="submit"
        >
          登录
        </van-button>
        <van-button
          type="default"
          round
          block
          class="register-btn"
          @click="goRegister"
        >
          还没有账号？去注册
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '登录 - 英语学习平台',
  meta: [{ name: 'robots', content: 'noindex' }]
})

const router = useRouter()
const loading = ref(false)
const form = ref({ username: '', password: '' })

const onSubmit = async () => {
  loading.value = true
  try {
    const res = await $fetch<{ success: boolean; token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: form.value
    })
    if (res.success && res.token) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      showToast({ message: '登录成功', position: 'top' })
      router.push('/')
    }
  } catch (e: any) {
    showToast({ message: e?.data?.message || '登录失败', position: 'top' })
  } finally {
    loading.value = false
  }
}

const goRegister = () => router.push('/register')
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48px 16px 24px;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 8px;
}

.header p {
  font-size: 16px;
  margin: 0;
  opacity: 0.8;
}

.van-form {
  max-width: 400px;
  margin: 0 auto;
}

.form-actions {
  margin-top: 32px;
  padding: 0 16px;
}

.form-actions .van-button--primary {
  background: #764ba2;
  border: none;
}

.register-btn {
  margin-top: 12px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
}
</style>
