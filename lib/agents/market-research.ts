// 市场研究 Agent
import { BaseAgent, AgentConfig } from './base';
import { AgentResult, MarketResearchOutput } from './types';
import {
  MARKET_RESEARCH_SYSTEM_PROMPT,
  MARKET_RESEARCH_PROMPT,
} from '@/lib/prompts/agents';

export interface MarketResearchInput {
  idea: string;
  targetUsers?: string[];
}

export class MarketResearchAgent extends BaseAgent<
  MarketResearchInput,
  MarketResearchOutput
> {
  constructor(config: AgentConfig = {}) {
    super(MARKET_RESEARCH_SYSTEM_PROMPT, config);
  }

  getAgentName(): string {
    return '市场研究 Agent';
  }

  async execute(input: MarketResearchInput): Promise<AgentResult<MarketResearchOutput>> {
    const startTime = Date.now();

    try {
      const result = await this.withRetry(async () => {
        const userMessage = MARKET_RESEARCH_PROMPT(input.idea, input.targetUsers);
        const response = await this.callLLM(userMessage, [], true);
        return this.parseJSON<MarketResearchOutput>(response.content);
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '市场研究失败',
        duration: Date.now() - startTime,
      };
    }
  }
}
