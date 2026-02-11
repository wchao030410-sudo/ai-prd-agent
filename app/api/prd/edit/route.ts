import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai';
import { PRD_EDIT_PROMPT, PRD_EDIT_SYSTEM_PROMPT } from '@/lib/prompts/prd-edit-prompt';
import { getPRDBySession, updatePRD, createMessage, getSession } from '@/lib/db';
import { PRDDocument } from '@/types/prd';
import { z } from 'zod';

// PRD 编辑请求验证 schema
const EditPRDSchema = z.object({
  sessionId: z.string().min(1, '会话 ID 不能为空'),
  instruction: z.string().min(1, '编辑指令不能为空'),
  targetField: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求
    const result = EditPRDSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: '请求参数错误', details: result.error },
        { status: 400 }
      );
    }

    const { sessionId, instruction, targetField } = result.data;

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
        { error: 'PRD 不存在，请先生成 PRD' },
        { status: 404 }
      );
    }

    // 解析当前 PRD 数据
    const prdData: PRDDocument = {
      title: currentPRD.title,
      description: currentPRD.description,
      background: currentPRD.background || undefined,
      targetUsers: JSON.parse(currentPRD.targetUsers),
      painPoints: currentPRD.painPoints ? JSON.parse(currentPRD.painPoints) : undefined,
      coreValue: currentPRD.coreValue ? JSON.parse(currentPRD.coreValue) : undefined,
      features: JSON.parse(currentPRD.features),
      successMetrics: currentPRD.successMetrics ? JSON.parse(currentPRD.successMetrics) : undefined,
      techFeasibility: currentPRD.techFeasibility ? JSON.parse(currentPRD.techFeasibility) : undefined,
      competitors: currentPRD.competitors ? JSON.parse(currentPRD.competitors) : undefined,
    };

    // 生成编辑 Prompt
    const prompt = PRD_EDIT_PROMPT(prdData, instruction, targetField);

    // 调用 AI 编辑 PRD
    const response = await chat(PRD_EDIT_SYSTEM_PROMPT, prompt, [], 'json_object');

    // 解析 JSON 响应
    let updatedPRDData: PRDDocument;
    try {
      updatedPRDData = JSON.parse(response);
    } catch {
      // 如果 JSON 解析失败，尝试提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        updatedPRDData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI 返回的格式不正确');
      }
    }

    // 验证返回的 PRD 数据结构
    if (!updatedPRDData.title || !updatedPRDData.description || !updatedPRDData.features) {
      throw new Error('AI 返回的 PRD 数据结构不完整');
    }

    // 更新数据库中的 PRD
    await updatePRD(currentPRD.id, {
      title: updatedPRDData.title,
      description: updatedPRDData.description,
      background: updatedPRDData.background,
      targetUsers: JSON.stringify(updatedPRDData.targetUsers),
      painPoints: JSON.stringify(updatedPRDData.painPoints || []),
      coreValue: JSON.stringify(updatedPRDData.coreValue || []),
      features: JSON.stringify(updatedPRDData.features),
      successMetrics: JSON.stringify(updatedPRDData.successMetrics || []),
      techFeasibility: JSON.stringify(updatedPRDData.techFeasibility),
      competitors: JSON.stringify(updatedPRDData.competitors || []),
    });

    // 保存编辑消息到对话历史
    await createMessage(
      sessionId,
      'user',
      instruction
    );

    await createMessage(
      sessionId,
      'assistant',
      `已根据指令更新 PRD：${instruction}`
    );

    return NextResponse.json({
      success: true,
      data: {
        prd: updatedPRDData,
        message: 'PRD 已更新',
      },
    });
  } catch (error) {
    console.error('编辑 PRD 失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '编辑 PRD 失败',
      },
      { status: 500 }
    );
  }
}
