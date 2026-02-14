import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession } from '@/lib/db';

// GET - 获取单个会话详情（包含 PRD）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getSession(id);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '会话不存在',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取会话失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除会话
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 删除会话（级联删除相关的 PRD 和消息）
    await deleteSession(id);

    return NextResponse.json({
      success: true,
      message: '会话已删除',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除会话失败',
      },
      { status: 500 }
    );
  }
}
