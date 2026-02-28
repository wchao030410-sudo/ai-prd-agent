// 改进的 PRD 撰写 Agent - 强制使用前序分析结果
import { BaseAgent, AgentConfig } from './base';
import { AgentResult } from './types';
import { PRD_WRITER_SYSTEM_PROMPT, PRD_WRITER_WITH_ANALYSIS_PROMPT } from '@/lib/prompts/improved-agents';
import { PRDDocument } from '@/types/prd';

export interface PRDWriterInput {
  idea: string;
  clarifications?: Array<{ question: string; answer: string }>;
  requirementAnalysis?: any;
  competitorAnalysis?: any;
}

export class ImprovedPRDWriterAgent extends BaseAgent<PRDWriterInput, PRDDocument> {
  constructor(config: AgentConfig = {}) {
    super(PRD_WRITER_SYSTEM_PROMPT, { ...config, temperature: 0.5 }); // 降低温度，更稳定
  }

  getAgentName(): string {
    return 'PRD 撰写 Agent (改进版)';
  }

  async execute(input: PRDWriterInput): Promise<AgentResult<PRDDocument>> {
    const startTime = Date.now();

    try {
      const result = await this.withRetry(async () => {
        const userMessage = PRD_WRITER_WITH_ANALYSIS_PROMPT(input);

        // 检查是否有前序分析结果
        const hasAnalysis = input.requirementAnalysis || input.competitorAnalysis;

        const response = await this.callLLM(
          userMessage,
          [],
          true
        );

        const parsed = this.parseJSON<PRDDocument>(response.content);

        // 验证输出质量
        if (!parsed.title || !parsed.features || !Array.isArray(parsed.features)) {
          throw new Error('PRD 输出格式不完整');
        }

        return parsed;
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PRD 撰写失败',
        duration: Date.now() - startTime,
      };
    }
  }
}

// PRD 优化 Agent - 基于质量审查反馈迭代
export class PRDRefinerAgent extends BaseAgent<{
  currentPRD: any;
  reviewFeedback: any;
}, PRDDocument> {
  constructor(config: AgentConfig = {}) {
    super('你是一位 PRD 优化专家，擅长根据反馈改进文档', { ...config, temperature: 0.3 });
  }

  getAgentName(): string {
    return 'PRD 优化 Agent';
  }

  async execute(input: { currentPRD: any; reviewFeedback: any }): Promise<AgentResult<PRDDocument>> {
    const startTime = Date.now();

    try {
      const result = await this.withRetry(async () => {
        const { PRD_REFINER_PROMPT } = await import('@/lib/prompts/improved-agents');
        const userMessage = PRD_REFINER_PROMPT(input);

        const response = await this.callLLM(userMessage, [], true);
        return this.parseJSON<PRDDocument>(response.content);
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PRD 优化失败',
        duration: Date.now() - startTime,
      };
    }
  }
}