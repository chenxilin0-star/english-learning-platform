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

    <van-floating-button
      type="warning"
      icon="records"
      position="left-bottom"
      style="bottom: 90px"
      @click="showImportPopup = true"
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
        <!-- 编辑模式 -->
        <div v-if="isEditMode" class="edit-content">
          <van-cell-group inset>
            <van-field v-model="editWord.word" label="单词" placeholder="请输入单词" />
            <van-field v-model="editWord.phonetic" label="音标" placeholder="请输入音标" />
            <van-field v-model="editWord.meaning" label="释义" placeholder="请输入释义" />
            <van-field v-model="editWord.example" label="例句" placeholder="请输入例句" type="textarea" rows="3" />
          </van-cell-group>
          <div class="edit-actions">
            <van-button type="primary" round block @click="saveWord">保存</van-button>
            <van-button plain round block @click="cancelEdit">取消</van-button>
          </div>
        </div>
        <!-- 查看模式 -->
        <div v-else-if="selectedWord" class="detail-content">
          <h2 class="word-title">{{ selectedWord.word }}</h2>
          <p class="word-phonetic">{{ selectedWord.phonetic }}</p>
          <van-button type="primary" size="small" @click="speakWord(selectedWord.word)">
            发音
          </van-button>
          <p class="word-definition">{{ selectedWord.definition }}</p>
          <p v-if="selectedWord.example" class="word-example">{{ selectedWord.example }}</p>
          <div class="detail-actions">
            <van-button type="warning" size="small" @click="startEdit">编辑</van-button>
            <van-button type="danger" size="small" @click="deleteWord(selectedWord.id)">删除</van-button>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 批量导入弹窗 -->
    <van-popup v-model:show="showImportPopup" position="bottom" style="height: 80%">
      <div class="import-popup">
        <van-nav-bar
          title="批量导入单词"
          left-text="关闭"
          left-arrow
          @click-left="showImportPopup = false"
        />
        <van-tabs v-model:active="importTab">
          <van-tab title="文本粘贴" name="text">
            <div class="import-text-area">
              <van-field
                v-model="importText"
                type="textarea"
                placeholder="每行一个单词，格式：单词|释义|例句（可选）
例如：
hello|你好|Hello, world!
apple|苹果|An apple a day keeps the doctor away."
                rows="10"
              />
              <van-button type="primary" round block @click="importFromText">导入</van-button>
            </div>
          </van-tab>
          <van-tab title="CSV上传" name="csv">
            <div class="import-csv-area">
              <van-uploader :after-read="handleCSVUpload" accept=".csv">
                <van-button type="primary" icon="plus">选择CSV文件</van-button>
              </van-uploader>
              <p class="csv-format">CSV格式：word,phonetic,meaning,example</p>
            </div>
          </van-tab>
        </van-tabs>
        <div v-if="importResult" class="import-result">
          <van-cell-group inset>
            <van-cell title="成功" :value="importResult.success" />
            <van-cell title="失败" :value="importResult.failed" />
          </van-cell-group>
          <div v-if="importResult.errors.length > 0" class="import-errors">
            <p v-for="(err, idx) in importResult.errors" :key="idx" class="error-item">{{ err }}</p>
          </div>
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
  example?: string
  bookId: string
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
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
const showImportPopup = ref(false)
const selectedWord = ref<Word | null>(null)

// 编辑相关状态
const isEditMode = ref(false)
const editWord = reactive({
  word: '',
  phonetic: '',
  meaning: '',
  example: ''
})

// 批量导入相关状态
const importTab = ref('text')
const importText = ref('')
const importResult = ref<ImportResult | null>(null)

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
  isEditMode.value = false
}

const startEdit = () => {
  if (!selectedWord.value) return
  editWord.word = selectedWord.value.word
  editWord.phonetic = selectedWord.value.phonetic || ''
  editWord.meaning = selectedWord.value.definition || ''
  editWord.example = selectedWord.value.example || ''
  isEditMode.value = true
}

const cancelEdit = () => {
  isEditMode.value = false
}

const saveWord = async () => {
  if (!selectedWord.value || !editWord.word.trim() || !editWord.meaning.trim()) {
    showToast('单词和释义不能为空')
    return
  }

  try {
    await useFetch(`/api/words/${selectedWord.value.id}`, {
      method: 'PATCH',
      body: {
        word: editWord.word,
        phonetic: editWord.phonetic,
        meaning: editWord.meaning,
        example: editWord.example
      }
    })
    showToast('保存成功')
    isEditMode.value = false
    await fetchWords()
    // 更新选中单词的显示
    if (selectedWord.value) {
      selectedWord.value.word = editWord.word
      selectedWord.value.phonetic = editWord.phonetic
      selectedWord.value.definition = editWord.meaning
      selectedWord.value.example = editWord.example
    }
  } catch {
    showToast('保存失败')
  }
}

const importFromText = async () => {
  if (!importText.value.trim()) {
    showToast('请输入要导入的内容')
    return
  }

  try {
    const { data } = await useFetch<ImportResult>('/api/words/import', {
      method: 'POST',
      body: {
        content: importText.value,
        wordBookId: wordbookId,
        format: 'text'
      }
    })
    if (data.value) {
      importResult.value = data.value
      if (data.value.failed === 0) {
        showToast(`成功导入 ${data.value.success} 个单词`)
        importText.value = ''
        await fetchWords()
      } else {
        showToast(`导入完成：成功 ${data.value.success}，失败 ${data.value.failed}`)
      }
    }
  } catch {
    showToast('导入失败')
  }
}

const handleCSVUpload = async (file: any) => {
  try {
    const text = file.content as string
    const { data } = await useFetch<ImportResult>('/api/words/import', {
      method: 'POST',
      body: {
        content: text,
        wordBookId: wordbookId,
        format: 'csv'
      }
    })
    if (data.value) {
      importResult.value = data.value
      if (data.value.failed === 0) {
        showToast(`成功导入 ${data.value.success} 个单词`)
        await fetchWords()
      } else {
        showToast(`导入完成：成功 ${data.value.success}，失败 ${data.value.failed}`)
      }
    }
  } catch {
    showToast('导入失败')
  }
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

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.edit-content {
  padding: 24px 16px;
}

.edit-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.word-example {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
  font-style: italic;
  line-height: 1.6;
}

/* 批量导入弹窗样式 */
.import-popup {
  height: 100%;
  background: #f7f8fa;
}

.import-text-area {
  padding: 16px;
}

.import-csv-area {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.csv-format {
  font-size: 12px;
  color: #999;
}

.import-result {
  margin-top: 16px;
}

.import-errors {
  margin-top: 12px;
  padding: 12px;
  background: #fff1e6;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.error-item {
  font-size: 12px;
  color: #ee0a24;
  margin: 4px 0;
}
</style>
