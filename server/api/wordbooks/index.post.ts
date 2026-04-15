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
  const { name, description } = await readBody(event)

  if (!name?.trim()) {
    throw createError({ statusCode: 400, message: '单词本名称不能为空' })
  }

  const wordbook = await prisma.wordBook.create({
    data: { name: name.trim(), description: description || '', userId }
  })
  return { success: true, wordbook: { id: wordbook.id, name: wordbook.name } }
})
