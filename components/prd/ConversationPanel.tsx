'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    // 添加用户消息
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
        // 添加 AI 响应消息 - 格式化为更友好的文本
        let aiMessage = result.data.message || 'PRD 已更新';

        // 如果消息是 JSON 格式，尝试提取关键信息
        if (aiMessage.startsWith('{') || aiMessage.includes('```')) {
          // 对于 JSON 或代码块格式，提供更友好的总结
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

        // 触发 PRD 更新
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          对话式编辑
        </CardTitle>
        <CardDescription>
          使用自然语言修改 PRD，例如："把目标用户改成跨境电商卖家"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 消息列表 */}
        {messages.length > 0 && (
          <div className="max-h-60 space-y-3 overflow-y-auto rounded-lg bg-muted p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="mt-1 text-xs opacity-70">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">AI 正在思考...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 输入框 */}
        <div className="flex gap-2">
          <Textarea
            placeholder="输入修改指令，例如：把技术难度改成中等..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="self-end"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 快捷指令 */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">快捷指令：</p>
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
                className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-accent"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
