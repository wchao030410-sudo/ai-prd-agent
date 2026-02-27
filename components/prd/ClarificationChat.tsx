'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, CheckCircle2, SkipForward, Loader2 } from 'lucide-react';
import { ClarificationQuestion, ClarificationAnswer } from '@/types/prd';

interface ClarificationChatProps {
  questions: ClarificationQuestion[];
  onComplete: (answers: ClarificationAnswer[]) => void;
  isLoading?: boolean;
}

export function ClarificationChat({ questions, onComplete, isLoading }: ClarificationChatProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<ClarificationAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleOptionToggle = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(o => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
    setCurrentAnswer(option);
  };

  const handleNext = () => {
    const answer: ClarificationAnswer = {
      question: currentQuestion.question,
      answer: currentAnswer || selectedOptions.join(', '),
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    setSelectedOptions([]);

    if (isLastQuestion) {
      onComplete(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSkip = () => {
    const answer: ClarificationAnswer = {
      question: currentQuestion.question,
      answer: '',
      skipped: true,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      onComplete(newAnswers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setSelectedOptions([]);
    }
  };

  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>问题 {currentQuestionIndex + 1} / {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 问题气泡 */}
        <div className="mb-6">
          <div className="inline-flex rounded-2xl rounded-tl-none bg-primary px-4 py-3 text-primary-foreground">
            <span className="font-medium">{currentQuestion.question}</span>
          </div>
        </div>

        {/* Choice 类型：选项 */}
        {currentQuestion.type === 'choice' && currentQuestion.options && (
          <div className="mb-4 space-y-2">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionToggle(option)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedOptions.includes(option)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {selectedOptions.includes(option) && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Example 类型：示例 */}
        {currentQuestion.type === 'example' && currentQuestion.examples && (
          <div className="mb-4 rounded-lg bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">参考示例：</p>
            <ul className="space-y-1">
              {currentQuestion.examples.map((example, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • "{example}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 自定义输入框 */}
        <div className="mb-4">
          <Textarea
            placeholder={currentQuestion.type === 'choice' ? '或者自定义你的回答...' : '请输入你的回答...'}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* 按钮组 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            跳过
          </Button>

          <Button
            onClick={handleNext}
            disabled={isLoading || (!currentAnswer && selectedOptions.length === 0)}
            className="gap-2"
          >
            {isLastQuestion ? '完成' : '下一个'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
