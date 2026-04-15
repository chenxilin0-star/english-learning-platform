<template>
  <div class="calendar-page">
    <van-nav-bar title="学习日历" left-arrow @click-left="goBack" />

    <div class="calendar-container">
      <van-calendar
        v-model:show="showCalendar"
        :default-date="currentDate"
        :poppable="false"
        :show-confirm="false"
        :formatter="formatterDay"
        @select="onDaySelect"
      />

      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-dot success"></span>
          <span>已完成</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot warning"></span>
          <span>部分完成</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot danger"></span>
          <span>未完成</span>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <h3>学习统计</h3>
      <van-cell-group inset>
        <van-cell title="连续学习" :value="`${streak} 天`" />
        <van-cell title="本周学习" :value="`${weekCount} 天`" />
        <van-cell title="本月学习" :value="`${monthCount} 天`" />
        <van-cell title="累计学习" :value="`${totalDays} 天`" />
      </van-cell-group>
    </div>

    <div class="records-section">
      <h3>{{ selectedDate }} 学习记录</h3>
      <van-cell-group inset>
        <van-cell
          v-for="record in dayRecords"
          :key="record.id"
          :title="record.type"
          :label="record.description"
          :value="record.count + '个'"
        />
        <van-empty v-if="dayRecords.length === 0" description="当日暂无学习记录" />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: '学习日历 - 英语学习平台',
  meta: [
    { name: 'description', content: '查看您的学习日历和统计' },
    { name: 'robots', content: 'noindex' }
  ]
})

interface StudyRecord {
  id: string
  type: string
  description: string
  count: number
  date: string
}

interface DayStat {
  date: string
  status: 'completed' | 'partial' | 'none'
  wordsLearned: number
  dictationDone: boolean
}

const router = useRouter()

const showCalendar = ref(true)
const currentDate = ref(new Date())
const selectedDate = ref('')
const streak = ref(0)
const weekCount = ref(0)
const monthCount = ref(0)
const totalDays = ref(0)
const dayRecords = ref<StudyRecord[]>([])
const dayStats = ref<Map<string, DayStat>>(new Map())

// 格式化日期为 YYYY-MM-DD
const formatDateStr = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 日历日期格式化
const formatterDay = (day: any) => {
  const dateStr = formatDateStr(day.date)
  const stat = dayStats.value.get(dateStr)

  if (stat) {
    if (stat.status === 'completed') {
      day.className = 'calendar-day completed'
      day.bottomInfo = '✓'
    } else if (stat.status === 'partial') {
      day.className = 'calendar-day partial'
      day.bottomInfo = '○'
    } else {
      day.className = 'calendar-day none'
    }
  }

  return day
}

// 选中日期
const onDaySelect = async (date: Date) => {
  selectedDate.value = formatDateStr(date)
  await fetchDayRecords(selectedDate.value)
}

// 获取日期记录
const fetchDayRecords = async (date: string) => {
  try {
    const { data } = await useFetch<{ records: StudyRecord[] }>('/api/calendar/records', {
      query: { date }
    })
    if (data.value?.records) {
      dayRecords.value = data.value.records
    }
  } catch (e) {
    console.error('获取记录失败', e)
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const { data } = await useFetch<{
      streak: number
      weekCount: number
      monthCount: number
      totalDays: number
      dayStats: Record<string, DayStat>
    }>('/api/calendar/stats')

    if (data.value) {
      streak.value = data.value.streak || 0
      weekCount.value = data.value.weekCount || 0
      monthCount.value = data.value.monthCount || 0
      totalDays.value = data.value.totalDays || 0

      // 转换日期统计
      if (data.value.dayStats) {
        Object.entries(data.value.dayStats).forEach(([date, stat]) => {
          dayStats.value.set(date, stat as DayStat)
        })
      }
    }
  } catch (e) {
    console.error('获取统计失败', e)
  }
}

const goBack = () => {
  router.back()
}

onMounted(async () => {
  selectedDate.value = formatDateStr(new Date())
  await fetchStats()
  await fetchDayRecords(selectedDate.value)
})
</script>

<style scoped>
.calendar-page {
  min-height: 100vh;
  padding-bottom: 24px;
}

.calendar-container {
  padding: 16px;
  background: white;
  margin-bottom: 24px;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.success {
  background: #07c160;
}

.legend-dot.warning {
  background: #ff976a;
}

.legend-dot.danger {
  background: #ebedf0;
}

.stats-section,
.records-section {
  padding: 0 16px;
}

.stats-section h3,
.records-section h3 {
  margin-bottom: 12px;
  font-size: 16px;
  color: #333;
}

:deep(.calendar-day.completed) {
  background: #e6f7e6;
  border-radius: 50%;
}

:deep(.calendar-day.partial) {
  background: #fff1e6;
  border-radius: 50%;
}

:deep(.calendar-day.none) {
  background: transparent;
}
</style>
