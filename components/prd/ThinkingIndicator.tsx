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

        // 计算总体进度
        const totalProgress = ((currentStageIndex + stageProgress / 100) / stages.length) * 100;
        setProgress(totalProgress);

        if (stageProgress < 100) {
          animationFrame = requestAnimationFrame(updateProgress);
        } else {
          // 移动到下一个阶段
          if (currentStageIndex < stages.length - 1) {
            setCurrentStageIndex(currentStageIndex + 1);
          } else {
            // 所有阶段完成
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
    <div className="w-full space-y-6">
      {/* 总体进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">AI 思考进度</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 当前阶段卡片 */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6">
        {/* 动画背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

        <div className="relative flex items-start gap-4">
          {/* 图标 */}
          <div className="flex-shrink-0">
            <div className="rounded-full bg-primary/10 p-3">
              <Icon
                className={`h-6 w-6 text-primary ${
                  currentStage.id === 'connecting' || currentStage.id === 'finalizing'
                    ? 'animate-spin'
                    : ''
                }`}
              />
            </div>
          </div>

          {/* 内容 */}
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-semibold">{currentStage.title}</h3>
            <p className="text-sm text-muted-foreground">{currentStage.description}</p>
          </div>

          {/* 脉冲动画 */}
          <div className="flex-shrink-0">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* 所有阶段列表 */}
      <div className="space-y-2">
        {stages.map((stage, index) => {
          const StageIcon = stage.icon;
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                isCurrent ? 'bg-accent' : 'opacity-50'
              }`}
            >
              <div
                className={`rounded-full p-1.5 ${
                  isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                <StageIcon className="h-3 w-3" />
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium">{stage.title}</div>
              </div>
              {isCompleted && <CheckCircle className="h-4 w-4 text-primary" />}
              {isCurrent && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
          );
        })}
      </div>

      {/* 提示文字 */}
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          💡 PRD 生成通常需要 20-30 秒，请稍作等待...
        </p>
      </div>
    </div>
  );
}
