import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // 读取 Prisma schema 文件内容
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')
    const schemaContent = readFileSync(schemaPath, 'utf-8')

    // 提取 datasource 配置（不使用 's' flag，改用字符匹配）
    const lines = schemaContent.split('\n')
    let inDatasource = false
    let datasourceConfig = ''
    let braceCount = 0

    for (const line of lines) {
      if (line.includes('datasource db')) {
        inDatasource = true
        braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
        datasourceConfig += line + '\n'
        continue
      }

      if (inDatasource) {
        braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
        datasourceConfig += line + '\n'

        if (braceCount === 0) {
          break
        }
      }
    }

    const datasourceConfigTrimmed = datasourceConfig.trim()

    // 提取 provider
    const providerMatch = datasourceConfigTrimmed.match(/provider\s+=\s+"(\w+)"/)
    const provider = providerMatch ? providerMatch[1] : 'unknown'

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      prisma: {
        datasourceProvider: provider,
        fullDatasourceConfig: datasourceConfigTrimmed,
        schemaPath,
        fileExists: true
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to read Prisma schema',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
