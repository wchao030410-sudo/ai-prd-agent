// 需求分析 Agent
import { BaseAgent, AgentConfig } from './base';
import { AgentResult, RequirementAnalysisOutput } from './types';
import {
  REQUIREMENT_ANALYSIS_SYSTEM_PROMPT,
  REQUIREMENT_ANALYSIS_PROMPT,
} from '@/lib/prompts/agents';

export interface RequirementAnalysisInput {
  idea: string;
  clarifications?: Array<{ question: string; answer: string }>;
}

export class RequirementAnalysisAgent extends BaseAgent<
  RequirementAnalysisInput,
  RequirementAnalysisOutput
> {
  constructor(config: AgentConfig = {}) {
    super(REQUIREMENT_ANALYSIS_SYSTEM_PROMPT, config);
  }

  getAgentName(): string {
    return '需求分析 Agent';
  }

  async execute(input: RequirementAnalysisInput): Promise<AgentResult<RequirementAnalysisOutput>> {
    const startTime = Date.now();

    try {
      const result = await this.withRetry(async () => {
        const userMessage = REQUIREMENT_ANALYSIS_PROMPT(input.idea, input.clarifications);
        const response = await this.callLLM(userMessage, [], true);
        return this.parseJSON<RequirementAnalysisOutput>(response.content);
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '需求分析失败',
        duration: Date.now() - startTime,
      };
    }
  }
}
