import { NextRequest, NextResponse } from 'next/server';
import { createSession, createPRD, createMessage, updateSession } from '@/lib/db';
import { PRDDocument } from '@/types/prd';
import { z } from 'zod';
import { trackPRDGeneration } from '@/lib/analytics';
import { getAnonymousIdFromCookie } from '@/lib/anonymous-user';
import { createMultiAgentWorkflow, WorkflowProgress } from '@/lib/agents';

// PRD 数据验证 schema
const GeneratePRDSchema = z.object({
  idea: z.string().min(10, '产品想法至少需要 10 个字符'),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
  clarifications: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    skipped: z.boolean().optional(),
  })).optional(),
  // 是否使用多 Agent 工作流（默认启用）
  useMultiAgent: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let anonymousId: string = 'unknown';
  let sessionId: string | undefined = undefined;

  try {
    const body = await request.json();

    // 验证请求
    const result = GeneratePRDSchema.safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues?.[0];
      const friendlyMessage = firstIssue?.message || '产品想法描述太短啦，请至少输入 10 个字符';

      return NextResponse.json(
        { error: friendlyMessage },
        { status: 400 }
      );
    }

    const { idea, anonymousId: reqAnonymousId, sessionId: reqSessionId, clarifications, useMultiAgent = true } = result.data;
    anonymousId = reqAnonymousId || getAnonymousIdFromCookie(request);
    sessionId = reqSessionId || undefined;

    // 创建新会话
    const session = await createSession(idea.slice(0, 50), anonymousId, sessionId);

    // 保存用户消息
    await createMessage(session.id, 'user', idea);

    let prdData: PRDDocument;
    let tokensUsed = 0;
    let workflowSummary: any = null;

    if (useMultiAgent) {
      // ========== 使用多 Agent 工作流 ==========
      const workflow = createMultiAgentWorkflow({
        enableRequirementAnalysis: true,
        enableCompetitorAnalysis: true,
        enableMarketResearch: false, // 默认禁用，耗时较长
        enableQualityReview: true,
        maxIterations: 2,
        qualityThreshold: 85,
      });

      const workflowResult = await workflow.execute({
        idea,
        clarifications: clarifications?.filter(c => !c.skipped),
        onProgress: (progress: WorkflowProgress) => {
          // 进度更新可通过 WebSocket 或 SSE 推送给前端
          console.log('Workflow Progress:', progress);
        },
      });

      prdData = workflowResult.prd;
      tokensUsed = workflowResult.workflowSummary.tokensUsed || 0;
      workflowSummary = workflowResult.workflowSummary;

      // 保存 Agent 产物到会话元数据（可选）
      // await updateSession(session.id, {
      //   metadata: {
      //     requirementAnalysis: workflowResult.artifacts.requirementAnalysis,
      //     competitorAnalysis: workflowResult.artifacts.competitorAnalysis,
      //     qualityReview: workflowResult.artifacts.qualityReview,
      //   }
      // });

    } else {
      // ========== 使用单一 Agent（向后兼容） ==========
      const { chatWithResponse } = await import('@/lib/ai');
      const { PRD_GENERATION_PROMPT, SYSTEM_PROMPT } = await import('@/lib/prompts/prd-template');

      // 构建增强的 Prompt
      let enhancedIdea = idea;
      if (clarifications && clarifications.length > 0) {
        const clarificationText = clarifications
          .filter(c => !c.skipped)
          .map(c => `Q: ${c.question}\nA: ${c.answer}`)
          .join('\n\n');

        enhancedIdea = `${idea}\n\n用户补充信息：\n${clarificationText}`;
      }

      // 生成 PRD
      const prompt = PRD_GENERATION_PROMPT(enhancedIdea);
      const { content, usage } = await chatWithResponse(SYSTEM_PROMPT, prompt, [], 'json_object');

      // 解析 JSON 响应
      try {
        prdData = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          prdData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('AI 返回的格式不正确');
        }
      }

      tokensUsed = usage?.total_tokens || 0;
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
    const duration = Math.round((Date.now() - startTime) / 1000);
    trackPRDGeneration({
      anonymousId,
      sessionId,
      title: prdData.title,
      status: 'success',
      duration,
      tokensUsed,
    }).catch(() => {}); // Non-blocking

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        prdId: prd.id,
        prd: prdData,
        workflow: useMultiAgent ? {
          summary: workflowSummary,
        } : undefined,
      },
    });
  } catch (error) {
    // Track failed PRD generation
    const duration = Math.round((Date.now() - startTime) / 1000);
    const body = await request.json().catch(() => ({}));
    const trackedAnonymousId = body.anonymousId || anonymousId;
    const trackedSessionId = body.sessionId || sessionId;

    trackPRDGeneration({
      anonymousId: trackedAnonymousId,
      sessionId: trackedSessionId,
      title: body.idea?.slice(0, 50) || 'Unknown',
      status: 'failed',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    }).catch(() => {}); // Non-blocking

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成 PRD 失败',
      },
      { status: 500 }
    );
  }
}
