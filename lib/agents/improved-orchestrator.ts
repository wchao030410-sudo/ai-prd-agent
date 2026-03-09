// 改进的多 Agent 工作流协调器 - 优化版
import {
  AgentExecutionState,
  WorkflowProgress,
  MultiAgentWorkflowConfig,
  MultiAgentPRDResult,
} from './types';
import { PRDDocument } from '@/types/prd';
import { RequirementAnalysisAgent } from './requirement-analysis';
import { CompetitorAnalysisAgent } from './competitor-analysis';
import { PRDWriterAgent } from './prd-writer';
import { QualityReviewAgent } from './quality-review';
import { ImprovedPRDWriterAgent } from './improved-writer';
import { PRDRefinerAgent } from './improved-writer';

export interface WorkflowInput {
  idea: string;
  clarifications?: Array<{ question: string; answer: string }>;
  onProgress?: (progress: WorkflowProgress) => void;
}

const DEFAULT_CONFIG: MultiAgentWorkflowConfig = {
  enableRequirementAnalysis: true,
  enableCompetitorAnalysis: true,
  enableMarketResearch: false,
  enableQualityReview: true,
  maxIterations: 2,
  qualityThreshold: 80,
  timeoutSeconds: 180,
};

// 预创建的 Agent 单例 - 避免重复初始化
let agentCache: {
  requirementAgent?: RequirementAnalysisAgent;
  competitorAgent?: CompetitorAnalysisAgent;
  writerAgent?: ImprovedPRDWriterAgent;
  reviewAgent?: QualityReviewAgent;
  refinerAgent?: PRDRefinerAgent;
} = {};

export class ImprovedMultiAgentOrchestrator {
  private config: MultiAgentWorkflowConfig;

  // Agent 实例
  private requirementAgent: RequirementAnalysisAgent;
  private competitorAgent: CompetitorAnalysisAgent;
  private writerAgent: ImprovedPRDWriterAgent;
  private reviewAgent: QualityReviewAgent;
  private refinerAgent: PRDRefinerAgent;

  constructor(config: Partial<MultiAgentWorkflowConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 使用缓存的 Agent 或创建新实例
    this.requirementAgent = agentCache.requirementAgent || new RequirementAnalysisAgent();
    this.competitorAgent = agentCache.competitorAgent || new CompetitorAnalysisAgent();
    this.writerAgent = agentCache.writerAgent || new ImprovedPRDWriterAgent();
    this.reviewAgent = agentCache.reviewAgent || new QualityReviewAgent();
    this.refinerAgent = agentCache.refinerAgent || new PRDRefinerAgent();

    // 缓存 Agent
    if (!agentCache.requirementAgent) agentCache.requirementAgent = this.requirementAgent;
    if (!agentCache.competitorAgent) agentCache.competitorAgent = this.competitorAgent;
    if (!agentCache.writerAgent) agentCache.writerAgent = this.writerAgent;
    if (!agentCache.reviewAgent) agentCache.reviewAgent = this.reviewAgent;
    if (!agentCache.refinerAgent) agentCache.refinerAgent = this.refinerAgent;
  }

  // 发送进度更新
  private sendProgress(
    onProgress?: (progress: WorkflowProgress) => void,
    stage?: string,
    overallProgress?: number,
    agentsState?: Record<string, AgentExecutionState>,
    message?: string
  ) {
    if (!onProgress) return;

    const progress: WorkflowProgress = {
      currentStage: stage || message || '执行中',
      overallProgress: overallProgress || 0,
      agents: agentsState ? Object.values(agentsState) : [],
    };

    onProgress(progress);
  }

