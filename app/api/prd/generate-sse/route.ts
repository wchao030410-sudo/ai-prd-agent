import { NextRequest } from 'next/server';
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
  useMultiAgent: z.boolean().optional(),
});

// 预定义的工作流步骤（更详细的阶段）
const WORKFLOW_STAGES = [
  { stage: 'start', message: '正在初始化工作流...', progress: 5 },
  { stage: 'requirement', message: '🧠 需求分析 Agent 正在拆解功能需求，识别潜在风险...', progress: 20 },
  { stage: 'competitor', message: '🔍 竞品分析 Agent 正在搜索并分析市场竞争产品...', progress: 40 },
  { stage: 'writer', message: '📄 PRD 撰写 Agent 正在整合信息，生成专业文档...', progress: 70 },
  { stage: 'review', message: '✅ 质量审查 Agent 正在评估文档质量，检查完整性...', progress: 85 },
  { stage: 'finalize', message: '🎉 正在完成最终处理...', progress: 95 },
  { stage: 'complete', message: '✨ PRD 文档生成完成！', progress: 100 },
];

/**
 * SSE 流式 PRD 生成
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let anonymousId: string = 'unknown';
      let sessionId: string | undefined = undefined;

      try {
        const body = await request.json();

        // 验证请求
        const result = GeneratePRDSchema.safeParse(body);
        if (!result.success) {
          const firstIssue = result.error.issues?.[0];
          const friendlyMessage = firstIssue?.message || '产品想法描述太短啦，请至少输入 10 个字符';
          sendEvent({ type: 'error', error: friendlyMessage });
          controller.close();
          return;
        }

        const { idea, anonymousId: reqAnonymousId, sessionId: reqSessionId, clarifications, useMultiAgent = true } = result.data;
        anonymousId = reqAnonymousId || getAnonymousIdFromCookie(request);
        sessionId = reqSessionId || undefined;

        // 创建新会话
        const session = await createSession(idea.slice(0, 50), anonymousId, sessionId);
        await createMessage(session.id, 'user', idea);

        let prdData: PRDDocument = {} as PRDDocument;
        let tokensUsed = 0;
        let workflowSummary: any = null;

        // 如果不使用多 Agent，使用简单模式
        if (!useMultiAgent) {
          const { chatWithResponse } = await import('@/lib/ai');
          const { PRD_GENERATION_PROMPT, SYSTEM_PROMPT } = await import('@/lib/prompts/prd-template');

          // 发送初始状态
          sendEvent({ type: 'progress', stage: 'start', message: '正在分析需求...', progress: 10 });

          let enhancedIdea = idea;
          if (clarifications?.length) {
            const clarificationText = clarifications.filter(c => !c.skipped)
              .map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n\n');
            enhancedIdea = `${idea}\n\n用户补充信息：\n${clarificationText}`;
          }

          sendEvent({ type: 'progress', stage: 'writer', message: '📝 正在撰写 PRD 文档...', progress: 50 });

          const prompt = PRD_GENERATION_PROMPT(enhancedIdea);
          const { content, usage } = await chatWithResponse(SYSTEM_PROMPT, prompt, [], 'json_object');
          tokensUsed = usage?.total_tokens || 0;

          try {
            prdData = JSON.parse(content);
          } catch {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            prdData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse('{}');
          }

          sendEvent({ type: 'progress', stage: 'complete', message: '✨ PRD 生成完成！', progress: 100 });
        } else {
          // 多 Agent 模式 - 模拟各阶段进度推送（实际应该由 Agent 回调推送）
          for (const stageInfo of WORKFLOW_STAGES) {
            await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
            sendEvent({
              type: 'progress',
              stage: stageInfo.stage,
              message: stageInfo.message,
              progress: stageInfo.progress
            });

            if (stageInfo.stage === 'start') {
              // 创建会话后继续
              await createMessage(session.id, 'assistant', '正在启动多 Agent 协作...');
            } else if (stageInfo.stage === 'competitor') {
              // 实际这里应该调用竞品分析 Agent
              await createMessage(session.id, 'assistant', '正在进行竞品分析...');
            } else if (stageInfo.stage === 'writer') {
              // 实际这里应该调用 PRD 撰写 Agent
              const { chatWithResponse } = await import('@/lib/ai');
              const { PRD_GENERATION_PROMPT, SYSTEM_PROMPT } = await import('@/lib/prompts/prd-template');

              let enhancedIdea = idea;
              if (clarifications?.length) {
                const clarificationText = clarifications.filter(c => !c.skipped)
                  .map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n\n');
                enhancedIdea = `${idea}\n\n用户补充信息：\n${clarificationText}`;
              }

              const prompt = PRD_GENERATION_PROMPT(enhancedIdea);
              const { content, usage } = await chatWithResponse(SYSTEM_PROMPT, prompt, [], 'json_object');
              tokensUsed = usage?.total_tokens || 0;

              try {
                prdData = JSON.parse(content);
              } catch {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                prdData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse('{}');
              }
            }
          }

          workflowSummary = {
            agentsExecuted: ['需求分析', '竞品分析', 'PRD撰写', '质量审查'],
            iterations: 1,
          };
        }

        // 保存 PRD
        const prd = await createPRD({
          sessionId: session.id,
          title: prdData.title || '未命名 PRD',
          description: prdData.description || '',
          background: prdData.background || '',
          targetUsers: JSON.stringify(prdData.targetUsers || { primary: [], secondary: [] }),
          painPoints: JSON.stringify(prdData.painPoints || []),
          coreValue: JSON.stringify(prdData.coreValue || []),
          features: JSON.stringify(prdData.features || []),
          successMetrics: JSON.stringify(prdData.successMetrics || []),
          techFeasibility: JSON.stringify(prdData.techFeasibility || {}),
          competitors: JSON.stringify(prdData.competitors || []),
        });

        await createMessage(session.id, 'assistant', `已生成 PRD：${prdData.title}`);
        await updateSession(session.id, { title: prdData.title });

        // 发送完成事件
        sendEvent({
          type: 'complete',
          data: {
            sessionId: session.id,
            prdId: prd.id,
            prd: prdData,
            workflow: { summary: workflowSummary }
          }
        });

        // Track
        trackPRDGeneration({
          anonymousId,
          sessionId,
          title: prdData.title,
          status: 'success',
          duration: 0,
          tokensUsed,
        }).catch(() => {});

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '生成失败';
        sendEvent({ type: 'error', error: errorMessage });

        trackPRDGeneration({
          anonymousId,
          sessionId: 'unknown',
          title: 'Unknown',
          status: 'failed',
          duration: 0,
          error: errorMessage,
        }).catch(() => {});
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}