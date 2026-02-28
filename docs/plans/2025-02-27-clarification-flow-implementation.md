# PRD 澄清流程功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现智能澄清对话流程，在用户输入模糊时通过 AI 生成针对性问题来收集更多信息，提升 PRD 生成质量

**Architecture:** 混合模式设计 - 用户输入 → AI 分析清晰度 → 如不清晰则展示聊天式澄清问题 → 实时预览产品画像 → 整合信息生成 PRD

**Tech Stack:** Next.js 16 App Router, TypeScript, Zod 验证, 智谱 AI GLM-4.6, Prisma, shadcn/ui

---

## Task 1: 添加 TypeScript 类型定义

**Files:**
- Modify: `types/prd.ts`

**Step 1: 添加新的类型定义**

在 `types/prd.ts` 文件末尾添加以下类型：

```typescript
// 澄清问题类型
export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'choice' | 'example' | 'open';
  options?: string[];
  examples?: string[];
}

// 澄清回答类型
export interface ClarificationAnswer {
  question: string;
  answer: string;
  skipped?: boolean;
}

// 输入分析结果类型
export interface InputAnalysisResult {
  isClear: boolean;
  confidence: number;
  clarifyingQuestions: ClarificationQuestion[];
}
```

**Step 2: 验证类型定义正确性**

运行 TypeScript 编译检查：
```bash
cd d:\vibe_coding\ai-prd-agent
npx tsc --noEmit
```
预期：无类型错误

**Step 3: Commit**

```bash
git add types/prd.ts
git commit -m "feat: add clarification flow type definitions"
```

---

## Task 2: 创建输入分析 Prompt

**Files:**
- Create: `lib/prompts/clarification-prompt.ts`

**Step 1: 创建 Prompt 文件**

```typescript
// 输入分析 Prompt 模板

export const INPUT_ANALYSIS_SYSTEM_PROMPT = `你是一位资深产品经理，擅长分析用户的产品想法是否足够清晰，并能提出高质量的澄清问题。

你的职责：
1. 评估用户输入的产品想法是否足够清晰（0-1 分）
2. 如果清晰度不足，生成 2-4 个针对性的澄清问题

澄清问题优先级：
- 目标用户：谁会使用这个产品？
- 核心功能：最核心的 2-3 个功能是什么？
- 使用场景：用户在什么情况下使用？
- 竞品差异：和现有产品的区别是什么？

问题类型说明：
- choice: 提供 3-4 个具体选项供用户选择
- example: 提供 1-2 个真实产品示例作为启发
- open: 开放式问题（仅在必要时使用）

约束条件：
- 问题要具体、简洁，避免抽象
- 从用户痛点出发，而非技术实现
- 选项和示例要真实、有参考价值
- 始终输出有效的 JSON 格式`;

export const INPUT_ANALYSIS_PROMPT = (idea: string) => `请分析以下产品想法的清晰度：

产品想法：${idea}

请按照以下 JSON 结构输出：

{
  "isClear": false,
  "confidence": 0.4,
  "clarifyingQuestions": [
    {
      "id": "q1",
      "question": "具体问题文本",
      "type": "choice",
      "options": ["选项1", "选项2", "选项3", "选项4"]
    }
  ]
}

字段说明：
- isClear: 输入是否清晰（confidence >= 0.6 为清晰）
- confidence: 清晰度评分（0-1）
- clarifyingQuestions: 澄清问题数组（输入清晰时为空数组）
  - id: 问题唯一标识
  - question: 问题文本
  - type: 问题类型（choice/example/open）
  - options: 选项数组（choice 类型必需）
  - examples: 示例数组（example 类型必需）

请确保 JSON 格式正确，可以直接解析。`;
```

**Step 2: 验证文件语法**

```bash
cd d:\vibe_coding\ai-prd-agent
npx tsc --noEmit lib/prompts/clarification-prompt.ts
```
预期：无语法错误

**Step 3: Commit**

```bash
git add lib/prompts/clarification-prompt.ts
git commit -m "feat: add input analysis prompt template"
```

---

## Task 3: 创建输入分析 API

**Files:**
- Create: `app/api/prd/analyze-input/route.ts`

