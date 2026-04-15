import { defineEventHandler, readBody, getCookie, createError } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function getUserId(event: any): string {
  const token = getCookie(event, 'token')
  if (!token) throw createError({ statusCode: 401, message: '未登录' })
  try {
    const parts = token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (payload.exp < Date.now()) throw new Error('expired')
    return payload.userId
  } catch {
    throw createError({ statusCode: 401, message: '无效token' })
  }
}

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)
  const { date, duration = 0, wordsLearned = 0 } = await readBody(event)

  if (!date) {
    throw createError({ statusCode: 400, message: '日期不能为空' })
  }

  // 解析日期，只取日期部分
  const dateStr = date.split('T')[0]

  // 创建或更新当日的学习记录
  const entry = await prisma.calendarEntry.upsert({
    where: {
      userId_date: {
        userId,
        date: new Date(dateStr)
      }
    },
    update: {
      duration: { increment: duration },
      wordsLearned: { increment: wordsLearned }
    },
    create: {
      userId,
      date: new Date(dateStr),
      duration,
      wordsLearned
    }
  })

  return {
    success: true,
    entry: {
      id: entry.id,
      date: entry.date,
      duration: entry.duration,
      wordsLearned: entry.wordsLearned
    }
  }
})
