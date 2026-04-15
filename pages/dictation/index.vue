<template>
  <div class="dictation-page">
    <van-nav-bar title="听写训练" left-arrow @click-left="goBack" />

    <!-- 开始界面 -->
    <div v-if="!isStarted" class="start-section">
      <van-cell-group inset>
        <van-field
          v-model="selectedBookId"
          readonly
          clickable
          label="选择单词本"
          placeholder="请选择"
          @click="showBookPicker = true"
        />
        <van-field
          v-model.number="wordCount"
          type="digit"
          label="单词数量"
          placeholder="请输入数量"
        />
        <van-field
          v-model.number="currentSpeed"
          type="digit"
          label="播放速度"
          placeholder="0.5-1.5"
        />
      </van-cell-group>

      <div class="start-actions">
        <van-button type="primary" round block @click="startDictation">
          开始听写
        </van-button>
      </div>
    </div>

    <!-- 听写进行中 -->
    <div v-else-if="currentIndex < words.length" class="dictation-section">
      <div class="progress-info">
        <span>{{ currentIndex + 1 }} / {{ words.length }}</span>
        <van-button size="small" @click="speakCurrentWord">
          {{ isSpeaking ? '播放中...' : '播放发音' }}
        </van-button>
      </div>

      <div class="input-area">
        <van-field
          v-model="userAnswer"
          label="你的答案"
          placeholder="请输入听到的单词"
          :disabled="isChecking"
        />
        <van-button
          type="primary"
          block
          :loading="isChecking"
          @click="checkAnswer"
        >
          提交答案
        </van-button>
      </div>

      <!-- 结果反馈 -->
      <div v-if="showResult" class="result-feedback" :class="isCorrect ? 'correct' : 'wrong'">
        <p v-if="isCorrect" class="result-text correct-text">✓ 正确</p>
        <div v-else class="wrong-feedback">
          <p class="result-text wrong-text">✗ 错误</p>
          <p>正确答案: <strong>{{ currentWord?.word }}</strong></p>
          <p>你的答案: <strong>{{ userAnswer }}</strong></p>
          <p>相似度: {{ similarity }}%</p>
        </div>
      </div>
    </div>

    <!-- 听写完成 -->
    <div v-else class="result-section">
      <van-cell-group inset>
        <van-cell title="正确数" :value="correctCount" />
        <van-cell title="错误数" :value="wrongCount" />
        <van-cell title="正确率" :value="accuracy + '%'" />
      </van-cell-group>

      <div class="result-actions">
        <van-button type="primary" round block @click="startDictation">
          再来一次
        </van-button>
        <van-button type="default" round block @click="goBack">
          返回
        </van-button>
      </div>

      <!-- 错词列表 -->
      <div v-if="mistakes.length > 0" class="mistakes-list">
        <h3>错词本已自动收录以下单词：</h3>
        <van-tag v-for="m in mistakes" :key="m.wordId" type="danger" size="large">
          {{ m.word }}
        </van-tag>
      </div>
    </div>

    <!-- 单词本选择器 -->
    <van-popup v-model:show="showBookPicker" position="bottom">
      <van-picker
        :columns="bookColumns"
        @confirm="onBookConfirm"
        @cancel="showBookPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '听写训练 - 英语学习平台',
  meta: [
    { name: 'description', content: '英语单词听写训练' },
    { name: 'robots', content: 'noindex' }
  ]
})

interface Word {
  id: string
  word: string
  phonetic: string
  definition: string
  bookId: string
}

interface Book {
  id: string
  name: string
}

interface Mistake {
  wordId: string
  word: string
  userAnswer: string
}

const router = useRouter()
const { speak } = useTTS()

// 状态
const isStarted = ref(false)
const isChecking = ref(false)
const isSpeaking = ref(false)
const showResult = ref(false)
const isCorrect = ref(false)
const similarity = ref(0)

const selectedBookId = ref('')
const wordCount = ref(10)
const currentSpeed = ref(1.0)
const showBookPicker = ref(false)

const words = ref<Word[]>([])
const currentIndex = ref(0)
const userAnswer = ref('')
const correctCount = ref(0)
const wrongCount = ref(0)
const mistakes = ref<Mistake[]>([])
const books = ref<Book[]>([])

const bookColumns = computed(() =>
  books.value.map(b => ({ text: b.name, value: b.id }))
)

const currentWord = computed(() => words.value[currentIndex.value])

const accuracy = computed(() => {
  const total = correctCount.value + wrongCount.value
  return total > 0 ? Math.round((correctCount.value / total) * 100) : 0
})

