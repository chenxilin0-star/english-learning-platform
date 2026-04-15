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

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)
  const { content, wordBookId, format } = await readBody(event)

  if (!content?.trim()) {
    throw createError({ statusCode: 400, message: '导入内容不能为空' })
  }

  if (!wordBookId?.trim()) {
    throw createError({ statusCode: 400, message: '单词本ID不能为空' })
  }

  // 验证单词本属于当前用户
  const wordbook = await prisma.wordBook.findFirst({
    where: { id: wordBookId, userId }
  })

  if (!wordbook) {
    throw createError({ statusCode: 404, message: '单词本不存在' })
  }

  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: []
  }

  if (format === 'csv') {
    // CSV格式：word,phonetic,meaning,example
    const lines = content.split('\n').filter(line => line.trim())
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        // 简单CSV解析，处理带引号的情况
        const parts = parseCSVLine(line)
        
        if (parts.length < 2) {
          result.failed++
          result.errors.push(`行${i + 1}: 格式错误，需要至少单词和释义`)
          continue
        }

        const word = parts[0]?.trim()
        const phonetic = parts[1]?.trim() || ''
        const meaning = parts[2]?.trim() || ''
        const example = parts[3]?.trim() || ''

        if (!word || !meaning) {
          result.failed++
          result.errors.push(`行${i + 1}: 单词和释义不能为空`)
          continue
        }

        await prisma.word.create({
          data: {
            word,
            phonetic,
            meaning,
            example,
            wordBookId
          }
        })
        result.success++
      } catch (e: any) {
        result.failed++
        result.errors.push(`行${i + 1}: ${e.message || '导入失败'}`)
      }
    }
  } else {
    // 文本格式：每行 单词|释义|例句（可选）
    const lines = content.split('\n').filter(line => line.trim())

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      try {
        const parts = line.split('|').map(p => p.trim())
        
        if (parts.length < 2) {
          result.failed++
          result.errors.push(`行${i + 1}: 格式错误，应为 单词|释义|例句（可选）`)
          continue
        }

        const word = parts[0]
        const meaning = parts[1]
        const example = parts[2] || ''

        if (!word || !meaning) {
          result.failed++
          result.errors.push(`行${i + 1}: 单词和释义不能为空`)
          continue
        }

        await prisma.word.create({
          data: {
            word,
            phonetic: '',
            meaning,
            example,
            wordBookId
          }
        })
        result.success++
      } catch (e: any) {
        result.failed++
        result.errors.push(`行${i + 1}: ${e.message || '导入失败'}`)
      }
    }
  }

  return result
})

// 简单CSV行解析函数
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}
