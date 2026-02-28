'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationPanelProps {
  sessionId: string;
  onPRDUpdate: (updatedPRD: any) => void;
}

export function ConversationPanel({ sessionId, onPRDUpdate }: ConversationPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setLoading(true);
    setError('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ]);

    try {
      const response = await fetch('/api/prd/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          instruction: userMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        let aiMessage = result.data.message || 'PRD 已更新';

        if (aiMessage.startsWith('{') || aiMessage.includes('```')) {
          aiMessage = `✅ PRD 已根据您的指令更新\n\n您可以查看上方编辑器中的最新内容`;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: aiMessage,
            timestamp: new Date(),
          },
        ]);

        onPRDUpdate(result.data.prd);
      } else {
        setError(result.error || '编辑失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="editorial-paper border border-[#E0E3E8] dark:border-[#2D3748] rounded-sm p-8 md:p-12">
      {/* 标题 */}
      <div className="mb-10 pb-6 border-b border-[#E0E3E8] dark:border-[#2D3748]">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="h-5 w-5 text-[#1A1A1A] dark:text-[#F1F3F6]" />
          <h3 className="font-serif text-xl text-[#1A1A1A] dark:text-[#F1F3F6]">
            对话式编辑
          </h3>
        </div>
        <p className="font-sans text-sm text-[#6B7B8C] dark:text-[#9AA5B1]">
          使用自然语言修改 PRD
        </p>
      </div>

      {/* 消息列表 - 杂志采访风格 */}
      {messages.length > 0 && (
        <div className="space-y-10 mb-10">
          {messages.map((msg, i) => (
            <div key={i} className="space-y-3">
              {/* 署名 */}
              <div className="font-sans text-xs uppercase tracking-widest text-[#6B7B8C] dark:text-[#9AA5B1]">
                {msg.role === 'user' ? '你' : 'AI 编辑'}
              </div>

              {/* 内容 */}
              <p
                className={`font-serif text-lg leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-[#1A1A1A] dark:text-[#F1F3F6]'
                    : 'text-[#3A3A3A] dark:text-[#A0AEC0]'
                }`}
              >
                {msg.content}
              </p>
            </div>
          ))}
          {loading && (
            <div className="space-y-3">
              <div className="font-sans text-xs uppercase tracking-widest text-[#6B7B8C] dark:text-[#9AA5B1]">
                AI 编辑
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#1A1A1A] dark:text-[#F1F3F6]" />
                <span className="font-serif text-lg text-[#3A3A3A] dark:text-[#A0AEC0]">
                  正在处理...
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-10 px-4 py-3 border-l-2 border-[#B86B6B] bg-red-50 dark:bg-red-950/10">
          <p className="font-sans text-sm text-[#B86B6B] dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* 输入区 */}
      <div className="pt-8 border-t border-[#E0E3E8] dark:border-[#2D3748]">
        <Textarea
          placeholder="输入修改指令，例如：把技术难度改成中等..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={2}
          className="w-full resize-none editorial-paper font-sans text-sm border border-[#E0E3E8] dark:border-[#2D3748] focus:border-[#1A1A1A] dark:focus:border-[#F1F3F6] mb-4"
        />

        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-editorial btn-editorial-primary"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 快捷指令 */}
      <div className="mt-8 pt-8 border-t border-[#E0E3E8] dark:border-[#2D3748]">
        <p className="font-sans text-xs text-[#6B7B8C] dark:text-[#9AA5B1] uppercase tracking-wider mb-4">
          快捷指令
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            '简化功能列表',
            '增加技术细节',
            '调整优先级',
            '补充竞品分析',
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => setInput(example)}
              className="font-sans text-xs px-4 py-2 border border-[#E0E3E8] dark:border-[#2D3748] rounded-sm text-[#3A3A3A] dark:text-[#A0AEC0] hover:border-[#1A1A1A] dark:hover:border-[#F1F3F6] transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
