import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      ZHIPU_API_KEY: process.env.ZHIPU_API_KEY ? '✓ Set' : '✗ Missing',
      DATABASE_URL: process.env.DATABASE_URL ? '✓ Set' : '✗ Missing',
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ? '✓ Set' : '✗ Missing',
      ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET ? '✓ Set' : '✗ Missing',
    },
    prisma: {
      status: 'checking...'
    }
  }

  // Test Prisma connection
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    checks.prisma = { status: '✓ OK', message: 'Database connection successful' }
  } catch (error) {
    checks.prisma = {
      status: '✗ Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error)
    }
  }

  return NextResponse.json(checks)
}
