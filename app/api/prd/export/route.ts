import { NextRequest, NextResponse } from 'next/server';
import { getPRDBySession, getSession } from '@/lib/db';
import { z } from 'zod';
import { generatePDFFromMarkdown } from '@/lib/export/pdf-generator';
import { generateDocxFromMarkdown } from '@/lib/export/docx-generator';

// 导出请求验证 schema
const ExportPRDSchema = z.object({
  sessionId: z.string().min(1, '会话 ID 不能为空'),
  format: z.enum(['md', 'pdf', 'docx']),
});

/**
 * 导出 PRD 为指定格式
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const format = searchParams.get('format') as 'md' | 'pdf' | 'docx';

    // 验证请求
    if (!sessionId || !format) {
      return NextResponse.json(
        { error: '缺少必要参数：sessionId 或 format' },
        { status: 400 }
      );
    }

    const result = ExportPRDSchema.safeParse({ sessionId, format });
    if (!result.success) {
      return NextResponse.json(
        { error: '请求参数错误', details: result.error },
        { status: 400 }
      );
    }

    // 获取 PRD
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      );
    }

    const prd = await getPRDBySession(sessionId);
    if (!prd) {
      return NextResponse.json(
        { error: 'PRD 不存在' },
        { status: 404 }
      );
    }

    // 检查是否已生成最终版本
    if (!prd.isFinal || !prd.finalContent) {
      return NextResponse.json(
        { error: '请先生成最终版本的 PRD' },
        { status: 400 }
      );
    }

    const content = prd.finalContent;
    const filename = `${prd.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_PRD`;

    // 根据格式返回内容
    switch (format) {
      case 'md':
        // Markdown 格式 - 直接返回文本
        // 使用 RFC 2231 编码处理中文文件名
        const encodedFilename = encodeURIComponent(filename + '.md');
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
          },
        });

      case 'pdf':
        // PDF 格式
        try {
          const pdfBuffer = await generatePDFFromMarkdown(content, filename);
          const encodedFilename = encodeURIComponent(filename + '.pdf');
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
              'Content-Length': pdfBuffer.length.toString(),
            },
          });
        } catch (pdfError) {
          return NextResponse.json(
            {
              success: false,
              error: 'PDF 生成失败',
              details: pdfError instanceof Error ? pdfError.message : 'Unknown error',
            },
            { status: 500 }
          );
        }

      case 'docx':
        // Word (DOCX) 格式
        try {
          const docxBuffer = await generateDocxFromMarkdown(content, filename);
          const encodedFilename = encodeURIComponent(filename + '.docx');
          return new NextResponse(docxBuffer, {
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
              'Content-Length': docxBuffer.length.toString(),
            },
          });
        } catch (docxError) {
          return NextResponse.json(
            {
              success: false,
              error: 'Word 文档生成失败',
              details: docxError instanceof Error ? docxError.message : 'Unknown error',
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: '不支持的导出格式' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '导出 PRD 失败',
      },
      { status: 500 }
    );
  }
}
