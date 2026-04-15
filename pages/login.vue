<template>
  <div class="login-page">
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="email"
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          :rules="[{ required: true, message: '请输入邮箱' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>
      <div class="form-actions">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
        <van-button round block type="default" class="register-btn" @click="goToRegister">
          还没有账号？去注册
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '登录 - 英语学习平台',
  meta: [
    { name: 'description', content: '登录英语学习平台' },
    { name: 'robots', content: 'noindex' }
  ]
})

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)

const onSubmit = async () => {
  loading.value = true
  try {
    const { error } = await login(email.value, password.value)
    if (!error.value) {
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-page {
  padding: 24px 16px;
}

.form-actions {
  margin-top: 24px;
  padding: 0 16px;
}

.register-btn {
  margin-top: 16px;
}
</style>
