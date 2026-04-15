import { defineEventHandler, getCookie, createError } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'token')
  if (!token) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid token')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (payload.exp < Date.now()) throw new Error('Token expired')

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, createdAt: true }
    })
    if (!user) throw createError({ statusCode: 404, message: '用户不存在' })

    return { user }
  } catch (e: any) {
    throw createError({ statusCode: 401, message: '无效的token' })
  }
})
