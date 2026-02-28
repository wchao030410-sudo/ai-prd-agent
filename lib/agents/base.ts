// Agent 基类
import { chatWithResponse, ChatMessage } from '@/lib/ai';
import { AgentResult } from './types';

export interface AgentConfig {
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

export abstract class BaseAgent<TInput = any, TOutput = any> {
  protected readonly systemPrompt: string;
  protected readonly config: AgentConfig;

  constructor(systemPrompt: string, config: AgentConfig = {}) {
    this.systemPrompt = systemPrompt;
    this.config = {
      temperature: 0.7,
      maxTokens: 4096,
      maxRetries: 2,
      ...config,
    };
  }

  /**
   * Agent 唯一抽象方法 - 执行任务
   */
  abstract execute(input: TInput): Promise<AgentResult<TOutput>>;

  /**
   * 调用 LLM
   */
  protected async callLLM(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    jsonOutput: boolean = true
  ): Promise<{ content: string; usage: any }> {
    try {
      return await chatWithResponse(
        this.systemPrompt,
        userMessage,
        conversationHistory,
        jsonOutput ? 'json_object' : 'text'
      );
    } catch (error) {
      throw new Error(`${this.getAgentName()} LLM 调用失败：${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 获取 Agent 名称（用于日志和错误提示）
   */
  abstract getAgentName(): string;

  /**
   * 重试包装器
   */
  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < this.config.maxRetries!; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`${this.getAgentName()} 第 ${i + 1} 次尝试失败:`, lastError.message);

        if (i < this.config.maxRetries! - 1) {
          // 指数退避
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError!;
  }

  /**
   * 解析 JSON 响应
   */
  protected parseJSON<T>(content: string): T {
    try {
      return JSON.parse(content);
    } catch {
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法解析 JSON 响应');
    }
  }
}
