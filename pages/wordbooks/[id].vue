<template>
  <div class="wordbook-detail-page">
    <van-nav-bar
      :title="wordbookName"
      left-arrow
      @click-left="goBack"
    />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="fetchWords"
      >
        <van-cell
          v-for="word in words"
          :key="word.id"
          :title="word.word"
          :label="word.phonetic + ' - ' + word.definition"
          is-link
          @click="showWordDetail(word)"
        >
          <template #right-icon>
            <van-icon name="volume-o" @click.stop="speakWord(word.word)" />
          </template>
        </van-cell>
      </van-list>
    </van-pull-refresh>

    <van-floating-button
      type="primary"
      icon="plus"
      position="right-bottom"
      @click="showAddDialog = true"
    />

    <!-- 添加单词弹窗 -->
    <van-dialog
      v-model:show="showAddDialog"
      title="添加单词"
      show-cancel-button
      @confirm="addWord"
    >
      <div class="add-word-form">
        <van-field v-model="newWord.word" label="单词" placeholder="请输入单词" />
        <van-field v-model="newWord.phonetic" label="音标" placeholder="请输入音标" />
        <van-field v-model="newWord.definition" label="释义" placeholder="请输入释义" />
      </div>
    </van-dialog>

    <!-- 单词详情弹窗 -->
    <van-popup v-model:show="showDetailPopup" position="right" style="width: 100%; height: 100%">
      <div class="word-detail-popup">
        <van-nav-bar
          title="单词详情"
          left-text="返回"
          left-arrow
          @click-left="showDetailPopup = false"
        />
        <div v-if="selectedWord" class="detail-content">
          <h2 class="word-title">{{ selectedWord.word }}</h2>
          <p class="word-phonetic">{{ selectedWord.phonetic }}</p>
          <van-button type="primary" size="small" @click="speakWord(selectedWord.word)">
            发音
          </van-button>
          <p class="word-definition">{{ selectedWord.definition }}</p>
          <van-button type="danger" size="small" @click="deleteWord(selectedWord.id)">
            删除
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '单词本详情 - 英语学习平台',
  meta: [
    { name: 'description', content: '查看和管理单词本中的单词' },
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

const route = useRoute()
const router = useRouter()
const { speak } = useTTS()

const wordbookId = route.params.id as string
const wordbookName = ref('单词本')
const words = ref<Word[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showAddDialog = ref(false)
const showDetailPopup = ref(false)
const selectedWord = ref<Word | null>(null)

const newWord = reactive({
  word: '',
  phonetic: '',
  definition: ''
})

const fetchWords = async () => {
  try {
    const { data } = await useFetch<{ words: Word[]; name: string }>(`/api/wordbooks/${wordbookId}`)
    if (data.value) {
      words.value = data.value.words || []
      wordbookName.value = data.value.name || '单词本'
    }
  } finally {
    loading.value = false
    finished.value = true
  }
}

const onRefresh = async () => {
  words.value = []
  finished.value = false
  loading.value = true
  await fetchWords()
  refreshing.value = false
}

const addWord = async () => {
  if (!newWord.word.trim()) return

  try {
    await useFetch(`/api/wordbooks/${wordbookId}/words`, {
      method: 'POST',
      body: { ...newWord }
    })
    showToast('添加成功')
    await fetchWords()
    Object.assign(newWord, { word: '', phonetic: '', definition: '' })
  } catch {
    showToast('添加失败')
  }
}

const showWordDetail = (word: Word) => {
  selectedWord.value = word
  showDetailPopup.value = true
}

const speakWord = async (word: string) => {
  try {
    await speak(word)
  } catch {
    showToast('发音失败')
  }
}

const deleteWord = async (wordId: string) => {
  try {
    await useFetch(`/api/wordbooks/${wordbookId}/words/${wordId}`, {
      method: 'DELETE'
    })
    showToast('删除成功')
    showDetailPopup.value = false
    await fetchWords()
  } catch {
    showToast('删除失败')
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.wordbook-detail-page {
  min-height: 100vh;
  padding-bottom: 80px;
}

.add-word-form {
  padding: 16px;
}

.word-detail-popup {
  height: 100vh;
  background: #f7f8fa;
}

.detail-content {
  padding: 24px 16px;
}

.word-title {
  font-size: 32px;
  margin-bottom: 8px;
}

.word-phonetic {
  color: #666;
  margin-bottom: 16px;
}

.word-definition {
  margin-top: 24px;
  font-size: 16px;
  line-height: 1.6;
}
</style>
