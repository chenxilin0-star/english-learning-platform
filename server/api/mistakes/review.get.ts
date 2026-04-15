import { defineEventHandler, getCookie, createError } from 'h3'
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
  const mistakes = await prisma.mistakeWord.findMany({
    where: { userId },
    include: { word: true },
    orderBy: { wrongCount: 'desc' }
  })
  return {
    reviewWords: mistakes.map(m => ({
      id: m.id,
      wordId: m.wordId,
      word: m.word.word,
      phonetic: m.word.phonetic,
      meaning: m.word.meaning,
      wrongCount: m.wrongCount
    }))
  }
})
