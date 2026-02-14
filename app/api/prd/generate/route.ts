import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai';
import { PRD_GENERATION_PROMPT, SYSTEM_PROMPT } from '@/lib/prompts/prd-template';
import { createSession, createPRD, createMessage, updateSession } from '@/lib/db';
import { PRDDocument } from '@/types/prd';
import { z } from 'zod';
import { trackPRDGeneration } from '@/lib/analytics';
import { getAnonymousIdFromCookie } from '@/lib/anonymous-user';

// PRD 数据验证 schema
const GeneratePRDSchema = z.object({
  idea: z.string().min(10, '产品想法至少需要10个字符'),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let anonymousId: string = 'unknown'
  let sessionId: string | undefined = undefined

  try {
    const body = await request.json();

    // 验证请求
    const result = GeneratePRDSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: '请求参数错误', details: result.error },
        { status: 400 }
      );
    }

    const { idea, anonymousId: reqAnonymousId, sessionId: reqSessionId } = result.data;
    anonymousId = reqAnonymousId || getAnonymousIdFromCookie(request);
    sessionId = reqSessionId || undefined;

    // 创建新会话
    const session = await createSession(idea.slice(0, 50), anonymousId, sessionId);

    // 保存用户消息
    await createMessage(session.id, 'user', idea);

    // 生成 PRD
    const prompt = PRD_GENERATION_PROMPT(idea);
    const response = await chat(SYSTEM_PROMPT, prompt, [], 'json_object');

    // 解析 JSON 响应
    let prdData: PRDDocument;
    try {
      prdData = JSON.parse(response);
    } catch {
      // 如果 JSON 解析失败，尝试提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prdData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI 返回的格式不正确');
      }
    }

    // 保存 PRD 到数据库
    const prd = await createPRD({
      sessionId: session.id,
      title: prdData.title,
      description: prdData.description,
      background: prdData.background,
      targetUsers: JSON.stringify(prdData.targetUsers),
      painPoints: JSON.stringify(prdData.painPoints || []),
      coreValue: JSON.stringify(prdData.coreValue || []),
      features: JSON.stringify(prdData.features),
      successMetrics: JSON.stringify(prdData.successMetrics || []),
      techFeasibility: JSON.stringify(prdData.techFeasibility),
      competitors: JSON.stringify(prdData.competitors || []),
    });

    // 保存 AI 响应消息
    await createMessage(
      session.id,
      'assistant',
      `已生成 PRD 文档：${prdData.title}\n\n${prdData.description}`
    );

    // 更新会话标题
    await updateSession(session.id, { title: prdData.title });

    // Track successful PRD generation
    const duration = Math.round((Date.now() - startTime) / 1000)
    trackPRDGeneration({
      anonymousId,
      sessionId,
      title: prdData.title,
      status: 'success',
      duration,
      tokensUsed: 0 // TODO: Extract from AI response if available
    }).catch(() => {}) // Non-blocking

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        prdId: prd.id,
        prd: prdData,
      },
    });
  } catch (error) {
    // Track failed PRD generation
    const duration = Math.round((Date.now() - startTime) / 1000)
    const body = await request.json().catch(() => ({}))
    const trackedAnonymousId = body.anonymousId || anonymousId
    const trackedSessionId = body.sessionId || sessionId

    trackPRDGeneration({
      anonymousId: trackedAnonymousId,
      sessionId: trackedSessionId,
      title: body.idea?.slice(0, 50) || 'Unknown',
      status: 'failed',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }).catch(() => {}) // Non-blocking

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成 PRD 失败',
      },
      { status: 500 }
    );
  }
}
