// SSE 事件钩子 - 支持改进版多 Agent 工作流
import { useState, useEffect, useRef, useCallback } from 'react';

export interface AgentState {
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

export interface SSEProgressEvent {
  type: 'progress' | 'agent_update' | 'complete' | 'error';
  stage?: string;
  message?: string;
  progress?: number;
  data?: any;
  error?: string;
  agents?: Record<string, AgentState>;
}

export function useSSEGenerator() {
  const [progress, setProgress] = useState<SSEProgressEvent | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});

  const generate = useCallback(async (
    idea: string,
    clarifications?: Array<{ question: string; answer: string }>,
    useMultiAgent: boolean = true
  ) => {
    // 重置状态
    setProgress(null);
    setIsComplete(false);
    setError(null);
    setIsConnecting(true);
    setAgents({});

    try {
      // 使用改进版 API 端点
      const endpoint = useMultiAgent ? '/api/prd/generate-improved' : '/api/prd/generate-sse';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          clarifications,
        }),
      });

      if (!response.ok) {
        throw new Error(`生成失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应');
      }

      setIsConnecting(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as SSEProgressEvent;

              if (data.type === 'progress' || data.type === 'agent_update') {
                setProgress(data);
                // 更新 Agent 状态
                if (data.agents) {
                  setAgents(data.agents);
                }
              } else if (data.type === 'complete') {
                setProgress(data);
                if (data.agents) {
                  setAgents(data.agents);
                }
                setIsComplete(true);
                return data.data;
              } else if (data.type === 'error') {
                setError(data.error || '生成失败');
                throw new Error(data.error);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (err) {
      setIsConnecting(false);
      const errorMessage = err instanceof Error ? err.message : '网络错误';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setIsComplete(false);
    setError(null);
    setIsConnecting(false);
    setAgents({});
  }, []);

  return {
    progress,
    isConnecting,
    isComplete,
    error,
    agents,
    generate,
    reset,
  };
}