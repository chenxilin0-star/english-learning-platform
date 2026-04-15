<template>
  <div class="review-page">
    <van-nav-bar
      title="错词复习"
      left-arrow
      @click-left="goBack"
    />

    <div v-if="mistakes.length === 0" class="empty-state">
      <van-empty description="暂无错词需要复习" />
    </div>

    <div v-else class="review-content">
      <div class="progress-bar">
        <van-progress
          :percentage="progressPercentage"
          :show-pivot="true"
          color="#1989fa"
        />
        <span class="progress-text">{{ currentIndex + 1 }} / {{ mistakes.length }}</span>
      </div>

      <div class="card-section">
        <van-card>
          <template #title>
            <div class="word-display">
              <h2>{{ currentMistake.word }}</h2>
              <van-icon
                name="volume-o"
                size="24"
                @click="speakWord"
              />
            </div>
          </template>
          <template #desc>
            <p class="hint-text">听发音，输入正确的单词</p>
          </template>
        </van-card>

        <div class="input-section">
          <van-field
            v-model="userAnswer"
            placeholder="请输入单词"
            :disabled="isChecking"
          />
          <van-button
            type="primary"
            block
            :loading="isChecking"
            @click="checkAnswer"
          >
            提交
          </van-button>
        </div>

        <!-- 结果反馈 -->
        <div v-if="showResult" class="feedback-section" :class="isCorrect ? 'correct' : 'wrong'">
          <div v-if="isCorrect" class="correct-msg">
            <van-icon name="passed" size="48" />
            <p>正确!</p>
          </div>
          <div v-else class="wrong-msg">
            <van-icon name="warning" size="48" />
            <p>错误</p>
            <p>正确答案: {{ currentMistake.correctAnswer }}</p>
            <p>你的答案: {{ userAnswer }}</p>
            <p>相似度: {{ similarity }}%</p>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <van-button
          v-if="showResult && currentIndex < mistakes.length - 1"
          type="primary"
          block
          @click="nextCard"
        >
          下一题
        </van-button>
        <van-button
          v-if="showResult && currentIndex === mistakes.length - 1"
          type="success"
          block
          @click="finishReview"
        >
          完成复习
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '错词复习 - 英语学习平台',
  meta: [
    { name: 'description', content: '复习您的错题' },
    { name: 'robots', content: 'noindex' }
  ]
})

interface Mistake {
  id: string
  wordId: string
  word: string
  correctAnswer: string
  userAnswer: string
  similarity: number
}

const router = useRouter()
const { speak } = useTTS()

const mistakes = ref<Mistake[]>([])
const currentIndex = ref(0)
const userAnswer = ref('')
const isChecking = ref(false)
const showResult = ref(false)
const isCorrect = ref(false)
const similarity = ref(0)

const currentMistake = computed(() => mistakes.value[currentIndex.value])

const progressPercentage = computed(() => {
  if (mistakes.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / mistakes.value.length) * 100)
})

// Levenshtein 距离算法
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

const calculateSimilarity = (a: string, b: string): number => {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 100
  return Math.round((1 - distance / maxLen) * 100)
}

const speakWord = async () => {
  try {
    await speak(currentMistake.value?.word || '')
  } catch {
    showToast('发音失败')
  }
}

const checkAnswer = async () => {
  if (!userAnswer.value.trim()) {
    showToast('请输入答案')
    return
  }

  isChecking.value = true
  showResult.value = false

  const answer = userAnswer.value.trim()
  const correct = currentMistake.value?.correctAnswer || ''

  similarity.value = calculateSimilarity(answer, correct)
  isCorrect.value = similarity.value >= 80

  // 如果这次答对了，从错词本移除
  if (isCorrect.value) {
    try {
      await useFetch(`/api/mistakes/${currentMistake.value?.id}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('移除错词失败', e)
    }
  }

  showResult.value = true
  isChecking.value = false
}

const nextCard = () => {
  currentIndex.value++
  userAnswer.value = ''
  showResult.value = false
  // 自动播放发音
  setTimeout(() => {
    speakWord()
  }, 300)
}

const finishReview = () => {
  showToast('复习完成!')
  router.back()
}

const fetchMistakes = async () => {
  try {
    const { data } = await useFetch<{ mistakes: Mistake[] }>('/api/mistakes')
    if (data.value?.mistakes) {
      mistakes.value = data.value.mistakes
      // 自动播放第一个单词
      setTimeout(() => {
        speakWord()
      }, 500)
    }
  } catch (e) {
    console.error('获取错词失败', e)
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchMistakes()
})
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.empty-state {
  padding-top: 100px;
}

.review-content {
  padding: 16px;
}

.progress-bar {
  margin-bottom: 24px;
}

.progress-text {
  display: block;
  text-align: center;
  margin-top: 8px;
  color: #666;
}

.card-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.word-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.word-display h2 {
  font-size: 28px;
  margin: 0;
}

.hint-text {
  color: #999;
  font-size: 14px;
  margin-top: 8px;
}

.input-section {
  margin-top: 24px;
}

.feedback-section {
  margin-top: 24px;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.feedback-section.correct {
  background: #e6f7e6;
}

.feedback-section.wrong {
  background: #fff1e6;
}

.correct-msg {
  color: #07c160;
}

.correct-msg p {
  font-size: 20px;
  font-weight: bold;
  margin: 8px 0 0 0;
}

.wrong-msg {
  color: #ee0a24;
}

.wrong-msg p {
  margin: 8px 0;
}

.wrong-msg p:first-of-type {
  font-size: 20px;
  font-weight: bold;
}
</style>