**Step 1: 创建 API 路由文件**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { chatWithResponse } from '@/lib/ai';
import { INPUT_ANALYSIS_SYSTEM_PROMPT, INPUT_ANALYSIS_PROMPT } from '@/lib/prompts/clarification-prompt';
import { InputAnalysisResult, ClarificationQuestion } from '@/types/prd';
import { z } from 'zod';

// 请求验证 Schema
const AnalyzeInputSchema = z.object({
  idea: z.string().min(10, '产品想法至少需要10个字符'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求
    const result = AnalyzeInputSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: '请求参数错误', details: result.error },
        { status: 400 }
      );
    }

    const { idea } = result.data;

    // 调用 AI 分析输入
    const { content } = await chatWithResponse(
      INPUT_ANALYSIS_SYSTEM_PROMPT,
      INPUT_ANALYSIS_PROMPT(idea),
      [],
      'json_object'
    );

    // 解析 JSON 响应
    let analysisResult: InputAnalysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch {
      // 如果 JSON 解析失败，尝试提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI 返回的格式不正确');
      }
    }

    // 验证并添加问题 ID
    if (analysisResult.clarifyingQuestions) {
      analysisResult.clarifyingQuestions = analysisResult.clarifyingQuestions.map((q, index) => ({
        ...q,
        id: q.id || `q_${Date.now()}_${index}`,
      }));
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '输入分析失败',
      },
      { status: 500 }
    );
  }
}
```

**Step 2: 测试 API 语法**

```bash
cd d:\vibe_coding\ai-prd-agent
npx tsc --noEmit
```
预期：无类型错误

**Step 3: Commit**

```bash
git add app/api/prd/analyze-input/route.ts
git commit -m "feat: add input analysis API endpoint"
```

---

## Task 4: 修改 PRD 生成 API 支持澄清信息

**Files:**
- Modify: `app/api/prd/generate/route.ts`

**Step 1: 修改请求验证 Schema**

在文件中找到 `GeneratePRDSchema` 定义（约第 11-15 行），修改为：

```typescript
const GeneratePRDSchema = z.object({
  idea: z.string().min(10, '产品想法至少需要10个字符'),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
  // 新增：澄清回答数组
  clarifications: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    skipped: z.boolean().optional(),
  })).optional(),
});
```

**Step 2: 修改 PRD 生成 Prompt**

在文件中找到生成 PRD 的部分（约第 44-46 行），修改为：

```typescript
// 构建增强的 Prompt
let enhancedIdea = idea;
if (clarifications && clarifications.length > 0) {
  const clarificationText = clarifications
    .filter(c => !c.skipped)
    .map(c => `Q: ${c.question}\nA: ${c.answer}`)
    .join('\n\n');

  enhancedIdea = `${idea}

用户补充信息：
${clarificationText}`;
}

