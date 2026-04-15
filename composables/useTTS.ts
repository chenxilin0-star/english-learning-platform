// TTS Composable - 百度TTS封装
// 支持0.5x~1.5x播放速度

interface TTSOptions {
  speed?: number // 0.5 ~ 1.5
  pitch?: number // 0.5 ~ 2.0
  volume?: number // 0.0 ~ 1.0
  per?: number // 0-3 发音人: 0女声 1男声 3情感男声 4情感女声
}

const BAIDU_TTS_URL = 'https://tsn.baidu.com/text2audio'

export const useTTS = () => {
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const currentSpeed = ref(1.0)
  const error = ref<string | null>(null)

  // 校验速度范围
  const validateSpeed = (speed: number): number => {
    return Math.max(0.5, Math.min(1.5, speed))
  }

  // 构建TTS请求URL
  const buildTTSUrl = (text: string, options: TTSOptions = {}): string => {
    const speed = validateSpeed(options.speed ?? 1.0)
    currentSpeed.value = speed
    
    const params = new URLSearchParams({
      tex: encodeURIComponent(text),
      per: String(options.per ?? 0),
      spd: String(speed),
      pit: String(options.pitch ?? 1.0),
      vol: String(options.volume ?? 1.0),
      aue: '3', // mp3格式
      cuid: 'english_learning_app',
      ctp: '1',
      lan: 'zh',
      // token需要在服务端获取，这里使用demo token
      tok: 'demo_token'
    })

    return `${BAIDU_TTS_URL}?${params.toString()}`
  }

  // 播放文本
  const speak = (text: string, options: TTSOptions = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!text || text.trim() === '') {
        reject(new Error('Text is empty'))
        return
      }

      isLoading.value = true
      error.value = null

      const audio = new Audio()
      audio.src = buildTTSUrl(text, options)
      audio.playbackRate = options.speed ?? 1.0

      audio.onplay = () => {
        isPlaying.value = true
        isLoading.value = false
      }

      audio.onended = () => {
        isPlaying.value = false
        isLoading.value = false
        resolve()
      }

      audio.onerror = (e) => {
        isPlaying.value = false
        isLoading.value = false
        error.value = 'TTS播放失败，请检查网络连接'
        reject(new Error('TTS playback failed'))
      }

      audio.play().catch(err => {
        isLoading.value = false
        error.value = '音频播放失败'
        reject(err)
      })
    })
  }

  // 停止播放
  const stop = () => {
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
