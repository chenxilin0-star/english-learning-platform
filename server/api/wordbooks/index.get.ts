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
  const wordbooks = await prisma.wordBook.findMany({
    where: { userId },
    include: { _count: { select: { words: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return {
    wordbooks: wordbooks.map(wb => ({
      id: wb.id,
      name: wb.name,
      description: wb.description,
      wordCount: wb._count.words,
      createdAt: wb.createdAt
    }))
  }
})
