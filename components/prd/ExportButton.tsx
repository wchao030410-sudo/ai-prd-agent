'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, File } from 'lucide-react';

interface ExportButtonProps {
  sessionId: string;
  prdTitle: string;
  hasFinalContent: boolean;
}

export function ExportButton({ sessionId, prdTitle, hasFinalContent }: ExportButtonProps) {
  const [loading, setLoading] = useState<{ format: string; loading: boolean }>({
    format: '',
    loading: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExport = async (format: 'md' | 'pdf' | 'docx') => {
    // 检查是否有最终内容
    if (!hasFinalContent) {
      setError('请先点击"生成完整 PRD"按钮生成最终版本');
      return;
    }

    setLoading({ format, loading: true });
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/prd/export?sessionId=${sessionId}&format=${format}`
      );

      if (format === 'md') {
        // Markdown 格式 - 直接下载
        if (response.ok) {
          const content = await response.text();
          const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${prdTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_PRD.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setSuccess('MD 文件导出成功！');
        } else {
          const result = await response.json();
          setError(result.error || '导出失败');
        }
      } else {
        // PDF 和 Word 格式 - 二进制文件下载
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${prdTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_PRD.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setSuccess(`${format.toUpperCase()} 文件导出成功！`);
        } else {
          const result = await response.json();
          setError(result.error || '导出失败');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading({ format: '', loading: false });
    }
  };

  return (
    <div className="space-y-4">
      {!hasFinalContent && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          请先点击上方"生成完整 PRD"按钮，完成后再导出文档
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleExport('md')}
          disabled={!hasFinalContent || (loading.loading && loading.format === 'md')}
          variant="outline"
          className="gap-2"
        >
          {loading.loading && loading.format === 'md' ? (
            <>导出中...</>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              导出 MD
            </>
          )}
        </Button>

        <Button
          onClick={() => handleExport('docx')}
          disabled={!hasFinalContent || (loading.loading && loading.format === 'docx')}
          variant="outline"
          className="gap-2"
        >
          {loading.loading && loading.format === 'docx' ? (
            <>导出中...</>
          ) : (
            <>
              <Download className="h-4 w-4" />
              导出 Word
            </>
          )}
        </Button>
      </div>

      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {!hasFinalContent
          ? '提示：需要先完成最终 PRD 生成才能导出文档'
          : '推荐：Word 格式完整支持中文；Markdown 可用任何编辑器打开'}
      </p>
    </div>
  );
}
