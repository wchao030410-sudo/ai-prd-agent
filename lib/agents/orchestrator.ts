// 多 Agent 工作流协调器
import {
  AgentExecutionState,
  WorkflowProgress,
  MultiAgentWorkflowConfig,
  MultiAgentPRDResult,
  RequirementAnalysisOutput,
  CompetitorAnalysisOutput,
  MarketResearchOutput,
  QualityReviewOutput,
} from './types';
import { PRDDocument } from '@/types/prd';
import { RequirementAnalysisAgent } from './requirement-analysis';
import { CompetitorAnalysisAgent } from './competitor-analysis';
import { MarketResearchAgent } from './market-research';
import { PRDWriterAgent } from './prd-writer';
import { QualityReviewAgent } from './quality-review';

/**
 * 工作流输入
 */
export interface WorkflowInput {
  idea: string;
  clarifications?: Array<{ question: string; answer: string }>;
  onProgress?: (progress: WorkflowProgress) => void;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: MultiAgentWorkflowConfig = {
  enableRequirementAnalysis: true,
  enableCompetitorAnalysis: true,
  enableMarketResearch: false, // 默认禁用，耗时较长
  enableQualityReview: true,
  maxIterations: 2,
  qualityThreshold: 85,
  timeoutSeconds: 180,
};

/**
 * 多 Agent 工作流协调器
 *
 * 负责：
 * 1. 编排多个 Agent 的执行顺序
 * 2. 管理 Agent 之间的数据传递
 * 3. 处理迭代优化逻辑
 * 4. 提供进度回调
 */
export class MultiAgentWorkflowOrchestrator {
  private config: MultiAgentWorkflowConfig;
  private abortController: AbortController | null = null;

  // Agent 实例
  private requirementAgent: RequirementAnalysisAgent;
  private competitorAgent: CompetitorAnalysisAgent;
  private marketAgent: MarketResearchAgent;
  private writerAgent: PRDWriterAgent;
  private reviewAgent: QualityReviewAgent;

  constructor(config: Partial<MultiAgentWorkflowConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 初始化 Agent
    this.requirementAgent = new RequirementAnalysisAgent();
    this.competitorAgent = new CompetitorAnalysisAgent();
    this.marketAgent = new MarketResearchAgent();
    this.writerAgent = new PRDWriterAgent();
    this.reviewAgent = new QualityReviewAgent();
  }

