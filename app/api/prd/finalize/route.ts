import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai';
import { getPRDBySession, updatePRD, createMessage, getSession } from '@/lib/db';
import { PRDDocument } from '@/types/prd';
import { z } from 'zod';
import { safeJsonParse } from '@/lib/utils';

// 最终 PRD 生成请求验证 schema
const FinalizePRDSchema = z.object({
  sessionId: z.string().min(1, '会话 ID 不能为空'),
});

const FINALIZE_SYSTEM_PROMPT = `你是一个专业的技术文档撰写专家，负责将 PRD 初稿和可视化图表整合成完整可交付的产品需求文档。

你的任务：
1. 整合 PRD 的所有内容
2. 补充技术细节（技术架构、API 设计原则、数据模型概念）
3. 补充项目规划（任务分解、里程碑）
4. 将 Mermaid 图表嵌入到对应的章节中，而不是放在最后
5. 生成完整的 Markdown 格式文档

文档格式要求：
- 使用 Markdown 标准格式
- 结构清晰，层次分明
- 图表使用 \`\`\`mermaid 代码块包裹
- 图表必须嵌入到对应的内容章节中，与相关文字说明配合使用
- 不要包含单独的"目录"章节，文档元信息之后直接开始内容

重要约束：
- 严禁在文档中包含任何代码实现细节、代码示例或编程语言语法
- 技术架构部分描述系统组成和交互方式，使用自然语言和图表
- API 设计部分描述接口规范和数据格式，使用伪代码或表格形式，不要使用真实代码
- 数据模型部分描述实体关系和字段含义，使用文字说明或表格
- 所有内容以产品经理和技术架构师的语言撰写，而非开发人员
- Mermaid 图表必须放在相关章节内部，作为文字说明的补充
`;

const FINALIZE_PROMPT = (prd: PRDDocument, diagrams: { architecture?: string; journey?: string; features?: string; dataflow?: string }): string => `
# 任务

将以下 PRD 整合成完整可交付的 Markdown 文档。

# PRD 内容

## 基本信息
- **标题**：${prd.title}
- **描述**：${prd.description}
${prd.background ? `- **背景**：${prd.background}` : ''}

## 目标用户
**主要用户**：
${(prd.targetUsers.primary || []).map(u => `- ${u}`).join('\n')}
${prd.targetUsers.secondary && prd.targetUsers.secondary.length > 0 ? `
**次要用户**：
${(prd.targetUsers.secondary || []).map(u => `- ${u}`).join('\n')}
` : ''}

## 用户痛点
${(prd.painPoints || []).map(p => `- ${p}`).join('\n') || '无'}

## 核心价值
${(prd.coreValue || []).map(v => `- ${v}`).join('\n') || '无'}

## 功能列表
${(prd.features || []).map(f => `
### ${f.name}（优先级：${f.priority}，工作量：${f.effort}/5，价值：${f.value}/5）
${f.description}

**验收标准**：
${(f.acceptanceCriteria || []).map(c => `- ${c}`).join('\n')}
`).join('\n')}

## 成功指标
${(prd.successMetrics || []).map(m => `- ${m}`).join('\n') || '无'}

## 技术可行性
**整体评估**：${prd.techFeasibility?.overall || '未知'}

**技术挑战**：
${(prd.techFeasibility?.challenges || []).map(c => `- ${c}`).join('\n') || '无'}

**技术建议**：
${(prd.techFeasibility?.recommendations || []).map(r => `- ${r}`).join('\n') || '无'}

## 竞品分析
${(prd.competitors || []).map(c => `
### ${c.name}
**功能**：${(c.features || []).join('、')}
**差异**：${c.differences || '无差异说明'}
`).join('\n') || '无'}

# Mermaid 图表（必须嵌入到对应章节中）

## 系统架构图（嵌入到"技术方案"章节）
\`\`\`mermaid
${diagrams.architecture || '# 无架构图'}
\`\`\`

## 用户旅程图（嵌入到"用户分析"章节）
\`\`\`mermaid
${diagrams.journey || '# 无用户旅程图'}
\`\`\`

## 功能模块图（嵌入到"功能规划"章节）
\`\`\`mermaid
${diagrams.features || '# 无功能模块图'}
\`\`\`

## 数据流图（嵌入到"技术方案"章节）
\`\`\`mermaid
${diagrams.dataflow || '# 无数据流图'}
\`\`\`

# 输出要求

请生成完整的 Markdown 文档，包含以下章节（不要包含目录）：

1. **文档元信息**（标题、版本、日期）- 文档开头，简洁明了
2. **产品背景**（背景、市场机会、解决的问题）- 直接开始正文内容
3. **用户分析**（目标用户、用户画像、痛点、**用户旅程图**）
4. **功能规划**（功能列表、优先级排序、验收标准、**功能模块图**）
5. **成功指标**（KPI、衡量方式）
6. **技术方案**（架构设计、**系统架构图**、**数据流图**、技术栈、API 设计原则、数据模型概念）
7. **项目规划**（开发阶段、里程碑、资源需求）
8. **风险评估**（技术风险、市场风险、应对策略）
9. **附录**（术语表、参考资料）

**关键要求：**
- **不要生成目录**：文档元信息之后直接是产品背景
- **图表必须嵌入对应章节**：
  - 用户旅程图 → 放在"用户分析"章节内，配合用户旅程的文字说明
  - 功能模块图 → 放在"功能规划"章节内，配合功能划分的文字说明
  - 系统架构图 → 放在"技术方案"章节内，配合架构说明文字
  - 数据流图 → 放在"技术方案"章节内，配合数据流说明文字
- **图表与文字配合**：每个图表前后都要有相关的文字说明，解释图表的内容和意义
- **严禁包含任何代码实现细节**
- **只返回 Markdown 内容**
- **保持专业文档风格**
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求
    const result = FinalizePRDSchema.safeParse(body);
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
        { error: 'PRD 不存在' },
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

    // 获取图表
    const diagrams = {
      architecture: currentPRD.mermaidArchitecture || undefined,
      journey: currentPRD.mermaidJourney || undefined,
      features: currentPRD.mermaidFeatures || undefined,
      dataflow: currentPRD.mermaidDataflow || undefined,
    };

    // 生成最终 PRD
    const prompt = FINALIZE_PROMPT(prdData, diagrams);
    const finalContent = await chat(FINALIZE_SYSTEM_PROMPT, prompt, [], 'text');

    // 更新数据库中的 PRD
    await updatePRD(currentPRD.id, {
      isFinal: true,
      finalContent,
    });

    // 保存生成消息到对话历史
    await createMessage(
      sessionId,
      'assistant',
      `已生成完整可交付 PRD 文档，包含 ${Object.values(diagrams).filter(Boolean).length} 个可视化图表`
    );

    return NextResponse.json({
      success: true,
      data: {
        markdown: finalContent,
        message: '完整 PRD 已生成',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成最终 PRD 失败',
      },
      { status: 500 }
    );
  }
}
