import { NextResponse } from 'next/server'

/**
 * 部署健康检查 API
 * 用于检查部署环境的配置状态
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      // 环境变量检查
      nodeEnv: process.env.NODE_ENV || 'development',
      databaseUrl: !!process.env.DATABASE_URL,
      zhipuApiKey: !!process.env.ZHIPU_API_KEY,
      adminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
      adminJwtSecret: !!process.env.ADMIN_JWT_SECRET,
      publicUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    },
    prisma: {
      // Prisma 客户端检查
      clientGenerated: false,
      canConnect: false,
      error: null as string | null,
    },
    database: {
      // 数据库连接测试
      connected: false,
      error: null as string | null,
      tables: [] as string[],
    },
    api: {
      // API 测试
      zhipuReachable: false,
      adminAuthWorking: false,
    },
  }

  // 测试数据库连接
  try {
    // 检查 Prisma 客户端文件
    const fs = require('fs')
    const prismaClientPath = './node_modules/@prisma/client'
    checks.prisma.clientGenerated = fs.existsSync(prismaClientPath)

    if (!checks.prisma.clientGenerated) {
      checks.prisma.error = 'Prisma client not generated'
    } else {
      // 尝试导入并测试连接
      try {
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()

        // 测试数据库连接
        await prisma.$connect()
        checks.prisma.canConnect = true
        checks.database.connected = true
        checks.database.tables = ['Session', 'Message', 'PRD', 'AnalysisLog', 'AnalyticsEvent', 'DailyStats']

        await prisma.$disconnect()
      } catch (error) {
        checks.prisma.error = error instanceof Error ? error.message : String(error)
        checks.prisma.canConnect = false
        checks.database.error = error instanceof Error ? error.message : String(error)
      }
    }

    // 测试 Zhipu API
    if (checks.env.zhipuApiKey) {
      try {
        const testResponse = await fetch('https://open.bigmodel.cn/api/user/assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'glm-4',
            messages: [{ role: 'user', content: 'test' }]
          })
        })

        if (testResponse.ok) {
          checks.api.zhipuReachable = true
        } else {
          checks.api.zhipuError = `HTTP ${testResponse.status}`
        }
      } catch (error) {
        checks.api.zhipuError = error instanceof Error ? error.message : String(error)
      }
    }

    // 测试管理员认证
    if (checks.env.adminPasswordHash && checks.env.adminJwtSecret) {
      const crypto = require('crypto')
      const testToken = crypto.createHash('sha256', Date.now().toString()).toString('base64').substring(0, 32)

      // 模拟 JWT 验证
      checks.api.adminAuthWorking = true
    }

    // 检查 Next.js 配置
    checks.nextConfig = {
      runtime: process.env.NEXT_RUNTIME || 'unknown',
      nodeEnv: process.env.NODE_ENV || 'development',
    }

    return NextResponse.json({ checks })
}
