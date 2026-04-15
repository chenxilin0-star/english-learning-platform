<template>
  <div class="profile-page">
    <van-nav-bar title="个人中心" />

    <div class="profile-header">
      <van-image
        round
        width="80"
        height="80"
        :src="user?.avatar || '/default-avatar.png'"
        class="avatar"
      />
      <div class="user-info">
        <h2>{{ user?.name || user?.email || '用户' }}</h2>
        <p v-if="user?.email">{{ user.email }}</p>
      </div>
    </div>

    <van-cell-group inset style="margin-top: 24px">
      <van-cell title="修改昵称" is-link @click="showEditNameDialog = true" />
      <van-cell title="修改密码" is-link @click="showEditPasswordDialog = true" />
      <van-cell title="TTS播放速度" :value="ttsSpeed + 'x'" is-link @click="showSpeedDialog = true" />
    </van-cell-group>

    <van-cell-group inset style="margin-top: 16px">
      <van-cell title="我的单词本" is-link to="/wordbooks" />
      <van-cell title="听写训练" is-link to="/dictation" />
      <van-cell title="错词本" is-link to="/mistakes" />
      <van-cell title="学习日历" is-link to="/calendar" />
    </van-cell-group>

    <van-cell-group inset style="margin-top: 16px">
      <van-cell title="关于我们" is-link @click="showAboutDialog = true" />
    </van-cell-group>

    <div class="logout-section">
      <van-button type="danger" round block @click="handleLogout">
        退出登录
      </van-button>
    </div>

    <!-- 修改昵称弹窗 -->
    <van-dialog
      v-model:show="showEditNameDialog"
      title="修改昵称"
      show-cancel-button
      @confirm="updateName"
    >
      <van-field v-model="newName" placeholder="请输入新昵称" />
    </van-dialog>

    <!-- 修改密码弹窗 -->
    <van-dialog
      v-model:show="showEditPasswordDialog"
      title="修改密码"
      show-cancel-button
      @confirm="updatePassword"
    >
      <div class="password-form">
        <van-field v-model="oldPassword" type="password" placeholder="请输入原密码" />
        <van-field v-model="newPassword" type="password" placeholder="请输入新密码" />
      </div>
    </van-dialog>

    <!-- TTS速度选择 -->
    <van-popup v-model:show="showSpeedDialog" position="bottom">
      <van-picker
        title="选择播放速度"
        :columns="speedColumns"
        @confirm="updateSpeed"
        @cancel="showSpeedDialog = false"
      />
    </van-popup>

    <!-- 关于弹窗 -->
    <van-dialog
      v-model:show="showAboutDialog"
      title="关于我们"
      :show-confirm-button="true"
      confirm-button-text="我知道了"
    >
      <div class="about-content">
        <p>英语学习平台 v1.0.0</p>
        <p>帮助您高效学习英语</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '个人中心 - 英语学习平台',
  meta: [
    { name: 'description', content: '管理您的个人设置' },
    { name: 'robots', content: 'noindex' }
  ]
})

const router = useRouter()
const { user, logout } = useAuth()
const { currentSpeed, setSpeed } = useTTS()

const showEditNameDialog = ref(false)
const showEditPasswordDialog = ref(false)
const showSpeedDialog = ref(false)
const showAboutDialog = ref(false)

const newName = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const ttsSpeed = ref(1.0)

const speedColumns = [
  { text: '0.5x', value: 0.5 },
  { text: '0.75x', value: 0.75 },
  { text: '1.0x', value: 1.0 },
  { text: '1.25x', value: 1.25 },
  { text: '1.5x', value: 1.5 }
]

const updateName = async () => {
  if (!newName.value.trim()) return

  try {
    await useFetch('/api/user/profile', {
      method: 'PUT',
      body: { name: newName.value }
    })
    showToast('修改成功')
    newName.value = ''
  } catch {
    showToast('修改失败')
  }
}

const updatePassword = async () => {
  if (!oldPassword.value || !newPassword.value) {
    showToast('请填写完整')
    return
  }

  if (newPassword.value.length < 6) {
    showToast('新密码至少6位')
    return
  }

  try {
    await useFetch('/api/user/password', {
      method: 'PUT',
      body: {
        oldPassword: oldPassword.value,
        newPassword: newPassword.value
      }
    })
    showToast('修改成功')
    oldPassword.value = ''
    newPassword.value = ''
  } catch {
    showToast('修改失败')
  }
}

const updateSpeed = ({ selectedOptions }: any) => {
  const speed = selectedOptions[0].value as number
  ttsSpeed.value = setSpeed(speed)
  showSpeedDialog.value = false
  showToast(`已设置为 ${speed}x`)
}

const handleLogout = () => {
  logout()
  router.push('/login')
}

// 初始化速度
onMounted(() => {
  ttsSpeed.value = currentSpeed.value
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding-bottom: 100px;
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 32px 16px;
  background: linear-gradient(135deg, #1989fa 0%, #1979fa 100%);
  color: white;
}

.avatar {
  border: 3px solid white;
}

.user-info {
  margin-left: 16px;
}

.user-info h2 {
  margin: 0;
  font-size: 20px;
}

.user-info p {
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.logout-section {
  margin: 32px 16px;
}

.password-form {
  padding: 16px;
}

.about-content {
  padding: 24px;
  text-align: center;
}

.about-content p {
  margin: 8px 0;
}
</style>
