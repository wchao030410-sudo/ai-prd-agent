// 改进的多 Agent PRD 生成 API - 带 SSE 实时进度
import { NextRequest } from 'next/server';
import { createSession, createPRD, createMessage, updateSession } from '@/lib/db';
import { PRDDocument } from '@/types/prd';
import { z } from 'zod';
import { trackPRDGeneration } from '@/lib/analytics';
import { getAnonymousIdFromCookie } from '@/lib/anonymous-user';
import { createImprovedWorkflow, WorkflowProgress } from '@/lib/agents';

// 请求验证
const GeneratePRDSchema = z.object({
  idea: z.string().min(10, '产品想法至少需要 10 个字符'),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
  clarifications: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    skipped: z.boolean().optional(),
  })).optional(),
});

// SSE 事件类型
type SSEEventType = 'progress' | 'agent_update' | 'complete' | 'error';

interface AgentState {
  agentId: string;
  agentName: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  message: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  output?: string;
  logs?: string[];
}

/**
 * SSE 流式 PRD 生成 - 实时展示 Agent 工作状态
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: SSEEventType, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
      };

      const updateAgentState = (agents: Record<string, AgentState>, agentId: string, status: AgentState['status'], progress: number, message: string) => {
        if (agents[agentId]) {
          agents[agentId].status = status;
          agents[agentId].progress = progress;
          agents[agentId].message = message;
          if (status === 'running' && !agents[agentId].startTime) {
            agents[agentId].startTime = Date.now();
          }
          if (status === 'completed') {
            agents[agentId].endTime = Date.now();
            agents[agentId].duration = agents[agentId].endTime - (agents[agentId].startTime || agents[agentId].endTime);
          }
        }
      };

      // 添加日志到 agent 状态
      const addAgentLog = (agents: Record<string, AgentState>, agentId: string, log: string) => {
        if (agents[agentId]) {
          if (!agents[agentId].logs) {
            agents[agentId].logs = [];
          }
          const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          agents[agentId].logs!.push(`[${timestamp}] ${log}`);
          // 保持日志不超过 50 条
          if (agents[agentId].logs!.length > 50) {
            agents[agentId].logs = agents[agentId].logs!.slice(-50);
          }
        }
      };

      let anonymousId: string = 'unknown';
      let sessionId: string | undefined = undefined;
      let agents: Record<string, AgentState> = {};

      // 初始化 Agent 状态
      const initAgents = () => {
        const agentConfigs = [
          { id: 'requirement', name: '需求分析', message: '等待启动...' },
          { id: 'competitor', name: '竞品分析', message: '等待启动...' },
          { id: 'writer', name: 'PRD撰写', message: '等待启动...' },
          { id: 'review', name: '质量审查', message: '等待启动...' },
          { id: 'refine', name: '优化迭代', message: '等待启动...' },
        ];

        for (const agent of agentConfigs) {
          agents[agent.id] = {
            agentId: agent.id,
            agentName: agent.name,
            status: 'idle',
            progress: 0,
            message: agent.message,
            logs: [],
          };
        }
      };

      initAgents();

      try {
        const body = await request.json();
        const result = GeneratePRDSchema.safeParse(body);

        if (!result.success) {
          const firstIssue = result.error.issues?.[0];
          sendEvent('error', { error: firstIssue?.message || '输入验证失败' });
          controller.close();
          return;
        }

        const { idea, anonymousId: reqAnonymousId, sessionId: reqSessionId, clarifications } = result.data;
        anonymousId = reqAnonymousId || getAnonymousIdFromCookie(request);
        sessionId = reqSessionId || undefined;

        // 发送初始状态
        sendEvent('progress', { stage: 'init', message: '正在初始化工作流...', progress: 2, agents });

        // 创建新会话
        const session = await createSession(idea.slice(0, 50), anonymousId, sessionId);
        await createMessage(session.id, 'user', idea);
        sessionId = session.id;

        sendEvent('progress', { stage: 'session_created', message: '会话创建成功', progress: 5, agents });

        // 创建工作流
        const workflow = createImprovedWorkflow({
          enableRequirementAnalysis: true,
          enableCompetitorAnalysis: true,
          enableQualityReview: true,
          maxIterations: 2,
          qualityThreshold: 80,
        });

        // 发送工作流启动
        sendEvent('progress', { stage: 'workflow_start', message: '🚀 启动多 Agent 协作', progress: 8, agents });

        // 执行工作流并实时推送进度
        const workflowResult = await workflow.execute({
          idea,
          clarifications: clarifications?.filter(c => !c.skipped),
          onProgress: (progress: WorkflowProgress) => {
            // 更新各个 Agent 的状态
            if (progress.agents) {
              for (const agent of progress.agents) {
                // 确保 agents 对象中有这个 agent
                if (!agents[agent.agentId]) {
                  agents[agent.agentId] = {
                    agentId: agent.agentId,
                    agentName: agent.agentName,
                    status: agent.status,
                    progress: agent.progress,
                    message: agent.message,
                  };
                }

                // 更新状态
                agents[agent.agentId].status = agent.status;
                agents[agent.agentId].progress = agent.progress;
                agents[agent.agentId].message = agent.message;

                // 同步日志 - 只添加新日志（避免重复）
                if (agent.logs && agent.logs.length > 0) {
                  const existingLogs = agents[agent.agentId].logs || [];
                  // 找出 orchestrator 中有但当前 agents 中没有的日志
                  const newLogs = agent.logs.filter(log => !existingLogs.includes(log));
                  if (newLogs.length > 0) {
                    agents[agent.agentId].logs = [...existingLogs, ...newLogs].slice(-50);
                  }
                }

                // 更新时间戳
                if (agent.status === 'running' && !agents[agent.agentId].startTime) {
                  agents[agent.agentId].startTime = Date.now();
                }
                if (agent.status === 'completed') {
                  agents[agent.agentId].endTime = Date.now();
                }
              }
            }

            // 发送进度更新
            sendEvent('agent_update', {
              stage: progress.currentStage,
              message: progress.currentStage,
              progress: progress.overallProgress,
              agents: JSON.parse(JSON.stringify(agents)), // 深拷贝避免引用问题
            });
          },
        });

        const prdData = workflowResult.prd;

        // 发送完成状态
        sendEvent('progress', { stage: 'saving', message: '正在保存 PRD...', progress: 95, agents });

        // 保存 PRD
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

        await createMessage(session.id, 'assistant', `已生成 PRD：${prdData.title}`);
        await updateSession(session.id, { title: prdData.title });

        // 发送最终完成事件
        sendEvent('complete', {
          data: {
            sessionId: session.id,
            prdId: prd.id,
            prd: prdData,
            workflow: {
              summary: workflowResult.workflowSummary,
            },
          },
          progress: 100,
          agents,
        });

        // 追踪
        trackPRDGeneration({
          anonymousId,
          sessionId,
          title: prdData.title,
          status: 'success',
          duration: workflowResult.workflowSummary.totalDuration,
          tokensUsed: workflowResult.workflowSummary.tokensUsed,
        }).catch(() => {});

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '生成失败';

        // 标记所有运行中的 Agent 为错误状态
        Object.values(agents).forEach(agent => {
          if (agent.status === 'running') {
            agent.status = 'error';
            agent.message = errorMessage;
          }
        });

        sendEvent('error', {
          error: errorMessage,
          agents,
        });

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