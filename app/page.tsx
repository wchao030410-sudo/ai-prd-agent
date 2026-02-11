'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MessageSquare, FileText, Loader2, Trash2, Zap } from 'lucide-react';
import { PRDViewer } from '@/components/prd/PRDViewer';
import { ThinkingIndicator } from '@/components/prd/ThinkingIndicator';
import { PRDDocument } from '@/types/prd';

interface Session {
  id: string;
  title: string;
  updatedAt: Date;
  prd?: {
    id: string;
    title: string;
    description: string;
  };
}

export default function Home() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [currentPRD, setCurrentPRD] = useState<PRDDocument | null>(null);
  const [error, setError] = useState('');

  // 加载会话列表
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const result = await response.json();
      if (result.success) {
        setSessions(result.data);
      }
    } catch (err) {
      console.error('加载会话失败:', err);
    }
  };

  const handleGeneratePRD = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setShowProgress(true);
    setError('');
    setCurrentPRD(null);
    setSelectedSession(null);

    try {
      const response = await fetch('/api/prd/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea }),
      });

      const result = await response.json();

      if (result.success) {
        // 延迟一下，让用户看到进度完成
        setTimeout(() => {
          setCurrentPRD(result.data.prd);
          setShowProgress(false);
          setIdea('');
          loadSessions();
        }, 500);
      } else {
        setShowProgress(false);
        setError(result.error || '生成失败');
      }
    } catch (err) {
      setShowProgress(false);
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressComplete = () => {
    // 进度完成后的回调（可选）
    console.log('进度完成');
  };

  const handleNewPRD = () => {
    setSelectedSession(null);
    setCurrentPRD(null);
    setError('');
    setIdea('');
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡

    if (!confirm('确定要删除这个会话吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // 如果删除的是当前选中的会话，清空选择
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
          setCurrentPRD(null);
        }
        await loadSessions();
      } else {
        setError(result.error || '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleLoadSession = async (session: Session) => {
    setSelectedSession(session);
    setError('');

    try {
      const response = await fetch(`/api/sessions/${session.id}`);
      const result = await response.json();

      if (result.success && result.data.prd) {
        try {
          const prd = result.data.prd;
          console.log('加载的 PRD 数据:', prd);

          // 安全解析函数
          const parseWithFallback = <T,>(data: string | undefined | null, fallback: T): T => {
            if (!data) {
              console.log('数据为空，使用默认值:', fallback);
              return fallback;
            }
            try {
              const parsed = JSON.parse(data);
              console.log('解析成功:', parsed);
              return parsed;
            } catch (e) {
              console.error('解析失败，数据:', data);
              return fallback;
            }
          };

          // 解析 features
          let features;
          try {
            if (prd.features) {
              features = JSON.parse(prd.features);
              if (!Array.isArray(features)) {
                console.error('features 不是数组:', features);
                features = [];
              }
            } else {
              features = [];
            }
          } catch (e) {
            console.error('features 解析失败:', e, '原始数据:', prd.features);
            features = [];
          }

          const prdData = {
            title: prd.title || '未命名 PRD',
            description: prd.description || '',
            background: prd.background || '',
            targetUsers: parseWithFallback(prd.targetUsers, { primary: [], secondary: [] }),
            painPoints: parseWithFallback(prd.painPoints, []),
            coreValue: parseWithFallback(prd.coreValue, []),
            features: features || [],
            successMetrics: parseWithFallback(prd.successMetrics, []),
            techFeasibility: parseWithFallback(prd.techFeasibility, undefined),
            competitors: parseWithFallback(prd.competitors, []),
          };

          console.log('最终 PRD 数据:', prdData);
          setCurrentPRD(prdData);
        } catch (parseErr) {
          console.error('PRD 数据解析错误:', parseErr);
          setError('PRD 数据解析失败：' + (parseErr instanceof Error ? parseErr.message : '未知错误'));
        }
      } else {
        setError('未找到 PRD 数据');
      }
    } catch (err) {
      console.error('加载会话失败:', err);
      setError(err instanceof Error ? err.message : '加载失败，请重试');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="p-4">
          <Button className="w-full" variant="default" onClick={handleNewPRD}>
            <Plus className="mr-2 h-4 w-4" />
            新建 PRD
          </Button>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
            会话历史
          </h2>
          <div className="space-y-1">
            {sessions.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                暂无会话
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex w-full items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
                    selectedSession?.id === session.id
                      ? 'bg-accent'
                      : 'hover:bg-accent'
                  }`}
                >
                  <button
                    onClick={() => handleLoadSession(session)}
                    className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-sm flex-1"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="flex-shrink-0 rounded-md p-2 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="删除会话"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航 */}
        <header className="border-b border-border px-6 py-4">
          <h1 className="text-2xl font-bold">AI PRD Agent</h1>
          <p className="text-sm text-muted-foreground">
            输入产品想法，快速生成专业的产品需求文档
          </p>
        </header>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}

            {/* PRD 查看器 */}
            {currentPRD ? (
              <PRDViewer prd={currentPRD} />
            ) : showProgress ? (
              /* AI 思考进度 */
              <ThinkingIndicator onComplete={handleProgressComplete} />
            ) : (
              <>
                {/* 输入区域 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      开始新的 PRD
                    </CardTitle>
                    <CardDescription>
                      描述你的产品想法，AI 将帮你生成完整的 PRD 文档
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="例如：我想做一个 AI 写作助手，帮助内容创作者快速生成文章初稿..."
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleGeneratePRD}
                        disabled={loading || showProgress || !idea.trim()}
                        className="gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            启动中...
                          </>
                        ) : (
                          <>
                            生成 PRD
                            <FileText className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 示例 */}
                <Card>
                  <CardHeader>
                    <CardTitle>快速开始</CardTitle>
                    <CardDescription>选择一个示例或输入你自己的想法</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      'AI 写作助手 - 帮助内容创作者快速生成文章',
                      '智能笔记应用 - 支持语音转文字和 AI 摘要',
                      '代码审查工具 - 自动检测代码问题和优化建议',
                    ].map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setIdea(example)}
                        className="w-full rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-accent"
                      >
                        {example}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
