// 竞品分析 Agent
import { BaseAgent, AgentConfig } from './base';
import { AgentResult, CompetitorAnalysisOutput } from './types';
import {
  COMPETITOR_ANALYSIS_SYSTEM_PROMPT,
  COMPETITOR_ANALYSIS_PROMPT,
} from '@/lib/prompts/agents';

export interface CompetitorAnalysisInput {
  idea: string;
  productDescription?: string;
}

export class CompetitorAnalysisAgent extends BaseAgent<
  CompetitorAnalysisInput,
  CompetitorAnalysisOutput
> {
  constructor(config: AgentConfig = {}) {
    super(COMPETITOR_ANALYSIS_SYSTEM_PROMPT, config);
  }

  getAgentName(): string {
    return '竞品分析 Agent';
  }

  async execute(input: CompetitorAnalysisInput): Promise<AgentResult<CompetitorAnalysisOutput>> {
    const startTime = Date.now();

    try {
      const result = await this.withRetry(async () => {
        const userMessage = COMPETITOR_ANALYSIS_PROMPT(input.idea, input.productDescription);
        const response = await this.callLLM(userMessage, [], true);
        return this.parseJSON<CompetitorAnalysisOutput>(response.content);
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '竞品分析失败',
        duration: Date.now() - startTime,
      };
    }
  }
}