// 生成 PRD
const prompt = PRD_GENERATION_PROMPT(enhancedIdea);
const { content, usage } = await chatWithResponse(SYSTEM_PROMPT, prompt, [], 'json_object');
```

**Step 3: 修改解构赋值**

在文件顶部找到解构语句（约第 34 行），添加 clarifications：

```typescript
const { idea, anonymousId: reqAnonymousId, sessionId: reqSessionId, clarifications } = result.data;
```

**Step 4: 验证修改**

```bash
cd d:\vibe_coding\ai-prd-agent
npx tsc --noEmit
```
预期：无类型错误

**Step 5: Commit**

```bash
git add app/api/prd/generate/route.ts
git commit -m "feat: support clarifications in PRD generation API"
```

---

## Task 5: 创建澄清对话组件

**Files:**
- Create: `components/prd/ClarificationChat.tsx`

**Step 1: 创建组件文件**

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, CheckCircle2, SkipForward, Loader2 } from 'lucide-react';
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

  const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>问题 {currentQuestionIndex + 1} / {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 问题气泡 */}
        <div className="mb-6">
          <div className="inline-flex rounded-2xl rounded-tl-none bg-primary px-4 py-3 text-primary-foreground">
            <span className="font-medium">{currentQuestion.question}</span>
          </div>
        </div>

        {/* Choice 类型：选项 */}
        {currentQuestion.type === 'choice' && currentQuestion.options && (
          <div className="mb-4 space-y-2">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionToggle(option)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedOptions.includes(option)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {selectedOptions.includes(option) && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Example 类型：示例 */}
        {currentQuestion.type === 'example' && currentQuestion.examples && (
          <div className="mb-4 rounded-lg bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">参考示例：</p>
            <ul className="space-y-1">
              {currentQuestion.examples.map((example, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • "{example}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 自定义输入框 */}
        <div className="mb-4">
          <Textarea
            placeholder={currentQuestion.type === 'choice' ? '或者自定义你的回答...' : '请输入你的回答...'}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* 按钮组 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            跳过
          </Button>

          <Button
            onClick={handleNext}
            disabled={isLoading || (!currentAnswer && selectedOptions.length === 0)}
            className="gap-2"
          >
            {isLastQuestion ? '完成' : '下一个'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: 验证组件语法**

```bash
cd d:\vibe_coding\ai-prd-agent
npx tsc --noEmit
```
预期：无类型错误

**Step 3: Commit**

```bash
git add components/prd/ClarificationChat.tsx
git commit -m "feat: add ClarificationChat component"
```

---

## Task 6: 创建产品画像预览组件

**Files:**
- Create: `components/prd/ProductProfilePreview.tsx`

**Step 1: 创建组件文件**

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Lightbulb, FileText } from 'lucide-react';
import { ClarificationAnswer } from '@/types/prd';

interface ProductProfilePreviewProps {
  answers: ClarificationAnswer[];
  originalIdea: string;
}

export function ProductProfilePreview({ answers, originalIdea }: ProductProfilePreviewProps) {
  const validAnswers = answers.filter(a => !a.skipped);

  return (
    <div className="w-80 border-l border-border bg-muted/30 p-4 overflow-y-auto">
      <h3 className="mb-4 font-semibold flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        产品画像
      </h3>

      {/* 已收集信息数量 */}
      <div className="mb-4 text-sm text-muted-foreground">
        已收集信息 × {validAnswers.length}
      </div>

      {/* Q&A 列表 */}
      <div className="space-y-3 mb-6">
        {validAnswers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            等待回答...
          </div>
        ) : (
          validAnswers.map((answer, index) => (
            <div
              key={index}
              className="rounded-lg bg-background p-3 text-sm border"
            >
              <div className="flex items-start gap-2 mb-1">
                <MessageSquare className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium text-xs">{answer.question}</span>
              </div>
              <div className="text-xs text-muted-foreground pl-5">
                → {answer.answer}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 原始想法预览 */}
      {originalIdea && (
        <div className="border-t pt-4">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="h-3 w-3 text-muted-foreground mt-0.5" />
            <span className="text-xs font-medium text-muted-foreground">
              原始想法
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {originalIdea}
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/prd/ProductProfilePreview.tsx
git commit -m "feat: add ProductProfilePreview component"
```

---

## Task 7: 修改主页面集成澄清流程

**Files:**
- Modify: `app/page.tsx`

**Step 1: 添加新的状态和导入**

在文件顶部的 imports 部分添加：

```typescript
import { ClarificationChat } from '@/components/prd/ClarificationChat';
import { ProductProfilePreview } from '@/components/prd/ProductProfilePreview';
import { ClarificationQuestion, ClarificationAnswer, InputAnalysisResult } from '@/types/prd';
```

在组件内的状态定义部分（约第 42-65 行）添加：

```typescript
const [clarificationState, setClarificationState] = useState<{
  show: boolean;
  questions: ClarificationQuestion[];
  answers: ClarificationAnswer[];
  isAnalyzing: boolean;
}>({
  show: false,
  questions: [],
  answers: [],
  isAnalyzing: false,
});
```

**Step 2: 修改 handleGeneratePRD 函数**

找到 `handleGeneratePRD` 函数（约第 87-132 行），替换为：

