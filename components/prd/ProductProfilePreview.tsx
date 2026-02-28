'use client';

import { FileText } from 'lucide-react';
import { ClarificationAnswer } from '@/types/prd';

interface ProductProfilePreviewProps {
  answers: ClarificationAnswer[];
  originalIdea: string;
}

export function ProductProfilePreview({ answers, originalIdea }: ProductProfilePreviewProps) {
  const validAnswers = answers.filter(a => !a.skipped);

  return (
    <div className="w-80 border-l border-[#E0E3E8] dark:border-[#2D3748] bg-transparent p-6 overflow-y-auto">
      <h3 className="mb-6 font-serif text-lg text-[#1A1A1A] dark:text-[#F1F3F6] flex items-center gap-2">
        <FileText className="h-4 w-4 text-[#1A1A1A] dark:text-[#F1F3F6]" />
        产品画像
      </h3>

      {/* 已收集信息数量 */}
      <div className="mb-6 text-sm font-sans text-[#6B7B8C] dark:text-[#9AA5B1]">
        已收集信息 × {validAnswers.length}
      </div>

      {/* Q&A 列表 - 极简分隔线风格 */}
      <div className="space-y-6 mb-6">
        {validAnswers.length === 0 ? (
          <div className="text-sm text-[#9AA5B1] text-center py-6">
            等待回答...
          </div>
        ) : (
          validAnswers.map((answer, index) => (
            <div
              key={index}
              className="pb-6 border-b border-[#E0E3E8]/50 dark:border-[#2D3748]/50 last:border-0"
            >
              <div className="font-sans text-xs uppercase tracking-widest text-[#6B7B8C] dark:text-[#9AA5B1] mb-2">
                {answer.question}
              </div>
              <p className="font-serif text-sm text-[#1A1A1A] dark:text-[#F1F3F6] leading-relaxed">
                {answer.answer}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 原始想法预览 */}
      {originalIdea && (
        <div className="pt-6 border-t border-[#E0E3E8] dark:border-[#2D3748]">
          <div className="font-sans text-xs uppercase tracking-widest text-[#6B7B8C] dark:text-[#9AA5B1] mb-2">
            原始想法
          </div>
          <p className="font-serif text-sm text-[#3A3A3A] dark:text-[#A0AEC0] leading-relaxed">
            {originalIdea}
          </p>
        </div>
      )}
    </div>
  );
}