  /**
   * 执行完整工作流
   */
  async execute(input: WorkflowInput): Promise<MultiAgentPRDResult> {
    this.abortController = new AbortController();
    const startTime = Date.now();
    const agentsState: Record<string, AgentExecutionState> = {};
    let iterations = 0;
    let totalTokensUsed = 0;

    // 存储各 Agent 输出
    let requirementAnalysis: RequirementAnalysisOutput | undefined;
    let competitorAnalysis: CompetitorAnalysisOutput | undefined;
    let marketResearch: MarketResearchOutput | undefined;
    let qualityReview: QualityReviewOutput | undefined;
    let prd: PRDDocument | null = null;

    try {
      // 初始化 Agent 状态
      const agentConfigs = [
        { id: 'requirement', name: '需求分析' },
        { id: 'competitor', name: '竞品分析' },
        { id: 'market', name: '市场研究' },
        { id: 'writer', name: 'PRD 撰写' },
        { id: 'review', name: '质量审查' },
      ];

      for (const agent of agentConfigs) {
        agentsState[agent.id] = {
          agentId: agent.id,
          agentName: agent.name,
          status: 'idle',
          progress: 0,
          message: '等待中',
        };
      }

      // 发送初始进度
      this.emitProgress(input.onProgress, '初始化', 0, agentsState);

      // ========== 阶段 1: 并行执行分析 Agent ==========
      const analysisTasks: Promise<{ success: boolean; duration?: number; tokensUsed?: number }>[] = [];

      // 需求分析
      if (this.config.enableRequirementAnalysis) {
        analysisTasks.push(this.executeWithProgress(
          'requirement',
          async () => {
            const result = await this.requirementAgent.execute({
              idea: input.idea,
              clarifications: input.clarifications,
            });
            if (result.success) {
              requirementAnalysis = result.data;
            }
            return result;
          },
          agentsState
        ));
      }

      // 竞品分析
      if (this.config.enableCompetitorAnalysis) {
        analysisTasks.push(this.executeWithProgress(
          'competitor',
          async () => {
            const result = await this.competitorAgent.execute({
              idea: input.idea,
            });
            if (result.success) {
              competitorAnalysis = result.data;
            }
            return result;
          },
          agentsState
        ));
      }

      // 市场研究（可选）
      if (this.config.enableMarketResearch) {
        analysisTasks.push(this.executeWithProgress(
          'market',
          async () => {
            const result = await this.marketAgent.execute({
              idea: input.idea,
            });
            if (result.success) {
              marketResearch = result.data;
            }
            return result;
          },
          agentsState
        ));
      }

      // 等待所有分析完成
      await Promise.all(analysisTasks);
      this.emitProgress(input.onProgress, '分析完成', 40, agentsState);

      // ========== 阶段 2: PRD 撰写 ==========
      const writeResult = await this.executeWithProgress(
        'writer',
        async () => {
          const result = await this.writerAgent.execute({
            idea: input.idea,
            clarifications: input.clarifications,
            requirementAnalysis,
            competitorAnalysis,
            marketResearch,
          });
          if (result.success) {
            prd = result.data ?? null;
          }
          return result;
        },
        agentsState
      );

      if (!writeResult.success || !prd) {
        throw new Error('PRD 撰写失败');
      }

      this.emitProgress(input.onProgress, 'PRD 初稿完成', 70, agentsState);

      // ========== 阶段 3: 质量审查与迭代 ==========
      if (this.config.enableQualityReview) {
        for (let i = 0; i < this.config.maxIterations; i++) {
          iterations = i + 1;

          const reviewResult = await this.executeWithProgress(
            'review',
            async () => {
              const prdContent = JSON.stringify(prd);
              return await this.reviewAgent.execute(prdContent);
            },
            agentsState
          );

          if (reviewResult.success && reviewResult.data) {
            qualityReview = reviewResult.data;
            totalTokensUsed += reviewResult.tokensUsed || 0;

            // 检查是否需要迭代
            if (!qualityReview.needsIteration || qualityReview.overallScore >= this.config.qualityThreshold) {
              break;
            }

            // 如果需要迭代，让 PRD 撰写 Agent 根据审查意见修改
            if (i < this.config.maxIterations - 1) {
              this.emitProgress(input.onProgress, `迭代优化 ${i + 1}/${this.config.maxIterations}`, 75 + (i * 10), agentsState);

              const reviseResult = await this.writerAgent.execute({
                idea: input.idea,
                clarifications: input.clarifications,
                requirementAnalysis,
                competitorAnalysis,
                marketResearch,
              });

              if (reviseResult.success) {
                prd = reviseResult.data ?? null;
              }
            }
          }
        }
      }

      this.emitProgress(input.onProgress, '完成', 100, agentsState);

      // 构建最终结果
      const totalDuration = Date.now() - startTime;

      return {
        prd: prd!,
        workflowSummary: {
          totalDuration,
          agentsExecuted: Object.values(agentsState)
            .filter(s => s.status === 'completed')
            .map(s => s.agentName),
          iterations,
          finalQualityScore: qualityReview?.overallScore,
          tokensUsed: totalTokensUsed,
        },
        artifacts: {
          requirementAnalysis,
          competitorAnalysis,
          marketResearch,
          qualityReview,
        },
      };
    } catch (error) {
      // 标记失败的 Agent
      Object.values(agentsState).forEach(state => {
        if (state.status === 'running') {
          state.status = 'error';
          state.error = error instanceof Error ? error.message : '未知错误';
        }
      });

      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * 带进度更新的 Agent 执行
   */
  private async executeWithProgress<T extends { success: boolean; duration?: number; tokensUsed?: number }>(
    agentId: string,
    executeFn: () => Promise<T>,
    agentsState: Record<string, AgentExecutionState>
  ): Promise<T> {
    const state = agentsState[agentId];
    state.status = 'running';
    state.progress = 0;
    state.startTime = Date.now();

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        if (state.status === 'running') {
          state.progress = Math.min(state.progress + 10, 90);
          state.message = '执行中...';
        }
      }, 500);

      const result = await executeFn();

      clearInterval(progressInterval);

      if (result.success) {
        state.status = 'completed';
        state.progress = 100;
        state.message = '完成';
        state.endTime = Date.now();
      } else {
        state.status = 'error';
        state.message = '执行失败';
        state.endTime = Date.now();
      }

      return result;
    } catch (error) {
      state.status = 'error';
      state.message = '执行失败';
      state.error = error instanceof Error ? error.message : '未知错误';
      state.endTime = Date.now();
      throw error;
    }
  }

  /**
   * 发送进度更新
   */
  private emitProgress(
    onProgress?: (progress: WorkflowProgress) => void,
    stage?: string,
    overallProgress?: number,
    agentsState?: Record<string, AgentExecutionState>
  ) {
    if (!onProgress) return;

    const progress: WorkflowProgress = {
      currentStage: stage || '执行中',
      overallProgress: overallProgress || 0,
      agents: agentsState ? Object.values(agentsState) : [],
    };

    onProgress(progress);
  }

  /**
   * 中止工作流
   */
  abort() {
    this.abortController?.abort();
  }
}

/**
 * 创建工作流实例的工厂函数
 */
export function createMultiAgentWorkflow(config?: Partial<MultiAgentWorkflowConfig>) {
  return new MultiAgentWorkflowOrchestrator(config);
}
