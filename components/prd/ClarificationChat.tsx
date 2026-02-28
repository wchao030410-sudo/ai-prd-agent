'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, CheckCircle2, SkipForward } from 'lucide-react';
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

  return (
    <div className="max-w-lg mx-auto px-6 py-8 editorial-paper rounded-sm border border-[#E0E3E8] dark:border-[#2D3748]">
      {/* 进度条 - 极简细线 */}
      <div className="flex justify-center gap-3 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-px w-12 md:w-16 transition-colors duration-500 ${
              i < currentQuestionIndex ? 'bg-[#1A1A1A]' : 'bg-[#E0E3E8]'
            }`}
          />
        ))}
      </div>

      {/* 问题 - 居中杂志风格 */}
      <div className="text-center mb-6">
        <div className="w-12 h-px bg-[#1A1A1A]/30 mx-auto mb-6" />

        <div className="font-sans text-xs text-[#6B7B8C] dark:text-[#9AA5B1] tracking-widest uppercase mb-3">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>

        <h2 className="font-serif text-xl md:text-2xl text-[#1A1A1A] dark:text-[#F1F3F6] leading-snug mb-6">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Choice 类型：选项 */}
      {currentQuestion.type === 'choice' && currentQuestion.options && (
        <div className="mb-6 space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionToggle(option)}
              className={`w-full text-left px-6 py-4 border transition-all duration-300 font-sans text-base ${
                selectedOptions.includes(option)
                  ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#FAF9F7] dark:border-[#F1F3F6] dark:bg-[#F1F3F6] dark:text-[#1A1D23]'
                  : 'border-[#E0E3E8] bg-transparent text-[#3A3A3A] hover:border-[#1A1A1A]/50 dark:border-[#2D3748] dark:hover:border-[#F1F3F6]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="tracking-wide">{option}</span>
                {selectedOptions.includes(option) && (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Example 类型：示例 */}
      {currentQuestion.type === 'example' && currentQuestion.examples && (
        <div className="mb-6 px-6 py-4 border border-[#E0E3E8] dark:border-[#2D3748]">
          <p className="mb-3 text-xs font-medium text-[#6B7B8C] dark:text-[#9AA5B1] uppercase tracking-wider">
            参考示例
          </p>
          <ul className="space-y-2">
            {currentQuestion.examples.map((example, index) => (
              <li key={index} className="text-[#3A3A3A] dark:text-[#A0AEC0] font-serif italic">
                "{example}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 自定义输入框 */}
      <div className="mb-6">
        <Textarea
          placeholder={currentQuestion.type === 'choice' ? '或者自定义你的回答...' : '请输入你的回答...'}
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          rows={3}
          className="resize-none editorial-paper font-sans text-sm border-[#E0E3E8] dark:border-[#2D3748] focus:border-[#1A1A1A] dark:focus:border-[#F1F3F6]"
        />
      </div>

      {/* 按钮组 */}
      <div className="flex items-center justify-between pt-8 border-t border-[#E0E3E8]/50 dark:border-[#2D3748]/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="font-sans text-sm text-[#6B7B8C] dark:text-[#9AA5B1] hover:text-[#1A1A1A] dark:hover:text-[#F1F3F6]"
        >
          <SkipForward className="mr-2 h-4 w-4" />
          跳过
        </Button>

        <Button
          onClick={handleNext}
          disabled={isLoading || (!currentAnswer && selectedOptions.length === 0)}
          className="btn-editorial btn-editorial-primary"
        >
          {isLastQuestion ? '完成' : '下一个'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
