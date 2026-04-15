<template>
  <div class="wordbooks-page">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="fetchWordbooks"
      >
        <van-cell
          v-for="book in wordbooks"
          :key="book.id"
          :title="book.name"
          :label="`${book.wordCount} 个单词`"
          is-link
          @click="goToBook(book.id)"
        />
      </van-list>
    </van-pull-refresh>

    <van-floating-button
      type="primary"
      icon="plus"
      position="right-bottom"
      @click="showAddDialog = true"
    />

    <van-dialog
      v-model:show="showAddDialog"
      title="新建单词本"
      show-cancel-button
      @confirm="createWordbook"
    >
      <van-field
        v-model="newBookName"
        placeholder="请输入单词本名称"
        class="add-input"
      />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '单词库 - 英语学习平台',
  meta: [
    { name: 'description', content: '管理您的单词本' },
    { name: 'robots', content: 'noindex' }
  ]
})

interface Wordbook {
  id: string
  name: string
  wordCount: number
  createdAt: string
}

const wordbooks = ref<Wordbook[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const showAddDialog = ref(false)
const newBookName = ref('')

const fetchWordbooks = async () => {
  try {
    const { data } = await useFetch<{ wordbooks: Wordbook[] }>('/api/wordbooks')
    if (data.value?.wordbooks) {
      wordbooks.value = data.value.wordbooks
    }
  } finally {
    loading.value = false
    finished.value = true
  }
}

const onRefresh = async () => {
  wordbooks.value = []
  finished.value = false
  loading.value = true
  await fetchWordbooks()
  refreshing.value = false
}

const createWordbook = async () => {
  if (!newBookName.value.trim()) return

  try {
    const { data } = await useFetch('/api/wordbooks', {
      method: 'POST',
      body: { name: newBookName.value }
    })
    if (data.value) {
      showToast('创建成功')
      await fetchWordbooks()
      newBookName.value = ''
    }
  } catch {
    showToast('创建失败')
  }
}

const goToBook = (id: string) => {
  navigateTo(`/wordbooks/${id}`)
}
</script>

<style scoped>
.wordbooks-page {
  min-height: 100vh;
  padding-bottom: 80px;
}

.add-input {
  padding: 16px;
}
</style>
