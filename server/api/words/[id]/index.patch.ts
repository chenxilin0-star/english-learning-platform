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
  const wordId = getRouterParam(event, 'id')
  const { word, phonetic, meaning, example } = await readBody(event)

  // 查找单词，确保属于当前用户的单词本
  const existingWord = await prisma.word.findFirst({
    where: { id: wordId },
    include: { wordBook: true }
  })

  if (!existingWord) {
    throw createError({ statusCode: 404, message: '单词不存在' })
  }

  if (existingWord.wordBook.userId !== userId) {
    throw createError({ statusCode: 403, message: '无权修改此单词' })
  }

  // 更新单词
  const updatedWord = await prisma.word.update({
    where: { id: wordId },
    data: {
      word: word?.trim() ?? existingWord.word,
      phonetic: phonetic ?? existingWord.phonetic,
      meaning: meaning?.trim() ?? existingWord.meaning,
      example: example ?? existingWord.example
    }
  })

  return {
    success: true,
    word: {
      id: updatedWord.id,
      word: updatedWord.word,
      phonetic: updatedWord.phonetic,
      meaning: updatedWord.meaning,
      example: updatedWord.example
    }
  }
})
