'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  MessageSquare,
  FileText,
  Loader2,
  Trash2,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PRDViewer } from '@/components/prd/PRDViewer';
import { ThinkingIndicator } from '@/components/prd/ThinkingIndicator';
import { StepIndicator } from '@/components/prd/StepIndicator';
import { ConversationPanel } from '@/components/prd/ConversationPanel';
import { EditablePRDViewer } from '@/components/prd/PRDViewerEditable';
import { DiagramsViewer } from '@/components/prd/DiagramsViewer';
import { MermaidChart } from '@/components/prd/MermaidChart';
import { ExportButton } from '@/components/prd/ExportButton';
import { PRDDocumentPreview } from '@/components/prd/PRDDocumentPreview';
import { PRDDocument, Diagrams } from '@/types/prd';
import { safeJsonParse } from '@/lib/utils';

interface Session {
  id: string;
  title: string;
  updatedAt: Date;
  currentStep?: number;
  prd?: {
    id: string;
    title: string;
    description: string;
    isFinal?: boolean;
  };
}

export default function Home() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [currentPRD, setCurrentPRD] = useState<PRDDocument | null>(null);
  const [diagrams, setDiagrams] = useState<Diagrams | null>(null);
  const [finalMarkdown, setFinalMarkdown] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  // 图表生成状态
  const [diagramStatus, setDiagramStatus] = useState<{
    architecture: 'idle' | 'loading' | 'success' | 'error';
    journey: 'idle' | 'loading' | 'success' | 'error';
    features: 'idle' | 'loading' | 'success' | 'error';
    dataflow: 'idle' | 'loading' | 'success' | 'error';
  }>({
    architecture: 'idle',
    journey: 'idle',
    features: 'idle',
    dataflow: 'idle',
  });

  // 加载会话列表
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) {
        throw new Error(`加载失败: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setSessions(result.data);
      }
    } catch (err) {
      // 静默失败，不影响用户体验
    }
  };

  const handleGeneratePRD = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setShowProgress(true);
    setError('');
    setCurrentPRD(null);
    setSelectedSession(null);
    setCurrentStep(1);
    setDiagrams(null);
    setFinalMarkdown(null);

    try {
      const response = await fetch('/api/prd/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        throw new Error(`生成失败: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setTimeout(() => {
          setCurrentPRD(result.data.prd);
          setSelectedSession({ id: result.data.sessionId, title: result.data.prd.title, updatedAt: new Date() });
          setShowProgress(false);
          setIdea('');
          loadSessions();
          setCurrentStep(1); // 进入 Step 1
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

  const handleNewPRD = () => {
    setSelectedSession(null);
    setCurrentPRD(null);
    setDiagrams(null);
    setFinalMarkdown(null);
    setCurrentStep(1);
    setError('');
    setIdea('');
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('确定要删除这个会话吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
          setCurrentPRD(null);
          setDiagrams(null);
          setFinalMarkdown(null);
          setCurrentStep(1);
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
    setCurrentStep(session.currentStep || 1);

    try {
      const response = await fetch(`/api/sessions/${session.id}`);

      if (!response.ok) {
        throw new Error(`加载失败: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data.prd) {
        const prd = result.data.prd;

        const prdData: PRDDocument = {
          title: prd.title || '未命名 PRD',
          description: prd.description || '',
          background: prd.background || '',
          targetUsers: safeJsonParse(prd.targetUsers, { primary: [], secondary: [] }),
          painPoints: safeJsonParse(prd.painPoints, []),
          coreValue: safeJsonParse(prd.coreValue, []),
          features: safeJsonParse(prd.features, []),
          successMetrics: safeJsonParse(prd.successMetrics, []),
          techFeasibility: safeJsonParse(prd.techFeasibility, undefined),
          competitors: safeJsonParse(prd.competitors, []),
        };

        setCurrentPRD(prdData);

        // 加载图表（如果有）
        if (prd.mermaidArchitecture || prd.mermaidJourney || prd.mermaidFeatures || prd.mermaidDataflow) {
          setDiagrams({
            architecture: prd.mermaidArchitecture || '',
            journey: prd.mermaidJourney || '',
            features: prd.mermaidFeatures || '',
            dataflow: prd.mermaidDataflow || '',
          });
        }

        // 加载最终版本（如果有）
        if (prd.isFinal && prd.finalContent) {
          setFinalMarkdown(prd.finalContent);
        }
      } else {
        setError('未找到 PRD 数据');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败，请重试');
    }
  };

  // 生成 Mermaid 图表
  const handleGenerateDiagrams = async () => {
    if (!selectedSession) return;

    // Store the current session ID to prevent race conditions
    const currentSessionId = selectedSession.id;

    setLoading(true);
    setError('');

    // 重置状态
    setDiagramStatus({
      architecture: 'loading',
      journey: 'loading',
      features: 'loading',
      dataflow: 'loading',
    });
    setDiagrams(null);

    try {
      const response = await fetch('/api/diagrams/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: currentSessionId }),
      });

      const result = await response.json();

      // CRITICAL: Only update state if we haven't switched sessions
      if (selectedSession?.id !== currentSessionId) {
        return; // User switched sessions, discard this result
      }

      if (result.success) {
        // 直接设置所有图表数据和状态
        const diagramData = result.data.diagrams;
        setDiagrams({
          architecture: diagramData.architecture,
          journey: diagramData.journey || '',
          features: diagramData.features || '',
          dataflow: diagramData.dataflow || '',
        });
        setDiagramStatus({
          architecture: 'success',
          journey: 'success',
          features: 'success',
          dataflow: 'success',
        });
      } else {
        setDiagramStatus({
          architecture: 'error',
          journey: 'error',
          features: 'error',
          dataflow: 'error',
        });
        setError(result.error || '生成图表失败');
      }
    } catch (err) {
      // Only update error state if we haven't switched sessions
      if (selectedSession?.id !== currentSessionId) {
        return;
      }
      setDiagramStatus({
        architecture: 'error',
        journey: 'error',
        features: 'error',
        dataflow: 'error',
      });
      setError(err instanceof Error ? err.message : '生成图表失败');
    } finally {
      // Only clear loading state if we haven't switched sessions
      if (selectedSession?.id === currentSessionId) {
        setLoading(false);
      }
    }
  };

  // 生成最终 PRD
  const handleFinalizePRD = async () => {
    if (!selectedSession) return;

    // Store the current session ID to prevent race conditions
    const currentSessionId = selectedSession.id;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/prd/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: currentSessionId }),
      });

      const result = await response.json();

      // CRITICAL: Only update state if we haven't switched sessions
      if (selectedSession?.id !== currentSessionId) {
        return; // User switched sessions, discard this result
      }

      if (result.success) {
        setFinalMarkdown(result.data.markdown);
        setCurrentStep(3);
      } else {
        setError(result.error || '生成最终 PRD 失败');
      }
    } catch (err) {
      // Only update error state if we haven't switched sessions
      if (selectedSession?.id !== currentSessionId) {
        return;
      }
      setError(err instanceof Error ? err.message : '生成最终 PRD 失败');
    } finally {
      // Only clear loading state if we haven't switched sessions
      if (selectedSession?.id === currentSessionId) {
        setLoading(false);
      }
    }
  };

  const steps = ['PRD 初稿', '可视化图表', '完整文档'];

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
            三步生成专业的产品需求文档：初稿 → 图表 → 完整文档
          </p>
        </header>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}

            {/* 步骤指示器 */}
            {currentPRD && (
              <StepIndicator current={currentStep} total={3} steps={steps} />
            )}

            {/* Step 1: PRD 初稿 + 编辑 */}
            {currentPRD && currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Step 1: PRD 初稿与编辑</h2>
                  <Button onClick={() => setCurrentStep(2)} className="gap-2">
                    下一步：生成图表
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* 可编辑的 PRD 查看器 */}
                {selectedSession ? (
                  <EditablePRDViewer
                    prd={currentPRD}
                    sessionId={selectedSession.id}
                    onPRDUpdate={setCurrentPRD}
                  />
                ) : (
                  <PRDViewer prd={currentPRD} />
                )}

                {/* 对话式编辑面板（备用） */}
                {selectedSession && (
                  <ConversationPanel
                    sessionId={selectedSession.id}
                    onPRDUpdate={setCurrentPRD}
                  />
                )}

                {/* 底部导航按钮 */}
                <div className="flex justify-center">
                  <Button onClick={() => setCurrentStep(2)} className="gap-2">
                    下一步：生成图表
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Mermaid 图表 */}
            {currentPRD && currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一步
                  </Button>
                  <h2 className="text-xl font-semibold">Step 2: 可视化图表</h2>
                  <Button onClick={() => setCurrentStep(3)} className="gap-2">
                    下一步：完整文档
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* 判断是否有图表内容 */}
                {diagrams && (diagrams.architecture || diagrams.journey || diagrams.features || diagrams.dataflow) ? (
                  <div className="space-y-6">
                    {diagrams.architecture && selectedSession && (
                      <MermaidChart
                        code={diagrams.architecture}
                        title="系统架构图"
                        description="展示系统的技术架构和组件关系"
                        sessionId={selectedSession.id}
                        diagramType="architecture"
                        onDiagramUpdated={(newCode) => setDiagrams(prev => prev ? { ...prev, architecture: newCode } : { architecture: newCode })}
                      />
                    )}
                    {diagrams.journey && selectedSession && (
                      <MermaidChart
                        code={diagrams.journey}
                        title="用户旅程图"
                        description="展示用户使用产品的完整流程和体验"
                        sessionId={selectedSession.id}
                        diagramType="journey"
                        onDiagramUpdated={(newCode) => setDiagrams(prev => prev ? { ...prev, journey: newCode } : { journey: newCode })}
                      />
                    )}
                    {diagrams.features && selectedSession && (
                      <MermaidChart
                        code={diagrams.features}
                        title="功能模块图"
                        description="展示核心功能的模块化结构"
                        sessionId={selectedSession.id}
                        diagramType="features"
                        onDiagramUpdated={(newCode) => setDiagrams(prev => prev ? { ...prev, features: newCode } : { features: newCode })}
                      />
                    )}
                    {diagrams.dataflow && selectedSession && (
                      <MermaidChart
                        code={diagrams.dataflow}
                        title="数据流图"
                        description="展示数据在系统中的流动过程"
                        sessionId={selectedSession.id}
                        diagramType="dataflow"
                        onDiagramUpdated={(newCode) => setDiagrams(prev => prev ? { ...prev, dataflow: newCode } : { dataflow: newCode })}
                      />
                    )}

                    {/* 底部导航按钮 */}
                    <div className="flex justify-center">
                      <Button onClick={() => setCurrentStep(3)} className="gap-2">
                        下一步：完整文档
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 生成按钮 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>生成可视化图表</CardTitle>
                        <CardDescription>
                          基于当前 PRD 生成系统架构图、用户旅程图、功能模块图和数据流图
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={handleGenerateDiagrams}
                          disabled={loading}
                          className="gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              生成图表
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* 生成进度 */}
                    {loading && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            生成进度
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {[
                              { key: 'architecture', label: '系统架构图' },
                              { key: 'journey', label: '用户旅程图' },
                              { key: 'features', label: '功能模块图' },
                              { key: 'dataflow', label: '数据流图' },
                            ].map(({ key, label }) => {
                              const status = diagramStatus[key as keyof typeof diagramStatus];
                              return (
                                <div key={key} className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{label}</span>
                                    {status === 'loading' && (
                                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    )}
                                    {status === 'success' && (
                                      <span className="text-green-600">✓ 完成</span>
                                    )}
                                    {status === 'idle' && (
                                      <span className="text-muted-foreground">等待中...</span>
                                    )}
                                  </div>
                                  {status === 'loading' && (
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                      <div className="h-full animate-pulse w-1/2 bg-primary" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: 完整文档 + 导出 */}
            {currentPRD && currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一步
                  </Button>
                  <h2 className="text-xl font-semibold">Step 3: 完整文档与导出</h2>
                  <div className="w-24" /> {/* 占位，保持居中 */}
                </div>

                {!finalMarkdown ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>生成完整 PRD 文档</CardTitle>
                      <CardDescription>
                        整合 PRD 内容和可视化图表，生成可交付的完整文档
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleFinalizePRD}
                        disabled={loading}
                        className="gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            生成完整 PRD
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* 预览完整 PRD 文档 */}
                    <PRDDocumentPreview content={finalMarkdown} title={currentPRD.title} />

                    {/* 导出按钮 */}
                    <Card className="max-w-7xl mx-auto">
                      <CardHeader>
                        <CardTitle>导出完整 PRD</CardTitle>
                        <CardDescription>
                          选择导出格式，下载可交付的 PRD 文档
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedSession && (
                          <ExportButton
                            sessionId={selectedSession.id}
                            prdTitle={currentPRD.title}
                            hasFinalContent={!!finalMarkdown}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* 初始输入界面 */}
            {!currentPRD && !showProgress && (
              <>
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
                        disabled={loading || !idea.trim()}
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

            {/* AI 思考进度 */}
            {showProgress && <ThinkingIndicator onComplete={() => {}} />}
          </div>
        </div>
      </main>
    </div>
  );
}
