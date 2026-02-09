import { NextResponse } from 'next/server';
import { listSessions } from '@/lib/db';

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取会话列表失败',
      },
      { status: 500 }
    );
  }
}
