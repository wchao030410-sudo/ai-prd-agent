import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // 读取 Prisma schema 文件内容
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')
    const schemaContent = readFileSync(schemaPath, 'utf-8')

    // 提取 datasource 配置
    const datasourceMatch = schemaContent.match(/datasource db \{([^}]+)\}/s)
    const datasourceConfig = datasourceMatch ? datasourceMatch[1].trim() : 'Not found'

    // 提取 provider
    const providerMatch = datasourceConfig.match(/provider\s+=\s+"(\w+)"/)
    const provider = providerMatch ? providerMatch[1] : 'unknown'

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      prisma: {
        datasourceProvider: provider,
        fullDatasourceConfig: datasourceConfig,
        schemaPath,
        fileExists: true
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read Prisma schema',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
