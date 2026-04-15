import { defineEventHandler, readBody, getCookie, getRouterParam, createError } from 'h3'
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
  const { word, phonetic, meaning, example } = await readBody(event)

  if (!word?.trim() || !meaning?.trim()) {
    throw createError({ statusCode: 400, message: '单词和释义不能为空' })
  }

  const wordbook = await prisma.wordBook.findFirst({ where: { id: bookId, userId } })
  if (!wordbook) throw createError({ statusCode: 404, message: '单词本不存在' })

  const newWord = await prisma.word.create({
    data: { word: word.trim(), phonetic: phonetic || '', meaning: meaning.trim(), example: example || '', wordBookId: bookId! }
  })
  return { success: true, word: newWord }
})
