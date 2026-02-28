// PRD 撰写 Agent
import { BaseAgent, AgentConfig } from './base';
import { AgentResult } from './types';
import { PRD_WRITER_SYSTEM_PROMPT, PRD_WRITER_PROMPT } from '@/lib/prompts/agents';
import { PRDDocument } from '@/types/prd';

export interface PRDWriterInput {
  idea: string;
  clarifications?: Array<{ question: string; answer: string }>;
  requirementAnalysis?: any;
  competitorAnalysis?: any;
  marketResearch?: any;
}

export class PRDWriterAgent extends BaseAgent<PRDWriterInput, PRDDocument> {
  constructor(config: AgentConfig = {}) {
    super(PRD_WRITER_SYSTEM_PROMPT, config);
  }

  getAgentName(): string {
    return 'PRD 撰写 Agent';
  }

  async execute(input: PRDWriterInput): Promise<AgentResult<PRDDocument>> {
    const startTime = Date.now();

    try {
      const result = await this.withRetry(async () => {
        const userMessage = PRD_WRITER_PROMPT(input);
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
        error: error instanceof Error ? error.message : 'PRD 撰写失败',
        duration: Date.now() - startTime,
      };
    }
  }
}
