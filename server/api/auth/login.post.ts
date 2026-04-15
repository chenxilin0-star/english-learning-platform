import { defineEventHandler, readBody, createError, setCookie } from 'h3'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function signJWT(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 86400 * 1000 })).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url')
  return header + '.' + body + '.' + sig
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({ statusCode: 400, message: '请输入用户名和密码' })
  }

  const passwordHash = Buffer.from(password).toString('base64')

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
      passwordHash
    }
  })

  if (!user) {
    throw createError({ statusCode: 401, message: '用户名或密码错误' })
  }

  const token = signJWT({ userId: user.id, username: user.username })

  setCookie(event, 'token', token, {
    httpOnly: true,
    maxAge: 7 * 86400,
    path: '/',
    sameSite: 'lax'
  })

  return {
    success: true,
    token,
    user: { id: user.id, username: user.username, email: user.email }
  }
})
