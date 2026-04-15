import { defineEventHandler, getQuery, getCookie, createError } from 'h3'
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
  const { year, month } = getQuery(event)

  if (!year || !month) {
    throw createError({ statusCode: 400, message: 'year 和 month 参数必填' })
  }

  const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1)
  const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59)

  const entries = await prisma.calendarEntry.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate }
    },
    orderBy: { date: 'asc' }
  })

  return {
    success: true,
    year: parseInt(year as string),
    month: parseInt(month as string),
    entries: entries.map(e => ({
      id: e.id,
      date: e.date,
      type: e.type,
      duration: e.duration,
      wordCount: e.wordCount
    }))
  }
})
