// TTS Composable - 基于浏览器 Web Speech API
// 完全免费，无需 API Key，支持中文/英文

interface TTSOptions {
  speed?: number   // 0.5 ~ 1.5
  pitch?: number   // 0.5 ~ 2.0
  volume?: number   // 0.0 ~ 1.0
  lang?: string     // 'zh-CN' | 'en-US' 等
}

export const useTTS = () => {
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const currentSpeed = ref(1.0)
  const error = ref<string | null>(null)

  // 校验速度范围
  const validateSpeed = (speed: number): number => {
    return Math.max(0.5, Math.min(1.5, speed))
  }

  // 播放文本（Web Speech API）
  const speak = (text: string, options: TTSOptions = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!text || text.trim() === '') {
        reject(new Error('Text is empty'))
        return
      }

      // 停止当前播放
      window.speechSynthesis?.cancel()

      isLoading.value = true
      error.value = null

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = validateSpeed(options.speed ?? 1.0)
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0
      utterance.lang = options.lang ?? 'en-US'

      utterance.onstart = () => {
        isPlaying.value = true
        isLoading.value = false
      }

      utterance.onend = () => {
        isPlaying.value = false
        isLoading.value = false
        resolve()
      }

      utterance.onerror = (e) => {
        isPlaying.value = false
        isLoading.value = false
        // 浏览器不支持时友好提示
        if (e.error === 'not-allowed') {
          error.value = '请允许浏览器播放音频'
        } else if (e.error === 'no-speech') {
          error.value = '未检测到语音输入'
        } else {
          error.value = 'TTS播放失败'
        }
        reject(new Error(`TTS error: ${e.error}`))
      }

      window.speechSynthesis?.speak(utterance)
    })
  }

  // 停止播放
  const stop = () => {
    window.speechSynthesis?.cancel()
    isPlaying.value = false
    isLoading.value = false
  }

  // 设置播放速度
  const setSpeed = (speed: number) => {
    currentSpeed.value = validateSpeed(speed)
    return currentSpeed.value
  }

  return {
    isPlaying: readonly(isPlaying),
    isLoading: readonly(isLoading),
    currentSpeed: readonly(currentSpeed),
    error: readonly(error),
    speak,
    stop,
    setSpeed,
    validateSpeed
  }
}
