import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai';
import {
  ARCHITECTURE_DIAGRAM_PROMPT,
  JOURNEY_DIAGRAM_PROMPT,
  FEATURES_DIAGRAM_PROMPT,
  DATAFLOW_DIAGRAM_PROMPT,
} from '@/lib/prompts/diagram-prompts';
import { getPRDBySession, updatePRD, createMessage, getSession } from '@/lib/db';
import { PRDDocument } from '@/types/prd';
import { z } from 'zod';
import { safeJsonParse } from '@/lib/utils';
import mermaid from 'mermaid';

// 图表生成请求验证 schema
const GenerateDiagramsSchema = z.object({
  sessionId: z.string().min(1, '会话 ID 不能为空'),
});

const DIAGRAM_SYSTEM_PROMPT = `你是一个专业的系统架构师和产品设计师，擅长使用 Mermaid 图表语言绘制清晰、准确的可视化图表。

你的任务是根据 PRD 内容生成以下类型的 Mermaid 图表：
1. 系统架构图（graph TD）：展示系统组成和技术栈
2. 用户旅程图（journey）：展示用户使用流程和体验
3. 功能模块图（graph LR）：展示功能的模块化结构（注意：不要使用 mindmap 语法）
4. 数据流图（graph TD）：展示数据在系统中的流动过程

## 严格语法要求（必须遵守）

1. 节点命名规则：
   - 节点名称使用英文字母：A, B, C... 或 Node1, Node2...
   - 节点显示文本用方括号：A[文本] 或 B(圆角文本)
   - 数据库用圆括号：C[(数据库)]

2. 连接规则：
   - 箭头：A --> B
   - 带标签的箭头：A -->|标签| B
   - 标签必须简短（1-4个字符）

3. 布局要求：
   - 每个节点定义必须独占一行
   - 节点显示文本必须简洁（不超过8个中文字符）
   - 不要在一行中堆砌多个节点定义

4. 禁止事项：
   - 不要使用 HTML 标签（<br/>, <div> 等）
   - 不要使用 mindmap 语法，只用 graph LR/TD
   - 不要在节点文本中使用括号、引号等特殊字符
   - 不要生成过长的单行代码

输出格式：
- 只返回 Mermaid 代码
- 代码块用 \`\`\`mermaid 包裹（如果需要）
- 不要添加任何解释性文字
`;

// 初始化 Mermaid 用于服务器端验证
if (typeof window === 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
}

// 验证 Mermaid 代码是否可以正确解析
async function validateMermaidCode(code: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const id = `validation-${Math.random().toString(36).substring(7)}`;
    await mermaid.render(id, code);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// 生成并验证图表（带重试机制）
async function generateAndValidateDiagram(
  prompt: string,
  maxRetries = 2
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const code = await chat(DIAGRAM_SYSTEM_PROMPT, prompt, [], 'text');

    const validation = await validateMermaidCode(code);

    if (validation.valid) {
      return code;
    }

    // 如果是最后一次尝试，仍然返回代码（让前端处理错误）
    if (attempt === maxRetries) {
      return code;
    }
  }

  throw new Error('生成失败：超过最大重试次数');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求
    const result = GenerateDiagramsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: '请求参数错误', details: result.error },
        { status: 400 }
      );
    }

    const { sessionId } = result.data;

    // 获取当前会话和 PRD
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      );
    }

    const currentPRD = await getPRDBySession(sessionId);
    if (!currentPRD) {
      return NextResponse.json(
        { error: 'PRD 不存在，请先生成 PRD' },
        { status: 404 }
      );
    }

    // 解析当前 PRD 数据
    const prdData: PRDDocument = {
      title: currentPRD.title,
      description: currentPRD.description,
      background: currentPRD.background || undefined,
      targetUsers: safeJsonParse(currentPRD.targetUsers, { primary: [], secondary: [] }),
      painPoints: safeJsonParse(currentPRD.painPoints, []),
      coreValue: safeJsonParse(currentPRD.coreValue, []),
      features: safeJsonParse(currentPRD.features, []),
      successMetrics: safeJsonParse(currentPRD.successMetrics, []),
      techFeasibility: safeJsonParse(currentPRD.techFeasibility, undefined),
      competitors: safeJsonParse(currentPRD.competitors, []),
    };

    // 串行生成四个图表（带验证和重试机制）
    const architectureCode = await generateAndValidateDiagram(ARCHITECTURE_DIAGRAM_PROMPT(prdData));
    const journeyCode = await generateAndValidateDiagram(JOURNEY_DIAGRAM_PROMPT(prdData));
    const featuresCode = await generateAndValidateDiagram(FEATURES_DIAGRAM_PROMPT(prdData));
    const dataflowCode = await generateAndValidateDiagram(DATAFLOW_DIAGRAM_PROMPT(prdData));

    // 清理和修复返回的 Mermaid 代码
    const cleanCode = (code: string): string => {
      let cleaned = code
        // 移除 markdown 代码块标记
        .replace(/```mermaid\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // 修复常见的 AI 生成错误
      // 1. 移除可能的中文标点后的空行
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

      // 2. 修复不正确的 journey 格式（移除中文括号内容）
      cleaned = cleaned.replace(/\(([^)]+)\)\s*\n/g, '\n');

      // 3. 移除空行中的多余空格
      cleaned = cleaned.replace(/\n\s+\n/g, '\n');

      return cleaned;
    };

    const diagrams = {
      architecture: cleanCode(architectureCode),
      journey: cleanCode(journeyCode),
      features: cleanCode(featuresCode),
      dataflow: cleanCode(dataflowCode),
    };

    // 更新数据库中的 PRD（保存图表代码）
    await updatePRD(currentPRD.id, {
      mermaidArchitecture: diagrams.architecture,
      mermaidJourney: diagrams.journey,
      mermaidFeatures: diagrams.features,
      mermaidDataflow: diagrams.dataflow,
    });

    // 保存生成消息到对话历史
    await createMessage(
      sessionId,
      'assistant',
      `已生成可视化图表：系统架构图、用户旅程图、功能模块图、数据流图`
    );

    return NextResponse.json({
      success: true,
      data: {
        diagrams,
        message: '图表生成成功',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成图表失败',
      },
      { status: 500 }
    );
  }
}
