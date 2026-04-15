<template>
  <div class="register-page">
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
          placeholder="请输入密码（至少6位）"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
        <van-field
          v-model="confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="[{ required: true, message: '请确认密码' }]"
        />
        <van-field
          v-model="name"
          name="name"
          label="昵称"
          placeholder="请输入昵称（选填）"
        />
      </van-cell-group>
      <div class="form-actions">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          注册
        </van-button>
        <van-button round block type="default" class="login-btn" @click="goToLogin">
          已有账号？去登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '注册 - 英语学习平台',
  meta: [
    { name: 'description', content: '注册英语学习平台账号' },
    { name: 'robots', content: 'noindex' }
  ]
})

const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const loading = ref(false)

const onSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    showToast('两次密码输入不一致')
    return
  }
  if (password.value.length < 6) {
    showToast('密码至少6位')
    return
  }

  loading.value = true
  try {
    const { data, error } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        name: name.value || undefined
      }
    })
    if (!error.value && data.value) {
      showToast('注册成功，请登录')
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  padding: 24px 16px;
}

.form-actions {
  margin-top: 24px;
  padding: 0 16px;
}

.login-btn {
  margin-top: 16px;
}
</style>
