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
  const { wordId } = await readBody(event)

  if (!wordId) throw createError({ statusCode: 400, message: 'wordId不能为空' })

  // upsert: 已存在则更新错误次数
  const mistake = await prisma.mistakeWord.upsert({
    where: { userId_wordId: { userId, wordId } },
    update: { wrongCount: { increment: 1 }, lastWrongAt: new Date() },
    create: { userId, wordId }
  })
  return { success: true, mistake: { id: mistake.id, wrongCount: mistake.wrongCount } }
})
