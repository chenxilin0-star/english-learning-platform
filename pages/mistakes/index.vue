<template>
  <div class="mistakes-page">
    <van-nav-bar title="错词本" left-arrow @click-left="goBack">
      <template #right>
        <van-icon name="records" size="20" @click="goToReview" />
      </template>
    </van-nav-bar>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="fetchMistakes"
      >
        <van-cell
          v-for="mistake in mistakes"
          :key="mistake.id"
          :title="mistake.word"
          :label="`正确答案: ${mistake.correctAnswer}`"
          is-link
          @click="showMistakeDetail(mistake)"
        >
          <template #icon>
            <van-tag type="danger" size="large" class="mistake-tag">
              {{ mistake.similarity }}%
            </van-tag>
          </template>
        </van-cell>
      </van-list>
    </van-pull-refresh>

    <!-- 错词详情 -->
    <van-popup v-model:show="showDetailPopup" position="right" style="width: 100%; height: 100%">
      <div class="mistake-detail-popup">
        <van-nav-bar
          title="错词详情"
          left-text="返回"
          left-arrow
          @click-left="showDetailPopup = false"
        />
        <div v-if="selectedMistake" class="detail-content">
          <h2 class="word-title">{{ selectedMistake.word }}</h2>
          <van-button type="primary" size="small" @click="speakWord(selectedMistake.word)">
            发音
          </van-button>

          <van-cell-group inset style="margin-top: 24px">
            <van-cell title="正确答案" :value="selectedMistake.correctAnswer" />
            <van-cell title="你的答案" :value="selectedMistake.userAnswer" />
            <van-cell title="相似度" :value="selectedMistake.similarity + '%'" />
            <van-cell title="错误日期" :value="formatDate(selectedMistake.createdAt)" />
          </van-cell-group>

          <div class="detail-actions">
            <van-button type="primary" block @click="practiceWord(selectedMistake)">
              练习此单词
            </van-button>
            <van-button type="default" block @click="removeMistake(selectedMistake.id)">
              从错词本移除
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '错词本 - 英语学习平台',
  meta: [
    { name: 'description', content: '查看和管理您的错词' },
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
  createdAt: string
}

const router = useRouter()
const { speak } = useTTS()

const mistakes = ref<Mistake[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showDetailPopup = ref(false)
const selectedMistake = ref<Mistake | null>(null)

const fetchMistakes = async () => {
  try {
    const { data } = await useFetch<{ mistakes: Mistake[] }>('/api/mistakes')
    if (data.value?.mistakes) {
      mistakes.value = data.value.mistakes
    }
  } finally {
    loading.value = false
    finished.value = true
  }
}

const onRefresh = async () => {
  mistakes.value = []
  finished.value = false
  loading.value = true
  await fetchMistakes()
  refreshing.value = false
}

const showMistakeDetail = (mistake: Mistake) => {
  selectedMistake.value = mistake
  showDetailPopup.value = true
}

const speakWord = async (word: string) => {
  try {
    await speak(word)
  } catch {
    showToast('发音失败')
  }
}

const practiceWord = async (mistake: Mistake) => {
  showDetailPopup.value = false
  // 跳转到听写页面并设置只练习这个单词
  router.push({
    path: '/dictation',
    query: { wordId: mistake.wordId }
  })
}

const removeMistake = async (mistakeId: string) => {
  try {
    await useFetch(`/api/mistakes/${mistakeId}`, {
      method: 'DELETE'
    })
    showToast('已移除')
    showDetailPopup.value = false
    await fetchMistakes()
  } catch {
    showToast('移除失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goToReview = () => {
  router.push('/mistakes/review')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.mistakes-page {
  min-height: 100vh;
}

.mistake-tag {
  margin-right: 12px;
}

.mistake-detail-popup {
  height: 100vh;
  background: #f7f8fa;
}

.detail-content {
  padding: 24px 16px;
}

.word-title {
  font-size: 32px;
  margin-bottom: 16px;
}

.detail-actions {
  margin-top: 32px;
}

.detail-actions .van-button {
  margin-bottom: 12px;
}
</style>
