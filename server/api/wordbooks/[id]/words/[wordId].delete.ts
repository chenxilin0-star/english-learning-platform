import { defineEventHandler, getCookie, getRouterParam, createError } from 'h3'
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
  const wordId = getRouterParam(event, 'wordId')

  const wordbook = await prisma.wordBook.findFirst({ where: { id: bookId, userId } })
  if (!wordbook) throw createError({ statusCode: 404, message: '单词本不存在' })

  await prisma.word.delete({ where: { id: wordId, wordBookId: bookId } })
  return { success: true }
})
