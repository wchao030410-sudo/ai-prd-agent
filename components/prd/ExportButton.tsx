'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

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
    <div className="space-y-6">
      {!hasFinalContent && (
        <div className="px-4 py-3 border-l-2 border-[#F59E0B] bg-amber-50 dark:bg-amber-950/10">
          <p className="font-sans text-sm text-[#B45309] dark:text-amber-400">
            请先点击上方"生成完整 PRD"按钮，完成后再导出文档
          </p>
        </div>
      )}

      {/* 导出选项 - 极简列表风格 */}
      <div className="space-y-3">
        <button
          onClick={() => handleExport('md')}
          disabled={!hasFinalContent || (loading.loading && loading.format === 'md')}
          className="flex items-center justify-between w-full px-0 py-4 border-b border-[#E0E3E8] dark:border-[#2D3748] font-sans text-base text-[#3A3A3A] dark:text-[#A0AEC0] hover:text-[#1A1A1A] dark:hover:text-[#F1F3F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-[#6B7B8C] dark:text-[#9AA5B1]" />
            <span className="tracking-wide">Markdown</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-sans text-xs text-[#9AA5B1] uppercase tracking-widest">
              .md
            </span>
            {loading.loading && loading.format === 'md' && (
              <span className="text-sm text-[#6B7B8C]">导出中...</span>
            )}
          </div>
        </button>

        <button
          onClick={() => handleExport('docx')}
          disabled={!hasFinalContent || (loading.loading && loading.format === 'docx')}
          className="flex items-center justify-between w-full px-0 py-4 border-b border-[#E0E3E8] dark:border-[#2D3748] font-sans text-base text-[#3A3A3A] dark:text-[#A0AEC0] hover:text-[#1A1A1A] dark:hover:text-[#F1F3F6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-[#6B7B8C] dark:text-[#9AA5B1]" />
            <span className="tracking-wide">Word 文档</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-sans text-xs text-[#9AA5B1] uppercase tracking-widest">
              .docx
            </span>
            {loading.loading && loading.format === 'docx' && (
              <span className="text-sm text-[#6B7B8C]">导出中...</span>
            )}
          </div>
        </button>
      </div>

      {success && (
        <div className="px-4 py-3 border-l-2 border-[#10B981] bg-green-50 dark:bg-green-950/10">
          <p className="font-sans text-sm text-[#059669] dark:text-green-400">
            {success}
          </p>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 border-l-2 border-[#EF4444] bg-red-50 dark:bg-red-950/10">
          <p className="font-sans text-sm text-[#DC2626] dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      <p className="font-sans text-xs text-[#9AA5B1]">
        {!hasFinalContent
          ? '提示：需要先完成最终 PRD 生成才能导出文档'
          : '推荐：Word 格式完整支持中文；Markdown 可用任何编辑器打开'}
      </p>
    </div>
  );
}
