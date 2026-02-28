'use client';

import { useEffect, useState } from 'react';
import { Loader2, Brain, Search, CheckCircle, Sparkles } from 'lucide-react';

interface ThinkingIndicatorProps {
  onComplete?: () => void;
}

const stages = [
  {
    id: 'connecting',
    icon: Loader2,
    title: '正在连接 AI',
    description: '建立与智谱 AI 的安全连接...',
    duration: 1000,
  },
  {
    id: 'analyzing',
    icon: Brain,
    title: 'AI 正在分析你的想法',
    description: '理解产品概念和核心价值...',
    duration: 5000,
  },
  {
    id: 'research',
    icon: Search,
    title: '正在生成竞品分析',
    description: '搜索和分析相关竞品信息...',
    duration: 5000,
  },
  {
    id: 'building',
    icon: Sparkles,
    title: '正在构建 PRD 文档',
    description: '生成功能列表、技术评估和成功指标...',
    duration: 8000,
  },
  {
    id: 'finalizing',
    icon: CheckCircle,
    title: '正在完成最后处理',
    description: '优化文档格式和结构...',
    duration: 3000,
  },
];

export function ThinkingIndicator({ onComplete }: ThinkingIndicatorProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const currentStage = stages[currentStageIndex];
    let startTime: number;
    let animationFrame: number;

    const animateProgress = () => {
      startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const stageProgress = Math.min((elapsed / currentStage.duration) * 100, 100);

        const totalProgress = ((currentStageIndex + stageProgress / 100) / stages.length) * 100;
        setProgress(totalProgress);

        if (stageProgress < 100) {
          animationFrame = requestAnimationFrame(updateProgress);
        } else {
          if (currentStageIndex < stages.length - 1) {
            setCurrentStageIndex(currentStageIndex + 1);
          } else {
            onComplete?.();
          }
        }
      };

      updateProgress();
    };

    animateProgress();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [currentStageIndex, onComplete]);

  const currentStage = stages[currentStageIndex];
  const Icon = currentStage.icon;

  return (
    <div className="w-full max-w-xl mx-auto space-y-8 animate-fade-editorial editorial-paper border border-[#E0E3E8] dark:border-[#2D3748] rounded-sm p-8 md:p-12">
      {/* 总体进度条 - 极简细线 */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="font-sans text-[#6B7B8C] dark:text-[#9AA5B1]">AI 思考进度</span>
          <span className="font-sans text-[#1A1A1A] dark:text-[#F1F3F6]">{Math.round(progress)}%</span>
        </div>
        <div className="h-px w-full bg-[#E0E3E8] dark:bg-[#2D3748] overflow-hidden">
          <div
            className="h-full bg-[#1A1A1A] dark:bg-[#F1F3F6] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 当前阶段 - 居中排版 */}
      <div className="text-center py-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 border border-[#E0E3E8] dark:border-[#2D3748]">
            <Icon
              className={`h-6 w-6 text-[#1A1A1A] dark:text-[#F1F3F6] ${
                currentStage.id === 'connecting' || currentStage.id === 'finalizing'
                  ? 'animate-spin'
                  : ''
              }`}
            />
          </div>
        </div>

        <h3 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] dark:text-[#F1F3F6] leading-snug mb-4">
          {currentStage.title}
        </h3>

        <p className="font-sans text-sm text-[#6B7B8C] dark:text-[#9AA5B1]">
          {currentStage.description}
        </p>
      </div>

      {/* 阶段列表 - 极简排版 */}
      <div className="space-y-4 pt-8 border-t border-[#E0E3E8] dark:border-[#2D3748]">
        {stages.map((stage, index) => {
          const StageIcon = stage.icon;
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div
              key={stage.id}
              className={`flex items-center justify-between transition-colors duration-300 ${
                isCurrent ? '' : 'opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <StageIcon
                  className={`h-4 w-4 ${
                    isCurrent ? 'text-[#1A1A1A] dark:text-[#F1F3F6]' : 'text-[#9AA5B1]'
                  }`}
                />
                <span
                  className={`font-sans text-sm ${
                    isCurrent ? 'text-[#1A1A1A] dark:text-[#F1F3F6] font-medium' : 'text-[#9AA5B1]'
                  }`}
                >
                  {stage.title}
                </span>
              </div>
              {isCompleted && <CheckCircle className="h-4 w-4 text-[#1A1A1A] dark:text-[#F1F3F6]" />}
              {isCurrent && (
                <Loader2 className="h-4 w-4 animate-spin text-[#1A1A1A] dark:text-[#F1F3F6]" />
              )}
            </div>
          );
        })}
      </div>

      {/* 提示文字 */}
      <div className="pt-8 border-t border-[#E0E3E8] dark:border-[#2D3748] text-center">
        <p className="font-sans text-sm text-[#6B7B8C] dark:text-[#9AA5B1]">
          PRD 生成通常需要 20-30 秒，请稍作等待...
        </p>
      </div>
    </div>
  );
}
