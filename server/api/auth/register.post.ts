import { defineEventHandler, readBody, createError } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, email, password } = body

  if (!username || !email || !password) {
    throw createError({ statusCode: 400, message: '缺少必填字段' })
  }

  // 简单密码hash（生产环境用bcrypt）
  const passwordHash = Buffer.from(password).toString('base64')

  try {
    const user = await prisma.user.create({
      data: { username, email, passwordHash }
    })
    return { success: true, userId: user.id }
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw createError({ statusCode: 409, message: '用户名或邮箱已存在' })
    }
    throw createError({ statusCode: 500, message: '注册失败' })
  }
})