```typescript
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
    // 先分析输入质量
    setClarificationState(prev => ({ ...prev, isAnalyzing: true }));

    const analyzeResponse = await fetch('/api/prd/analyze-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea }),
    });

    const analyzeResult = await analyzeResponse.json();

    setClarificationState(prev => ({ ...prev, isAnalyzing: false }));

    if (analyzeResult.success && !analyzeResult.data.isClear) {
      // 输入不够清晰，显示澄清对话
      setClarificationState({
        show: true,
        questions: analyzeResult.data.clarifyingQuestions,
        answers: [],
        isAnalyzing: false,
      });
      setShowProgress(false);
      setLoading(false);
      return;
    }

    // 输入清晰，直接生成 PRD
    await generatePRD([]);
  } catch (err) {
    setShowProgress(false);
    setLoading(false);
    setClarificationState(prev => ({ ...prev, isAnalyzing: false }));
    setError(err instanceof Error ? err.message : '网络错误');
  }
};
```

**Step 3: 添加 generatePRD 函数**

在 `handleGeneratePRD` 函数后面添加：

```typescript
const generatePRD = async (clarifications: ClarificationAnswer[]) => {
  try {
    const response = await fetch('/api/prd/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        clarifications: clarifications.length > 0 ? clarifications : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`生成失败: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      setTimeout(() => {
        setCurrentPRD(result.data.prd);
        setSelectedSession({
          id: result.data.sessionId,
          title: result.data.prd.title,
          updatedAt: new Date()
        });
        setShowProgress(false);
        setIdea('');
        setClarificationState({ show: false, questions: [], answers: [], isAnalyzing: false });
        loadSessions();
        setCurrentStep(1);
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
```

**Step 4: 添加澄清完成处理函数**

```typescript
const handleClarificationComplete = (answers: ClarificationAnswer[]) => {
  setClarificationState(prev => ({ ...prev, answers }));
  setLoading(true);
  setShowProgress(true);
  generatePRD(answers);
};
```

**Step 5: 修改主布局支持三栏**

找到 `return` 中的布局结构（约第 356 行开始），修改：

```typescript
return (
  <div className="flex h-screen bg-background">
    {/* 侧边栏 */}
    <aside className="w-64 border-r border-border bg-card">
      {/* ... 保持原有内容 ... */}
    </aside>

    {/* 主内容区 */}
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* ... 保持原有内容 ... */}
    </main>

    {/* 产品画像预览 - 条件显示 */}
    {clarificationState.show && (
      <ProductProfilePreview
        answers={clarificationState.answers}
        originalIdea={idea}
      />
    )}
  </div>
);
```

**Step 6: 在输入区域下方添加澄清对话**

找到初始输入界面部分（约第 695 行的 `{!currentPRD && !showProgress &&`），在 Card 后面添加：

```typescript
{!currentPRD && !showProgress && (
  <>
    {/* 原有的输入卡片 */}
    <Card>
      {/* ... 保持原有内容 ... */}
    </Card>

    {/* 澄清对话 - 条件显示 */}
    {clarificationState.show && (
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-4 text-center">
          关于你的产品，我想确认几个细节...
        </p>
        <ClarificationChat
          questions={clarificationState.questions}
          onComplete={handleClarificationComplete}
          isLoading={loading}
        />
      </div>
    )}

    {/* 示例卡片 */}
    <Card>
      {/* ... 保持原有内容 ... */}
    </Card>
  </>
)}
```

**Step 7: 验证修改**

```bash
cd d:\vibe_coding\ai-prd-agent
npx tsc --noEmit
```
预期：无类型错误

**Step 8: Commit**

```bash
git add app/page.tsx
git commit -m "feat: integrate clarification flow into main page"
```

---

## Task 8: 删除 PDF 导出相关代码

**Files:**
- Modify: `app/api/prd/export/route.ts`
- Modify: `types/prd.ts`

**Step 1: 修改导出类型定义**

在 `types/prd.ts` 中找到 `ExportFormat` 类型（约第 94 行），修改为：

```typescript
// 导出格式类型
export type ExportFormat = 'md' | 'docx';  // 移除 'pdf'
```

**Step 2: 修改导出 API**

在 `app/api/prd/export/route.ts` 中：

找到验证 Schema（约第 7-10 行），修改：

```typescript
const ExportPRDSchema = z.object({
  sessionId: z.string().min(1, '会话 ID 不能为空'),
  format: z.enum(['md', 'docx']),  // 移除 'pdf'
});
```

找到 PDF 分支（约第 78-86 行），删除整个 case：

```typescript
// 删除以下代码
case 'pdf':
  return NextResponse.json(
    {
      success: false,
      error: 'PDF 导出功能暂不可用，请使用 Word 或 Markdown 格式导出',
    },
    { status: 501 }
  );
```

**Step 3: 验证修改**

```bash
cd d:\vibe_coding\ai-prd-agent
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add app/api/prd/export/route.ts types/prd.ts
git commit -m "refactor: remove PDF export functionality"
```

---

## Task 9: 更新 package.json 依赖

**Files:**
- Modify: `package.json`

**Step 1: 移除 PDF 相关依赖**

在 `package.json` 的 dependencies 中移除：

```json
"@types/pdfkit": "^0.17.5",
"pdf-lib": "^1.17.1",
"pdfkit": "^0.17.2",
```

**Step 2: 运行依赖清理**

```bash
cd d:\vibe_coding\ai-prd-agent
npm uninstall @types/pdfkit pdf-lib pdfkit
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove PDF-related dependencies"
```

---

## Task 10: 本地测试验证

**Files:**
- Test: 手动测试

**Step 1: 启动开发服务器**

```bash
cd d:\vibe_coding\ai-prd-agent
npm run dev
```

**Step 2: 测试清晰输入**

1. 访问 http://localhost:3000
2. 输入详细的 Product Idea:
   ```
   我想做一个面向程序员的技术文档写作助手，主要功能包括：
   1. AI 辅助写作代码示例
   2. 自动生成 API 文档结构
   3. 支持 Markdown 和代码高亮
   目标用户是需要写技术文档的开发者。
   ```
3. 点击"生成 PRD"
4. 预期：直接生成 PRD，不显示澄清对话

**Step 3: 测试模糊输入**

1. 点击"新建 PRD"
2. 输入简短的 Product Idea:
   ```
   做一个外卖 App
   ```
3. 点击"生成 PRD"
4. 预期：显示澄清对话界面，包含 2-4 个问题

**Step 4: 测试澄清流程**

1. 选择第一个问题的选项
2. 或输入自定义答案
3. 点击"下一个"
4. 重复直到所有问题完成
5. 预期：右侧产品画像预览实时更新

**Step 5: 测试 PRD 生成**

1. 完成所有问题后点击"完成"
2. 预期：生成 PRD，包含澄清对话中的信息

**Step 6: 测试跳过功能**

1. 重新开始，输入模糊想法
2. 点击某个问题的"跳过"
3. 预期：该问题标记为已跳过，继续下一个问题

**Step 7: Commit 测试结果（文档）**

创建测试笔记文件：

```bash
cat > d:\vibe_coding\ai-prd-agent\docs\clarification-flow-test-notes.md << 'EOF'
# 澄清流程测试笔记

## 测试日期
2025-02-27

## 测试结果

### ✅ 通过
- 清晰输入直接生成 PRD
- 模糊输入触发澄清对话
- 问题选项可正常选择
- 自定义输入正常
- 跳过功能正常
- 产品画像实时更新
- PRD 包含澄清信息

### ⚠️ 发现问题
- （记录发现的问题）

### 📝 后续优化建议
- （记录优化建议）
EOF
```

```bash
git add docs/clarification-flow-test-notes.md
git commit -m "docs: add clarification flow test notes"
```

---

## Task 11: 更新 README 文档

**Files:**
- Modify: `README.md`

**Step 1: 更新项目说明**

```bash
cat > d:\vibe_coding\ai-prd-agent\README.md << 'EOF'
# AI PRD Agent

基于 AI 的产品需求文档（PRD）自动生成工具，通过三步工作流帮助用户将产品想法转化为完整的专业文档。

## 功能特性

- **智能澄清对话**: 当用户输入较为模糊时，AI 会生成针对性的澄清问题来收集更多信息
- **三步工作流**:
  1. PRD 初稿生成
  2. 可视化图表（架构图、用户旅程图、功能模块图、数据流图）
  3. 完整文档导出（Markdown / Word）
- **实时产品画像预览**: 澄清对话过程中实时显示已收集的产品信息
- **可编辑 PRD**: 支持直接编辑生成的 PRD 内容
- **会话管理**: 保存历史会话，随时查看和编辑

## 技术栈

- **前端**: Next.js 16.1.6 + React 19.2.3 + TypeScript 5
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: PostgreSQL (Prisma ORM v5.22.0)
- **AI 模型**: 智谱 AI GLM-4.6v
- **图表**: Mermaid.js v11.12.2
- **文档导出**: docx (Word), Markdown

## 快速开始

### 环境变量配置

复制 `.env.example` 到 `.env.local` 并配置：

```bash
cp .env.example .env.local
```

必需的环境变量：

```env
# 智谱AI API密钥（必需）
ZHIPU_API_KEY=your_api_key_here

# 数据库连接（必需）
DATABASE_URL=your_database_url_here

# 管理后台认证（可选）
ADMIN_PASSWORD_HASH=your_hash_here
ADMIN_JWT_SECRET=your_secret_here
```

### 安装依赖

```bash
npm install
```

### 数据库迁移

```bash
npx prisma generate
npx prisma db push
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 使用方法

1. **输入产品想法**: 在主页输入你的产品想法
2. **智能澄清**（如需要）: 如果输入较为模糊，AI 会提出澄清问题
3. **查看 PRD 初稿**: AI 生成结构化的 PRD 初稿
4. **生成可视化图表**: 一键生成系统架构图、用户旅程图等
5. **导出完整文档**: 导出为 Markdown 或 Word 格式

## 项目结构

```
ai-prd-agent/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── prd/           # PRD 相关 API
│   │   │   ├── analyze-input/  # 输入质量分析
│   │   │   ├── generate/       # PRD 生成
│   │   │   ├── edit/           # PRD 编辑
│   │   │   └── export/         # 文档导出
│   │   └── diagrams/      # 图表相关 API
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── prd/              # PRD 相关组件
│   │   ├── ClarificationChat.tsx      # 澄清对话组件
│   │   ├── ProductProfilePreview.tsx  # 产品画像预览
│   │   ├── PRDViewer.tsx              # PRD 查看器
│   │   └── ...
│   └── ui/               # shadcn/ui 组件
├── lib/                  # 工具库
│   ├── prompts/          # AI 提示词模板
│   │   ├── clarification-prompt.ts  # 澄清问题 Prompt
│   │   ├── prd-template.ts           # PRD 生成 Prompt
│   │   └── diagram-prompts.ts        # 图表生成 Prompt
│   ├── ai.ts            # 智谱 AI 集成
│   ├── db.ts            # 数据库操作
│   └── export/          # 文档导出
├── prisma/              # 数据库模型
│   └── schema.prisma
├── types/               # TypeScript 类型定义
│   └── prd.ts
└── docs/                # 文档
    └── plans/           # 设计文档
```

## 设计文档

- [澄清流程设计文档](./docs/plans/2025-02-27-clarification-flow-design.md)
- [澄清流程实施计划](./docs/plans/2025-02-27-clarification-flow-implementation.md)

## 开发指南

### 可用的 npm 脚本

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint
```

### 数据库操作

```bash
npx prisma studio         # 打开 Prisma Studio
npx prisma generate       # 生成 Prisma Client
npx prisma db push        # 推送 schema 到数据库
```

## License

MIT
EOF
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with clarification flow feature"
```

---

## 验收清单

完成所有任务后，请验证以下功能：

- [ ] 类型定义正确，无 TypeScript 错误
- [ ] 输入分析 API 正常工作
- [ ] PRD 生成 API 支持澄清信息
- [ ] 澄清对话组件正常显示
- [ ] 产品画像预览实时更新
- [ ] 清晰输入直接生成 PRD
- [ ] 模糊输入触发澄清对话
- [ ] 可跳过问题
- [ ] PDF 导出相关代码已删除
- [ ] README 文档已更新

---

**总计任务数**: 11
**预计总时长**: 60-90 分钟
**完成后提交信息**: `feat: implement PRD clarification flow feature`
