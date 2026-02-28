'use client';

import { Check } from 'lucide-react';

interface StepIndicatorProps {
  current: number;
  total: number;
  steps: string[];
}

export function StepIndicator({ current, total, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-8 md:gap-16 py-12">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const isCompleted = stepNumber < current;
        const isCurrent = stepNumber === current;
        const isUpcoming = stepNumber > current;

        return (
          <div key={i} className="flex items-center">
            {/* 步骤文字 */}
            <div className="flex flex-col items-center">
              <span
                className={`font-sans text-sm uppercase tracking-widest transition-colors duration-300 ${
                  isCompleted
                    ? 'text-[#9AA5B1]'
                    : isCurrent
                    ? 'text-[#1A1A1A] dark:text-[#F1F3F6] font-medium'
                    : 'text-[#C1C9D3] dark:text-[#2D3748]'
                }`}
              >
                {step}
              </span>

              {/* 当前步骤指示器 - 细线 */}
              {isCurrent && (
                <div className="w-8 h-px bg-[#1A1A1A] dark:bg-[#F1F3F6] mt-4" />
              )}

              {/* 完成步骤 - 对勾 */}
              {isCompleted && (
                <div className="mt-4 flex items-center justify-center w-6 h-6 rounded-sm border border-[#9AA5B1]">
                  <Check className="h-3 w-3 text-[#9AA5B1]" />
                </div>
              )}

              {/* 待办步骤 - 空心圆 */}
              {isUpcoming && (
                <div className="mt-4 w-6 h-6 rounded-sm border border-[#E0E3E8] dark:border-[#2D3748]" />
              )}
            </div>

            {/* 连接线（除了最后一个步骤） */}
            {i < steps.length - 1 && (
              <div
                className={`mx-6 h-px w-12 md:w-20 transition-colors duration-500 ${
                  isCompleted ? 'bg-[#9AA5B1]' : 'bg-[#E0E3E8] dark:bg-[#2D3748]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
