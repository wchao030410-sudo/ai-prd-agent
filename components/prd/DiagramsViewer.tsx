'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MermaidChart } from './MermaidChart';
import { Loader2, Zap } from 'lucide-react';

interface DiagramsViewerProps {
  sessionId: string;
  onDiagramsGenerated: (diagrams: { architecture: string; journey: string; features: string; dataflow: string }) => void;
}

type DiagramStep = 'idle' | 'loading' | 'success' | 'error';

export function DiagramsViewer({ sessionId, onDiagramsGenerated }: DiagramsViewerProps) {
  const [steps, setSteps] = useState<{
    architecture: DiagramStep;
    journey: DiagramStep;
    features: DiagramStep;
    dataflow: DiagramStep;
  }>({
    architecture: 'idle',
    journey: 'idle',
    features: 'idle',
    dataflow: 'idle',
  });

  const [diagrams, setDiagrams] = useState<{
    architecture?: string;
    journey?: string;
    features?: string;
    dataflow?: string;
  }>({});

  const [errors, setErrors] = useState<{
    architecture?: string;
    journey?: string;
    features?: string;
    dataflow?: string;
  }>({});

  // 更新单个图表的代码
  const handleDiagramUpdate = (type: 'architecture' | 'journey' | 'features' | 'dataflow', newCode: string) => {
    setDiagrams((prev) => ({ ...prev, [type]: newCode }));
  };

  // 生成单个图表
  const generateDiagram = async (type: 'architecture' | 'journey' | 'features' | 'dataflow') => {
    setSteps((prev) => ({ ...prev, [type]: 'loading' }));
    setErrors((prev) => ({ ...prev, [type]: undefined }));

    try {
      const response = await fetch('/api/diagrams/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          diagramType: type,
        }),
      });

      const result = await response.json();

      if (result.success && result.data.diagrams) {
        const code = result.data.diagrams[type];
        setDiagrams((prev) => ({ ...prev, [type]: code }));
        setSteps((prev) => ({ ...prev, [type]: 'success' }));

        // 检查是否所有图表都生成完成
        const allGenerated = { ...diagrams, [type]: code };
        if (allGenerated.architecture && allGenerated.journey && allGenerated.features && allGenerated.dataflow) {
          onDiagramsGenerated({
            architecture: allGenerated.architecture,
            journey: allGenerated.journey,
            features: allGenerated.features,
            dataflow: allGenerated.dataflow,
          });
        }
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成失败';
      setErrors((prev) => ({ ...prev, [type]: errorMsg }));
      setSteps((prev) => ({ ...prev, [type]: 'error' }));
    }
  };

  // 生成所有图表
  const generateAll = async () => {
    // 重置状态
    setSteps({
      architecture: 'loading',
      journey: 'loading',
      features: 'loading',
      dataflow: 'loading',
    });
    setDiagrams({});
    setErrors({});

    // 依次生成每个图表
    await generateDiagram('architecture');
    await generateDiagram('journey');
    await generateDiagram('features');
    await generateDiagram('dataflow');
  };

  const diagramLabels = {
    architecture: '系统架构图',
    journey: '用户旅程图',
    features: '功能模块图',
    dataflow: '数据流图',
  };

  const allSuccess = Object.values(steps).every((s) => s === 'success');
  const hasError = Object.values(steps).some((s) => s === 'error');
  const isGenerating = Object.values(steps).some((s) => s === 'loading');

  return (
    <div className="space-y-6">
      {/* 生成按钮 */}
      {!allSuccess && !isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle>生成可视化图表</CardTitle>
            <CardDescription>
              基于当前 PRD 生成系统架构图、用户旅程图、功能模块图和数据流图
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={generateAll} className="w-full gap-2">
                <Zap className="h-4 w-4" />
                生成所有图表
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                或者单独生成每个图表
              </p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(diagramLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => generateDiagram(key as any)}
                    disabled={steps[key as keyof typeof steps] === 'loading'}
                  >
                    {steps[key as keyof typeof steps] === 'loading' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      label
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 生成进度 */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              生成进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(diagramLabels).map(([key, label]) => {
                const step = steps[key as keyof typeof steps];
                const error = errors[key as keyof typeof errors];

                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">{label}</span>
                        {step === 'loading' && (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                        {step === 'success' && (
                          <span className="text-xs text-green-600">✓ 完成</span>
                        )}
                        {step === 'error' && (
                          <span className="text-xs text-destructive">✗ 失败</span>
                        )}
                      </div>
                      {step === 'loading' && (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full animate-progress w-1/2 bg-primary" />
                        </div>
                      )}
                      {error && (
                        <p className="text-xs text-destructive">{error}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图表展示 */}
      <div className="space-y-6">
        {diagrams.architecture && (
          <MermaidChart
            code={diagrams.architecture}
            title="系统架构图"
            description="展示系统的技术架构和组件关系"
            sessionId={sessionId}
            diagramType="architecture"
            onDiagramUpdated={(newCode) => handleDiagramUpdate('architecture', newCode)}
          />
        )}

        {diagrams.journey && (
          <MermaidChart
            code={diagrams.journey}
            title="用户旅程图"
            description="展示用户使用产品的完整流程和体验"
            sessionId={sessionId}
            diagramType="journey"
            onDiagramUpdated={(newCode) => handleDiagramUpdate('journey', newCode)}
          />
        )}

        {diagrams.features && (
          <MermaidChart
            code={diagrams.features}
            title="功能模块图"
            description="展示核心功能的模块化结构"
            sessionId={sessionId}
            diagramType="features"
            onDiagramUpdated={(newCode) => handleDiagramUpdate('features', newCode)}
          />
        )}

        {diagrams.dataflow && (
          <MermaidChart
            code={diagrams.dataflow}
            title="数据流图"
            description="展示数据在系统中的流动过程"
            sessionId={sessionId}
            diagramType="dataflow"
            onDiagramUpdated={(newCode) => handleDiagramUpdate('dataflow', newCode)}
          />
        )}
      </div>
    </div>
  );
}
