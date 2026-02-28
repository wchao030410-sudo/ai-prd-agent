// 质量审查 Agent
import { BaseAgent, AgentConfig } from './base';
import { AgentResult, QualityReviewOutput } from './types';
import {
  QUALITY_REVIEW_SYSTEM_PROMPT,
  QUALITY_REVIEW_PROMPT,
} from '@/lib/prompts/agents';

export class QualityReviewAgent extends BaseAgent<string, QualityReviewOutput> {
  constructor(config: AgentConfig = {}) {
    super(QUALITY_REVIEW_SYSTEM_PROMPT, config);
  }

  getAgentName(): string {
    return '质量审查 Agent';
  }

  async execute(prdContent: string): Promise<AgentResult<QualityReviewOutput>> {
    const startTime = Date.now();

    try {
      const result = await this.withRetry(async () => {
        const userMessage = QUALITY_REVIEW_PROMPT(prdContent);
        const response = await this.callLLM(userMessage, [], true);
        return this.parseJSON<QualityReviewOutput>(response.content);
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '质量审查失败',
        duration: Date.now() - startTime,
      };
    }
  }
}