// 获取单词本列表
const fetchBooks = async () => {
  try {
    const { data } = await useFetch<{ wordbooks: Book[] }>('/api/wordbooks')
    if (data.value?.wordbooks) {
      books.value = data.value.wordbooks
    }
  } catch (e) {
    console.error('获取单词本失败', e)
  }
}

// Levenshtein 距离算法
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

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

// 计算相似度
const calculateSimilarity = (a: string, b: string): number => {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 100
  return Math.round((1 - distance / maxLen) * 100)
}

// 播放当前单词
const speakCurrentWord = async () => {
  if (!currentWord.value || isSpeaking.value) return

  isSpeaking.value = true
  try {
    await speak(currentWord.value.word, { speed: currentSpeed.value })
  } finally {
    isSpeaking.value = false
  }
}

// 检查答案
const checkAnswer = async () => {
  if (!userAnswer.value.trim()) {
    showToast('请输入答案')
    return
  }

  isChecking.value = true
  showResult.value = false

  const answer = userAnswer.value.trim()
  const correct = currentWord.value?.word || ''

  similarity.value = calculateSimilarity(answer, correct)
  isCorrect.value = similarity.value >= 80 // 80%以上相似度视为正确

  if (isCorrect.value) {
    correctCount.value++
  } else {
    wrongCount.value++
    // 自动收录到错词本
    mistakes.value.push({
      wordId: currentWord.value?.id || '',
      word: correct,
      userAnswer: answer
    })
    // 调用API添加到错词本
    try {
      await useFetch('/api/mistakes', {
        method: 'POST',
        body: {
          wordId: currentWord.value?.id,
          userAnswer: answer,
          similarity: similarity.value
        }
      })
    } catch (e) {
      console.error('添加错词失败', e)
    }
  }

  showResult.value = true
  isChecking.value = false

  // 2秒后自动进入下一题
  setTimeout(() => {
    nextWord()
  }, 2000)
}

// 下一题
const nextWord = () => {
  showResult.value = false
  userAnswer.value = ''
  currentIndex.value++

  if (currentIndex.value < words.value.length) {
    // 自动播放下一题
    setTimeout(() => {
      speakCurrentWord()
    }, 500)
  }
}

// 开始听写
const startDictation = async () => {
  if (!selectedBookId.value) {
    showToast('请选择单词本')
    return
  }

  // 获取单词
  try {
    const { data } = await useFetch<{ words: Word[] }>(`/api/wordbooks/${selectedBookId.value}/dictation`, {
      query: { count: wordCount.value }
    })
    if (data.value?.words && data.value.words.length > 0) {
      words.value = data.value.words
      currentIndex.value = 0
      correctCount.value = 0
      wrongCount.value = 0
      mistakes.value = []
      isStarted.value = true
      showResult.value = false
      userAnswer.value = ''

      // 自动播放第一个单词
      setTimeout(() => {
        speakCurrentWord()
      }, 500)
    } else {
      showToast('该单词本暂无单词')
    }
  } catch {
    showToast('获取单词失败')
  }
}

// 单词本选择确认
const onBookConfirm = ({ selectedOptions }: any) => {
  selectedBookId.value = selectedOptions[0].value
  showBookPicker.value = false
}

const goBack = () => {
  router.back()
}

// 初始化
onMounted(() => {
  fetchBooks()
})
</script>

<style scoped>
.dictation-page {
  min-height: 100vh;
  padding-bottom: 24px;
}

.start-section,
.dictation-section,
.result-section {
  padding: 16px;
}

.start-actions,
.result-actions {
  margin-top: 24px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 18px;
}

.input-area {
  margin-top: 16px;
}

.result-feedback {
  margin-top: 24px;
  padding: 16px;
  border-radius: 8px;
}

.result-feedback.correct {
  background: #e6f7e6;
  border: 1px solid #07c160;
}

.result-feedback.wrong {
  background: #fff1e6;
  border: 1px solid #ee0a24;
}

.result-text {
  font-size: 24px;
  font-weight: bold;
}

.correct-text {
  color: #07c160;
}

.wrong-text {
  color: #ee0a24;
}

.mistakes-list {
  margin-top: 24px;
  padding: 16px;
  background: #fff1e6;
  border-radius: 8px;
}

.mistakes-list h3 {
  margin-bottom: 12px;
  color: #ee0a24;
}

.mistakes-list .van-tag {
  margin: 4px;
}
</style>
