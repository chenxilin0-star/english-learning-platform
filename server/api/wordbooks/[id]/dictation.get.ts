import { defineEventHandler, getCookie, getRouterParam, getQuery, createError } from 'h3'
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
  const bookId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const count = Math.min(parseInt(query.count as string) || 10, 50)

  const wordbook = await prisma.wordBook.findFirst({ where: { id: bookId, userId } })
  if (!wordbook) throw createError({ statusCode: 404, message: '单词本不存在' })

  const words = await prisma.word.findMany({
    where: { wordBookId: bookId },
    select: { id: true, word: true, phonetic: true, meaning: true }
  })

  if (words.length === 0) return { words: [] }

  // 随机打乱取指定数量
  const shuffled = words.sort(() => Math.random() - 0.5).slice(0, count)
  return {
    words: shuffled.map(w => ({ id: w.id, word: w.word, phonetic: w.phonetic, definition: w.meaning, bookId: bookId }))
  }
})
