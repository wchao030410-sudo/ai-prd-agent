'use client';

import { useEffect, useState } from 'react';
import { Brain, Search, FileText, CheckCircle, Loader2, Sparkles, ArrowRight, XCircle } from 'lucide-react';

interface AgentState {
  agentId: string;
  agentName: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  message: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  output?: string;
}

interface AgentFlowProgressProps {
  agents?: Record<string, AgentState>;
  overallProgress?: number;
  currentStage?: string;
  message?: string;
  isConnecting?: boolean;
  onComplete?: () => void;
}

const AGENT_CONFIG = [
  { id: 'requirement', name: '需求分析', icon: Brain, description: '拆解功能需求，识别技术风险与产品机会' },
  { id: 'competitor', name: '竞品分析', icon: Search, description: '分析市场竞争格局，寻找差异化突破口' },
  { id: 'writer', name: 'PRD 撰写', icon: FileText, description: '整合所有分析结果，生成专业 PRD 文档' },
  { id: 'review', name: '质量审查', icon: CheckCircle, description: '多维度评估文档质量，检查完整性' },
  { id: 'refine', name: '优化迭代', icon: Sparkles, description: '根据审查反馈迭代优化，持续提升品质' },
];

export function AgentFlowProgress({
  agents = {},
  overallProgress = 0,
  currentStage = '',
  message = '',
  isConnecting = false,
  onComplete
}: AgentFlowProgressProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (overallProgress >= 100) {
      onComplete?.();
    }
  }, [overallProgress, onComplete]);

  if (!mounted) {
    return null;
  }

  const getAgentState = (agentId: string): AgentState => {
    return agents[agentId] || {
      agentId,
      agentName: AGENT_CONFIG.find(a => a.id === agentId)?.name || agentId,
      status: 'idle',
      progress: 0,
      message: '等待启动...'
    };
  };

  const getStatusColor = (status: AgentState['status']) => {
    switch (status) {
      case 'completed':
        return 'border-[#10B981] bg-[#10B981]/5';
      case 'running':
        return 'border-[#1A1A1A] dark:border-[#F1F3F6] bg-[#FAF9F7] dark:bg-[#1A1D23]';
      case 'error':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-[#E0E3E8] dark:border-[#2D3748] bg-[#FAF9F7]/50 dark:bg-[#1A1D23]/50 opacity-60';
    }
  };

  const getStatusIcon = (status: AgentState['status'], Icon: React.ElementType) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-[#10B981]" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-[#1A1A1A] dark:text-[#F1F3F6] animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Icon className="h-5 w-5 text-[#9AA5B1]" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-editorial">
      {/* 总体进度 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-sans text-sm text-[#6B7B8C] dark:text-[#9AA5B1]">
            多 Agent 协作进度
          </span>
          <span className="font-mono text-lg font-bold text-[#1A1A1A] dark:text-[#F1F3F6]">
            {Math.round(overallProgress)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-[#E0E3E8] dark:bg-[#2D3748] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1A1A1A] dark:bg-[#F1F3F6] transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* 当前执行状态 */}
      {message && (
        <div className="py-3 px-4 bg-[#F5F3F0] dark:bg-[#1E2532] rounded-sm border border-[#E0E3E8] dark:border-[#2D3748]">
          <p className="font-sans text-sm text-[#1A1A1A] dark:text-[#F1F3F6]">
            {message}
          </p>
        </div>
      )}

      {/* Agent 流程可视化 */}
      <div className="relative">
        <div className="flex items-start justify-between gap-2 md:gap-4 overflow-x-auto pb-4 px-2">
          {AGENT_CONFIG.map((config, index) => {
            const state = getAgentState(config.id);
            const Icon = config.icon;
            const isLast = index === AGENT_CONFIG.length - 1;

            return (
              <div key={config.id} className="flex items-center">
                {/* Agent 卡片 */}
                <div
                  className={`
                    relative flex-shrink-0 w-28 md:w-36 lg:w-40 p-3 rounded-sm border-2 transition-all duration-500
                    ${getStatusColor(state.status)}
                  `}
                >
                  {/* Agent 图标 */}
                  <div className={`
                    w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center border
                    ${state.status === 'running' ? 'border-[#1A1A1A] dark:border-[#F1F3F6] bg-white dark:bg-[#0D1117]' :
                      state.status === 'completed' ? 'border-[#10B981] bg-[#10B981]/10' :
                      state.status === 'error' ? 'border-red-500 bg-red-50' :
                      'border-[#E0E3E8] dark:border-[#2D3748]'}
                  `}>
                    {getStatusIcon(state.status, Icon)}
                  </div>

                  {/* Agent 名称 */}
                  <div className="text-center">
                    <p className={`
                      font-sans text-xs font-medium
                      ${state.status === 'completed' ? 'text-[#10B981]' :
                        state.status === 'running' ? 'text-[#1A1A1A] dark:text-[#F1F3F6]' :
                        state.status === 'error' ? 'text-red-500' :
                        'text-[#9AA5B1]'}
                    `}>
                      {config.name}
                    </p>
                    <p className="mt-1 text-[9px] text-[#6B7B8C] dark:text-[#9AA5B1] px-1 leading-tight">
                      {config.description}
                    </p>
                  </div>

                  {/* 进度指示 */}
                  {state.status === 'running' && (
                    <div className="mt-2 h-1 w-full bg-[#E0E3E8] dark:bg-[#2D3748] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1A1A1A] dark:bg-[#F1F3F6] transition-all duration-300"
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                  )}

                  {/* 状态消息 */}
                  {state.message && state.status !== 'idle' && (
                    <p className="mt-2 text-[10px] text-[#6B7B8C] dark:text-[#9AA5B1] text-center line-clamp-2">
                      {state.message}
                    </p>
                  )}
                </div>

                {/* 连接箭头 */}
                {!isLast && (
                  <div className="flex-shrink-0 px-1 md:px-2 mt-4">
                    <ArrowRight
                      className={`
                        h-4 w-4 md:h-5 md:w-5 transition-colors duration-300
                        ${state.status === 'completed' ? 'text-[#10B981]' : 'text-[#9AA5B1]'}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 流程线（背景） */}
        <div className="absolute top-[52px] left-[52px] right-[52px] h-0.5 bg-[#E0E3E8] dark:bg-[#2D3748] -z-10 hidden md:block" />
      </div>

      {/* 底部提示 */}
      <div className="pt-4 border-t border-[#E0E3E8] dark:border-[#2D3748] text-center">
        <p className="font-sans text-xs text-[#6B7B8C] dark:text-[#9AA5B1]">
          {isConnecting ? '正在建立连接...' :
           overallProgress >= 100 ? '✨ 生成完成！' :
           '💡 每个 Agent 专注负责特定任务，协同工作生成更专业的 PRD'}
        </p>
        <p className="font-sans text-[10px] text-[#9AA5B1] mt-1">
          预计耗时 60-90 秒，请耐心等待
        </p>
      </div>
    </div>
  );
}

// 保持向后兼容的别名
export function MultiAgentProgress(props: any) {
  return <AgentFlowProgress {...props} />;
}