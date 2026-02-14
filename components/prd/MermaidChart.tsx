'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Maximize2, Minimize2, Copy, Check, Code } from 'lucide-react';
import mermaid from 'mermaid';

interface MermaidChartProps {
  code?: string;
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: string;
}

// 初始化 Mermaid（只执行一次）
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
}

export function MermaidChart({
  code,
  title,
  description,
  isLoading = false,
  error: externalError,
}: MermaidChartProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const error = externalError || internalError;

  // 渲染图表的函数
  const renderChart = useCallback(async () => {
    if (!code) return;

    setIsRendering(true);
    setInternalError(null);

    try {
      // 生成唯一 ID
      const id = `mermaid-${Math.random().toString(36).substring(7)}`;

      // 预处理代码：移除可能导致问题的HTML标签，但保留换行符
      let processedCode = code
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/[ \t]+/g, ' '); // 只替换空格和制表符，不替换换行符

      // 使用 mermaid.render 渲染图表
      const { svg } = await mermaid.render(id, processedCode);
      setSvgContent(svg);
      setIsRendering(false);
    } catch (err) {
      // 提供更友好的错误信息
      let errorMessage = '图表渲染失败';
      if (err instanceof Error) {
        if (err.message.includes('Parse error')) {
          errorMessage = '图表语法解析错误，AI 生成的图表代码格式不正确。请尝试重新生成图表。';
        } else {
          errorMessage = `图表渲染失败: ${err.message.substring(0, 100)}`;
        }
      }
      setInternalError(errorMessage);
      setIsRendering(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      renderChart();
    }
  }, [code, renderChart]);

  // 复制 Mermaid 代码
  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 加载状态
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-semibold">AI 正在生成图表...</p>
              <p className="text-sm text-muted-foreground">这可能需要 10-20 秒</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 图表内容渲染
  const renderChartContent = () => {
    if (error) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm">{error}</span>
              {code && (
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 p-0 h-auto"
                  onClick={() => setShowSource(!showSource)}
                >
                  {showSource ? '隐藏源代码' : '查看源代码'}
                </Button>
              )}
            </div>
          </div>
          {showSource && code && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Mermaid 源代码</span>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                {code}
              </pre>
            </div>
          )}
        </div>
      );
    }

    if (isRendering) {
      return (
        <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在渲染图表...
        </div>
      );
    }

    return (
      <div
        className="flex items-center justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  };

  // 全屏模式
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8">
        <div className="relative h-full w-full max-w-7xl overflow-auto rounded-lg bg-white dark:bg-slate-950 p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    复制代码
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Minimize2 className="mr-2 h-4 w-4" />
                退出全屏
              </Button>
            </div>
          </div>
          {renderChartContent()}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {code && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderChartContent()}
      </CardContent>
    </Card>
  );
}
