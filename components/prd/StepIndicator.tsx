'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  current: number;
  total: number;
  steps: string[];
}

export function StepIndicator({ current, total, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < current;
        const isCurrent = stepNumber === current;
        const isUpcoming = stepNumber > current;

        return (
          <div key={index} className="flex items-center">
            {/* 步骤圆圈 */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  isUpcoming && 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium',
                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step}
              </span>
            </div>

            {/* 连接线（除了最后一个步骤） */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-16 transition-all',
                  stepNumber < current ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
