<template>
  <div class="register-page">
    <div class="header">
      <h1>加入我们</h1>
      <p>开启你的英语学习之旅</p>
    </div>

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.username"
          label="用户名"
          placeholder="请输入用户名（用于登录）"
          :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
          v-model="form.email"
          type="email"
          label="邮箱"
          placeholder="请输入邮箱"
          :rules="[{ required: true, message: '请填写邮箱' }]"
        />
        <van-field
          v-model="form.password"
          type="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[
            { required: true, message: '请填写密码' },
            { pattern: /.{6,}/, message: '密码至少6位' }
          ]"
        />
        <van-field
          v-model="form.confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[{ required: true, message: '请确认密码' }]"
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
          注册
        </van-button>
        <van-button
          type="default"
          round
          block
          class="login-btn"
          @click="goLogin"
        >
          已有账号？去登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '注册 - 英语学习平台',
  meta: [{ name: 'robots', content: 'noindex' }]
})

const router = useRouter()
const loading = ref(false)
const form = ref({ username: '', email: '', password: '', confirmPassword: '' })

const onSubmit = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    showToast({ message: '两次密码输入不一致', position: 'top' })
    return
  }

  loading.value = true
  try {
    const res = await $fetch<{ success: boolean; userId: string }>('/api/auth/register', {
      method: 'POST',
      body: {
        username: form.value.username,
        email: form.value.email,
        password: form.value.password
      }
    })
    if (res.success) {
      showToast({ message: '注册成功，请登录', position: 'top' })
      router.push('/login')
    }
  } catch (e: any) {
    showToast({ message: e?.data?.message || '注册失败', position: 'top' })
  } finally {
    loading.value = false
  }
}

const goLogin = () => router.push('/login')
</script>

<style scoped>
.register-page {
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

.login-btn {
  margin-top: 12px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
}
</style>
