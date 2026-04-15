// Auth composable with JWT authentication
import type { Ref } from 'vue'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface LoginResponse {
  user: User
  token: string
}

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const token = useState<string | null>('token', () => null)
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // 设置token到cookie和state
  const setAuth = (authToken: string, userData: User) => {
    token.value = authToken
    user.value = userData
    
    // 存储到cookie（服务端也需要设置）
    if (import.meta.client) {
      document.cookie = `auth_token=${authToken}; path=/; max-age=${60 * 60 * 24 * 7}`
    }
  }

  // 清除认证状态
  const clearAuth = () => {
    token.value = null
    user.value = null
    
    if (import.meta.client) {
      document.cookie = 'auth_token=; path=/; max-age=0'
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    const { data, error } = await useFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })

    if (data.value) {
      setAuth(data.value.token, data.value.user)
    }

    return { data, error }
  }

  // 注册
  const register = async (email: string, password: string, name?: string) => {
    const { data, error } = await useFetch<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name }
    })

    if (data.value) {
      setAuth(data.value.token, data.value.user)
    }

    return { data, error }
  }

  // 登出
  const logout = () => {
    clearAuth()
  }

  // 获取当前用户信息
  const fetchUser = async () => {
    if (!token.value) return

    try {
      const { data } = await useFetch<User>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      if (data.value) {
        user.value = data.value
      }
    } catch (e) {
      clearAuth()
    }
  }

  return {
    user: user as Readonly<Ref<User | null>>,
    token: token as Readonly<Ref<string | null>>,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    setAuth,
    clearAuth
  }
}
