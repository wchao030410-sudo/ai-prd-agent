'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Check, X, Edit3, ChevronRight } from 'lucide-react';
import { PRDDocument } from '@/types/prd';

interface InlineEditPanelProps {
  sessionId: string;
  selectedText: string;
  targetField: string;
  position: { x: number; y: number };
  selectionRect: DOMRect;
  onConfirm: (updatedPRD: PRDDocument) => void;
  onCancel: () => void;
}

interface EditPreview {
  originalValue: string;
  newValue: PRDDocument;
  fieldPath: string;
  changes: string[];
}

// 从 PRD 中提取与选中内容相关的新值
function extractRelevantChange(prd: PRDDocument, field: string, originalText: string): { text: string; changes: string[] } {
  const changes: string[] = [];
  let newText = originalText;

  switch (field) {
    case 'title':
      newText = prd.title;
      changes.push(`标题: "${originalText}" → "${prd.title}"`);
      break;

    case 'description':
      newText = prd.description;
      changes.push(`描述已更新`);
      break;

    case 'background':
      newText = prd.background || '';
      changes.push(`背景已更新`);
      break;

    case 'targetUsers.primary':
    case 'targetUsers.secondary':
      const users = field === 'targetUsers.primary' ? prd.targetUsers.primary : prd.targetUsers.secondary;
      newText = users.join('\n');
      changes.push(`目标用户: ${users.length} 个用户群体`);
      break;

    case 'painPoints':
      newText = prd.painPoints?.join('\n') || '';
      changes.push(`用户痛点: ${prd.painPoints?.length || 0} 个痛点`);
      break;

    case 'coreValue':
      newText = prd.coreValue?.join('\n') || '';
      changes.push(`核心价值: ${prd.coreValue?.length || 0} 个价值点`);
      break;

    case 'features':
      // 如果选中的是某个功能描述
      const feature = prd.features.find(f => originalText.includes(f.name) || f.description.includes(originalText));
      if (feature) {
        newText = `${feature.name}: ${feature.description}`;
        changes.push(`功能 "${feature.name}" (优先级: ${feature.priority})`);
      } else {
        newText = prd.features.map(f => `- ${f.name}`).join('\n');
        changes.push(`功能列表: ${prd.features.length} 个功能`);
      }
      break;

    case 'successMetrics':
      newText = prd.successMetrics?.join('\n') || '';
      changes.push(`成功指标: ${prd.successMetrics?.length || 0} 个指标`);
      break;

    case 'techFeasibility':
      newText = `难度: ${prd.techFeasibility?.overall || '未知'}\n` +
                (prd.techFeasibility?.challenges?.join('\n') || '');
      changes.push(`技术可行性: ${prd.techFeasibility?.overall || '未知'}`);
      break;

    default:
      // 对于未明确支持的字段，不显示完整 JSON
      newText = '✅ 点击"确认修改"应用此更改';
      changes.push('预览准备就绪');
  }

  return { text: newText, changes };
}

export function InlineEditPanel({
  sessionId,
  selectedText,
  targetField,
  position,
  selectionRect,
  onConfirm,
  onCancel,
}: InlineEditPanelProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<EditPreview | null>(null);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // 计算最佳位置（不遮挡选中的文本）
  const calculatePosition = () => {
    const panelWidth = 400;
    const panelHeight = 400;
    const margin = 20;

    // 默认放在选中文本的右侧
    let left = position.x + selectionRect.width + margin;
    let top = position.y;

    // 如果右侧空间不够，放在左侧
    if (left + panelWidth > window.innerWidth - margin) {
      left = position.x - panelWidth - margin;
    }

    // 如果左侧也不够，放在上方
    if (left < margin) {
      left = Math.max(margin, (window.innerWidth - panelWidth) / 2);
    }

    // 如果下方空间不够，放在上方
    if (top + panelHeight > window.innerHeight - margin) {
      top = position.y - panelHeight - margin;
    }

    // 确保不会超出视口
    top = Math.max(margin, Math.min(top, window.innerHeight - panelHeight - margin));

    return { left, top };
  };

  const finalPosition = calculatePosition();

  // 自动填充选中的文本
  useEffect(() => {
    if (selectedText) {
      setInput(`请修改"${selectedText.slice(0, 20)}${selectedText.length > 20 ? '...' : ''}"这部分内容`);
    }
  }, [selectedText]);

  // 处理生成预览
  const handleGeneratePreview = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const response = await fetch('/api/prd/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          instruction: input,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const { text, changes } = extractRelevantChange(result.data.prd, targetField, selectedText);
        setPreview({
          originalValue: selectedText,
          newValue: result.data.prd,
          fieldPath: targetField,
          changes,
        });
      } else {
        setError(result.error || '生成预览失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  // 确认修改
  const handleConfirm = () => {
    if (preview?.newValue) {
      onConfirm(preview.newValue);
    }
  };

  // 取消修改
  const handleCancel = () => {
    setPreview(null);
    setInput('');
    setError('');
  };

  // 完全关闭面板
  const handleClose = () => {
    onCancel();
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-50 w-96 rounded-lg border border-border bg-background shadow-xl"
      style={{
        left: `${finalPosition.left}px`,
        top: `${finalPosition.top}px`,
      }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Edit3 className="h-4 w-4 text-primary" />
            对话式编辑
          </CardTitle>
          <CardDescription className="text-xs">
            已选择 {selectedText.length} 个字符
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 输入区域 */}
          {!preview && (
            <>
              <Textarea
                placeholder="描述你想要的修改，例如：把这段改成更简洁的表达"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                className="resize-none text-sm"
                autoFocus
              />

              {/* 错误提示 */}
              {error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGeneratePreview}
                  disabled={loading || !input.trim()}
                  className="flex-1 gap-1"
                  size="sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      生成预览...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-3 w-3" />
                      生成预览
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}

          {/* 预览区域 */}
          {preview && (
            <div className="space-y-3">
              {/* 变更摘要 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">变更摘要：</p>
                <div className="flex flex-wrap gap-1">
                  {preview.changes.map((change, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {change}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 原始内容 */}
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">原始内容：</p>
                <div className="max-h-24 overflow-y-auto rounded-md bg-muted p-2 text-xs">
                  {preview.originalValue}
                </div>
              </div>

              {/* 新内容预览 */}
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  修改后内容
                  <ChevronRight className="h-3 w-3" />
                </p>
                <div className="max-h-32 overflow-y-auto rounded-md border border-primary/20 bg-primary/5 p-2 text-xs">
                  {(() => {
                    const { text } = extractRelevantChange(preview.newValue, targetField, preview.originalValue);
                    return <pre className="whitespace-pre-wrap break-words">{text}</pre>;
                  })()}
                </div>
              </div>

              {/* 确认/取消按钮 */}
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 gap-1 bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <Check className="h-3 w-3" />
                  确认修改
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="gap-1"
                  size="sm"
                >
                  <X className="h-3 w-3" />
                  重新编辑
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