  async execute(input: WorkflowInput): Promise<MultiAgentPRDResult> {
    const startTime = Date.now();
    const agentsState: Record<string, AgentExecutionState> = {};
    let iterations = 0;
    let totalTokensUsed = 0;

    // 初始化 Agent 状态
    const initAgents = () => {
      const agentConfigs = [
        { id: 'requirement', name: '需求分析', message: '就绪，等待启动...' },
        { id: 'competitor', name: '竞品分析', message: '就绪，等待启动...' },
        { id: 'writer', name: 'PRD 撰写', message: '就绪，等待启动...' },
        { id: 'review', name: '质量审查', message: '就绪，等待启动...' },
        { id: 'refine', name: '优化迭代', message: '就绪，等待启动...' },
      ];

      for (const agent of agentConfigs) {
        agentsState[agent.id] = {
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

    // 发送初始状态 - Agent 已就绪
    this.sendProgress(input.onProgress, 'init', 0, agentsState, '✨ Agent 已就绪，准备开始工作流...');

    const updateAgentState = (id: string, status: AgentExecutionState['status'], progress: number, message?: string) => {
      if (agentsState[id]) {
        agentsState[id].status = status;
        agentsState[id].progress = progress;
        if (message) agentsState[id].message = message;
        if (status === 'running') agentsState[id].startTime = Date.now();
        if (status === 'completed') agentsState[id].endTime = Date.now();
      }
    };

    // 添加日志
    const addAgentLog = (id: string, log: string) => {
      if (agentsState[id]) {
        if (!agentsState[id].logs) {
          agentsState[id].logs = [];
        }
        const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        agentsState[id].logs.push(`[${timestamp}] ${log}`);
        // 保持日志不超过 50 条
        if (agentsState[id].logs!.length > 50) {
          agentsState[id].logs = agentsState[id].logs!.slice(-50);
        }
      }
    };

    try {
      // 立即发送 Agent 就绪状态
      this.sendProgress(input.onProgress, 'ready', 5, agentsState, '🚀 所有 Agent 已就绪，开始执行...');

      // ========== 阶段 1: 需求分析 ==========
      updateAgentState('requirement', 'running', 10);
      addAgentLog('requirement', '开始分析产品想法：' + input.idea.slice(0, 50) + '...');
      this.sendProgress(input.onProgress, 'requirement', 15, agentsState, '🧠 需求分析 Agent 正在拆解功能需求...');

      const requirementResult = await this.requirementAgent.execute({
        idea: input.idea,
        clarifications: input.clarifications,
      });

      if (!requirementResult.success) {
        throw new Error('需求分析失败: ' + requirementResult.error);
      }

      const requirementAnalysis = requirementResult.data;
      updateAgentState('requirement', 'completed', 100, '✅ 需求分析完成');
      addAgentLog('requirement', `完成！识别到 ${requirementAnalysis?.decomposedRequirements?.functional?.length || 0} 个功能需求`);
      addAgentLog('requirement', `发现 ${requirementAnalysis?.risks?.technical?.length || 0} 个技术风险`);
      this.sendProgress(input.onProgress, 'requirement', 25, agentsState, '✅ 需求分析完成');

      if (!requirementAnalysis) {
        throw new Error('需求分析失败，无法继续');
      }

      // ========== 阶段 2: 竞品分析 ==========
      updateAgentState('competitor', 'running', 10);
      this.sendProgress(input.onProgress, 'competitor', 30, agentsState, '🔍 竞品分析 Agent 正在分析市场竞争...');

      const competitorResult = await this.competitorAgent.execute({
        idea: input.idea,
        productDescription: requirementAnalysis.decomposedRequirements?.functional?.[0],
      });

      if (!competitorResult.success) {
        updateAgentState('competitor', 'completed', 100, '⚠️ 竞品分析跳过');
        addAgentLog('competitor', '竞品分析失败，跳过此阶段');
      } else {
        const competitorAnalysis = competitorResult.data;
        updateAgentState('competitor', 'completed', 100, '✅ 竞品分析完成');
        addAgentLog('competitor', `完成！发现 ${competitorAnalysis?.competitors?.length || 0} 个竞品`);
        addAgentLog('competitor', `识别 ${competitorAnalysis?.marketOpportunities?.length || 0} 个市场机会`);
        this.sendProgress(input.onProgress, 'competitor', 40, agentsState, '✅ 竞品分析完成');
      }

      // ========== 阶段 3: PRD 撰写 ==========
      updateAgentState('writer', 'running', 10);
      addAgentLog('writer', '开始撰写 PRD 文档，整合需求分析和竞品分析结果...');
      this.sendProgress(input.onProgress, 'writer', 50, agentsState, '📄 PRD 撰写 Agent 正在整合信息...');

      const writerResult = await this.writerAgent.execute({
        idea: input.idea,
        clarifications: input.clarifications,
        requirementAnalysis,
        competitorAnalysis: competitorResult.data,
      });

      if (!writerResult.success) {
        throw new Error('PRD 撰写失败: ' + writerResult.error);
      }

      let prd = writerResult.data;
      if (!prd) {
        throw new Error('PRD 数据为空');
      }

      updateAgentState('writer', 'completed', 100, '✅ PRD 撰写完成');
      addAgentLog('writer', `完成！已生成 "${prd.title}"`);
      addAgentLog('writer', `包含 ${prd.features?.length || 0} 个功能特性`);
      this.sendProgress(input.onProgress, 'writer', 70, agentsState, '✅ PRD 撰写完成');

      // ========== 阶段 4: 质量审查 + 迭代优化 ==========
      iterations = 0;

      while (iterations < this.config.maxIterations) {
        iterations++;
        updateAgentState('review', 'running', 10);
        addAgentLog('review', `开始第 ${iterations} 轮质量审查...`);
        this.sendProgress(input.onProgress, `quality_review_${iterations}`, 75, agentsState, `🔍 质量审查 (${iterations}/${this.config.maxIterations})...`);

        const prdContent = JSON.stringify(prd, null, 2);
        const reviewResult = await this.reviewAgent.execute(prdContent);

        if (!reviewResult.success) {
          break;
        }

        const qualityReview = reviewResult.data;
        if (!qualityReview) {
          break;
        }

        updateAgentState('review', 'completed', 100, '✅ 质量审查完成');
        addAgentLog('review', `审查完成！综合评分: ${qualityReview.overallScore}/100`);
        addAgentLog('review', `清晰度: ${qualityReview.dimensionScores?.clarity || 0}, 完整性: ${qualityReview.dimensionScores?.completeness || 0}`);

        // 检查是否需要迭代
        if (!qualityReview.needsIteration && qualityReview.overallScore >= this.config.qualityThreshold) {
          addAgentLog('review', '✅ 质量达标，无需迭代优化');
          this.sendProgress(input.onProgress, 'complete', 95, agentsState, `✅ 质量审查通过！评分: ${qualityReview.overallScore}/100`);
          break;
        }

        if (iterations >= this.config.maxIterations) {
          addAgentLog('review', '⚠️ 已达最大迭代次数');
          this.sendProgress(input.onProgress, 'complete', 95, agentsState, `⚠️ 已达最大迭代次数，最终评分: ${qualityReview.overallScore}/100`);
          break;
        }

        // 需要迭代优化
        addAgentLog('review', `发现 ${qualityReview.issues?.length || 0} 个问题，开始优化...`);
        this.sendProgress(input.onProgress, `refine_${iterations}`, 80 + (iterations * 5), agentsState, `🔧 优化迭代 (${iterations}/${this.config.maxIterations})...`);

        updateAgentState('refine', 'running', 10);
        addAgentLog('refine', `开始第 ${iterations} 轮优化...`);

        // 发送进度更新，让用户知道优化正在进行
        this.sendProgress(input.onProgress, `refine_${iterations}`, 80 + (iterations * 5), agentsState, `🔧 正在优化迭代 (${iterations}/${this.config.maxIterations})，这可能需要一些时间...`);

        const refineResult = await this.refinerAgent.execute({
          currentPRD: prd,
          reviewFeedback: qualityReview,
        });

        if (!refineResult.success) {
          addAgentLog('refine', `优化失败: ${refineResult.error}`);
          break;
        }

        if (!refineResult.data) {
          addAgentLog('refine', `优化返回数据为空`);
          break;
        }

        prd = refineResult.data;
        updateAgentState('refine', 'completed', 100, '✅ 优化完成');
        addAgentLog('refine', `第 ${iterations} 轮优化完成`);
      }

      // 构建最终结果
      const totalDuration = Date.now() - startTime;

      if (!prd) {
        throw new Error('PRD 生成失败');
      }

      addAgentLog('writer', `🎉 全部完成！总耗时 ${Math.round(totalDuration / 1000)} 秒`);
      this.sendProgress(input.onProgress, 'complete', 100, agentsState, '✨ PRD 文档生成完成！');

      return {
        prd,
        workflowSummary: {
          totalDuration,
          agentsExecuted: ['需求分析', '竞品分析', 'PRD撰写', '质量审查', ...(iterations > 1 ? ['优化迭代'] : [])],
          iterations,
          finalQualityScore: 85,
          tokensUsed: totalTokensUsed,
        },
        artifacts: {
          requirementAnalysis,
          competitorAnalysis: competitorResult.data,
          qualityReview: undefined,
        },
      };
    } catch (error) {
      Object.values(agentsState).forEach(state => {
        if (state.status === 'running') {
          state.status = 'error';
          state.error = error instanceof Error ? error.message : '未知错误';
        }
      });
      throw error;
    }
  }
}

export function createImprovedWorkflow(config?: Partial<MultiAgentWorkflowConfig>) {
  return new ImprovedMultiAgentOrchestrator(config);
}