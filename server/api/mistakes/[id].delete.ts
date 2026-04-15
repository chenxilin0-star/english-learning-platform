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
  const id = getRouterParam(event, 'id')

  const mistake = await prisma.mistakeWord.findFirst({ where: { id, userId } })
  if (!mistake) throw createError({ statusCode: 404, message: '记录不存在' })

  await prisma.mistakeWord.delete({ where: { id } })
  return { success: true }
})
