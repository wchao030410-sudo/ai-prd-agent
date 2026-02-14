import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai';
import { DIAGRAM_EDIT_PROMPT } from '@/lib/prompts/diagram-prompts';
import { getPRDBySession, updatePRD, createMessage, getSession } from '@/lib/db';
import { z } from 'zod';

// 图表编辑请求验证 schema
const EditDiagramSchema = z.object({
  sessionId: z.string().min(1, '会话 ID 不能为空'),
  diagramType: z.enum(['architecture', 'journey', 'features']),
  instruction: z.string().min(1, '编辑指令不能为空'),
});

const DIAGRAM_EDIT_SYSTEM_PROMPT = `你是一个专业的图表编辑助手，擅长根据用户指令修改 Mermaid 图表。

你的任务是根据用户的修改指令，更新现有的 Mermaid 图表代码。

要求：
- 保持 Mermaid 语法正确
- 只返回修改后的 Mermaid 代码
- 不要添加任何解释性文字
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求
    const result = EditDiagramSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: '请求参数错误', details: result.error },
        { status: 400 }
      );
    }

    const { sessionId, diagramType, instruction } = result.data;

    // 获取当前会话和 PRD
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      );
    }

    const currentPRD = await getPRDBySession(sessionId);
    if (!currentPRD) {
      return NextResponse.json(
        { error: 'PRD 不存在' },
        { status: 404 }
      );
    }

    // 获取当前图表代码
    const diagramFieldMap = {
      architecture: 'mermaidArchitecture',
      journey: 'mermaidJourney',
      features: 'mermaidFeatures',
    } as const;

    const field = diagramFieldMap[diagramType];
    const currentCode = currentPRD[field];

    if (!currentCode) {
      return NextResponse.json(
        { error: '图表不存在，请先生成图表' },
        { status: 404 }
      );
    }

    // 生成编辑 Prompt
    const prompt = DIAGRAM_EDIT_PROMPT(diagramType, currentCode, instruction);

    // 调用 AI 编辑图表
    const response = await chat(DIAGRAM_EDIT_SYSTEM_PROMPT, prompt, [], 'text');

    // 清理返回的 Mermaid 代码
    const cleanedCode = response
      .replace(/```mermaid\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // 更新数据库中的图表
    await updatePRD(currentPRD.id, {
      [field]: cleanedCode,
    });

    // 保存编辑消息到对话历史
    const diagramNames = {
      architecture: '系统架构图',
      journey: '用户旅程图',
      features: '功能模块图',
    };

    await createMessage(
      sessionId,
      'user',
      instruction
    );

    await createMessage(
      sessionId,
      'assistant',
      `已更新${diagramNames[diagramType]}`
    );

    return NextResponse.json({
      success: true,
      data: {
        diagramType,
        code: cleanedCode,
        message: `${diagramNames[diagramType]}已更新`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '编辑图表失败',
      },
      { status: 500 }
    );
  }
}
