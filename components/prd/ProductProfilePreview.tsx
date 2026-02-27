'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Lightbulb, FileText } from 'lucide-react';
import { ClarificationAnswer } from '@/types/prd';

interface ProductProfilePreviewProps {
  answers: ClarificationAnswer[];
  originalIdea: string;
}

export function ProductProfilePreview({ answers, originalIdea }: ProductProfilePreviewProps) {
  const validAnswers = answers.filter(a => !a.skipped);

  return (
    <div className="w-80 border-l border-border bg-muted/30 p-4 overflow-y-auto">
      <h3 className="mb-4 font-semibold flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        产品画像
      </h3>

      {/* 已收集信息数量 */}
      <div className="mb-4 text-sm text-muted-foreground">
        已收集信息 × {validAnswers.length}
      </div>

      {/* Q&A 列表 */}
      <div className="space-y-3 mb-6">
        {validAnswers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            等待回答...
          </div>
        ) : (
          validAnswers.map((answer, index) => (
            <div
              key={index}
              className="rounded-lg bg-background p-3 text-sm border"
            >
              <div className="flex items-start gap-2 mb-1">
                <MessageSquare className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium text-xs">{answer.question}</span>
              </div>
              <div className="text-xs text-muted-foreground pl-5">
                → {answer.answer}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 原始想法预览 */}
      {originalIdea && (
        <div className="border-t pt-4">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="h-3 w-3 text-muted-foreground mt-0.5" />
            <span className="text-xs font-medium text-muted-foreground">
              原始想法
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {originalIdea}
          </p>
        </div>
      )}
    </div>
  );
}
