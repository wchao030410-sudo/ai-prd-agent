// PRD 编辑 Prompt

import { PRDDocument } from '@/types/prd';

/**
 * PRD 编辑系统 Prompt
 */
export const PRD_EDIT_SYSTEM_PROMPT = `你是一个专业的 PRD（产品需求文档）编辑助手。你的任务是理解用户的修改指令，并精确地更新 PRD 的对应字段。

核心原则：
1. 只修改用户明确要求修改的字段
2. 保持其他字段完全不变
3. 确保修改后的内容专业、准确、完整

## JSON 格式要求（非常重要）

你必须严格遵守以下 JSON 格式要求：
1. 整个响应必须是一个有效的 JSON 对象
2. 不要在 JSON 前后添加任何文字说明
3. 不要使用 markdown 代码块（如 \`\`\`json）
4. 直接返回纯 JSON 对象，不要有任何额外内容
5. 确保所有字符串正确转义（中文使用原字符，不要转义）
6. 数组和对象必须完整

正确示例：
{"title":"产品名称","description":"产品描述","targetUsers":{"primary":["用户1"],"secondary":["用户2"]}}

错误示例（绝对禁止）：
\`\`\`json
{"title":"产品名称"}
\`\`\`
或者使用任何 markdown 包装

输出要求：
- 只返回更新后的完整 PRD（JSON 格式）
- 严禁使用 markdown 代码块
- 严禁添加任何额外说明文字
- 确保 JSON 结构完整且有效
`;

/**
 * PRD 编辑 Prompt
 */
export const PRD_EDIT_PROMPT = (
  currentPRD: PRDDocument,
  instruction: string,
  targetField?: string
): string => {
  let prompt = `# 当前 PRD 内容

\`\`\`json
${JSON.stringify(currentPRD, null, 2)}
\`\`\`

# 用户修改指令

${instruction}

`;

  if (targetField) {
    prompt += `
# 目标字段

用户指定要修改的字段：${targetField}

请只更新该字段，其他字段保持完全不变。
`;
  }

  prompt += `
# 输出要求

请返回更新后的完整 PRD（JSON 格式），注意：
1. 只修改相关字段，其他字段保持原样
2. 保持原有的数据结构和类型
3. 确保是有效的 JSON 格式
4. 不要添加任何解释性文字，只返回 JSON
`;

  return prompt;
};

/**
 * PRD 字段编辑 Prompt（用于编辑特定字段）
 */
export const PRD_FIELD_EDIT_PROMPTS = {
  // 编辑标题和描述
  title: (instruction: string): string => `
请根据用户指令修改 PRD 的标题和描述。

用户指令：${instruction}

请返回更新后的 title 和 description 字段，保持 JSON 格式。
`,

  // 编辑目标用户
  targetUsers: (instruction: string): string => `
请根据用户指令修改 PRD 的目标用户（targetUsers）。

当前格式：
{
  "primary": ["主要用户群体1", "主要用户群体2"],
  "secondary": ["次要用户群体1"]
}

用户指令：${instruction}

请返回更新后的 targetUsers 字段，保持 JSON 格式。
`,

  // 编辑痛点
  painPoints: (instruction: string): string => `
请根据用户指令修改 PRD 的用户痛点（painPoints）。

用户指令：${instruction}

请返回更新后的 painPoints 数组，保持 JSON 格式。
`,

  // 编辑核心价值
  coreValue: (instruction: string): string => `
请根据用户指令修改 PRD 的核心价值（coreValue）。

用户指令：${instruction}

请返回更新后的 coreValue 数组，保持 JSON 格式。
`,

  // 编辑功能列表
  features: (instruction: string): string => `
请根据用户指令修改 PRD 的功能列表（features）。

当前格式：
[
  {
    "id": "feature-1",
    "name": "功能名称",
    "description": "功能描述",
    "priority": "high|medium|low",
    "effort": 1-5,
    "value": 1-5,
    "acceptanceCriteria": ["验收标准1", "验收标准2"]
  }
]

用户指令：${instruction}

请返回更新后的 features 数组，保持 JSON 格式。
`,

  // 编辑成功指标
  successMetrics: (instruction: string): string => `
请根据用户指令修改 PRD 的成功指标（successMetrics）。

用户指令：${instruction}

请返回更新后的 successMetrics 数组，保持 JSON 格式。
`,

  // 编辑技术可行性
  techFeasibility: (instruction: string): string => `
请根据用户指令修改 PRD 的技术可行性评估（techFeasibility）。

当前格式：
{
  "overall": "easy|medium|hard",
  "challenges": ["挑战1", "挑战2"],
  "recommendations": ["建议1", "建议2"]
}

用户指令：${instruction}

请返回更新后的 techFeasibility 对象，保持 JSON 格式。
`,

  // 编辑竞品分析
  competitors: (instruction: string): string => `
请根据用户指令修改 PRD 的竞品分析（competitors）。

当前格式：
[
  {
    "name": "竞品名称",
    "features": ["功能1", "功能2"],
    "differences": "与我们的差异"
  }
]

用户指令：${instruction}

请返回更新后的 competitors 数组，保持 JSON 格式。
`,
};
