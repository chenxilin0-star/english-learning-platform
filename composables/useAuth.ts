// Auth Composable - 基于 Cookie JWT

export const useAuth = () => {
  const user = ref<{ id: string; username: string; email: string } | null>(null)
  const token = ref<string | null>(null)

  // 从 localStorage 恢复登录状态
  const init = () => {
    if (process.client) {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (savedToken && savedUser) {
        token.value = savedToken
        try {
          user.value = JSON.parse(savedUser)
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    }
  }

  // 检查登录状态
  const checkAuth = async (): Promise<boolean> => {
    if (!process.client) return false
    const savedToken = localStorage.getItem('token')
    if (!savedToken) return false

    try {
      const res = await $fetch<{ user: any }>('/api/auth/me', {
        headers: { cookie: `token=${savedToken}` }
      })
      if (res.user) {
        user.value = res.user
        token.value = savedToken
        return true
      }
    } catch {
      // token 失效
      logout()
    }
    return false
  }

  // 登录
  const login = async (username: string, password: string) => {
    const res = await $fetch<{ success: boolean; token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    if (res.success && res.token) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      token.value = res.token
      user.value = res.user
    }
    return res
  }

  // 注册
  const register = async (username: string, email: string, password: string) => {
    return await $fetch('/api/auth/register', {
      method: 'POST',
      body: { username, email, password }
    })
  }

  // 登出
  const logout = () => {
    if (process.client) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    token.value = null
    user.value = null
  }

  const isLoggedIn = computed(() => !!token.value)

  return {
    user: readonly(user),
    token: readonly(token),
    isLoggedIn,
    init,
    checkAuth,
    login,
    register,
    logout
  }
}
