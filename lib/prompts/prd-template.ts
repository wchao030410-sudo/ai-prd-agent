// PRD 生成 Prompt 模板

export const SYSTEM_PROMPT = `你是一位专业的 AI 产品经理顾问，擅长将模糊的产品想法转化为结构化的产品需求文档（PRD）。

你的职责：
1. 深入理解用户的产品想法，提出澄清性问题
2. 生成结构化、可落地的 PRD 文档
3. 提供技术可行性评估
4. 帮助用户做功能优先级决策

你的输出格式：
- 始终使用 JSON 格式
- 保持专业、清晰、可操作
- 考虑实际开发限制和资源约束`;

export const PRD_GENERATION_PROMPT = (idea: string) => `请基于以下产品想法，生成完整的 PRD 文档：

产品想法：${idea}

请按照以下 JSON 结构输出：

{
  "title": "产品名称",
  "description": "一句话描述产品核心价值",
  "background": "产品背景、市场机会和解决的问题",
  "targetUsers": {
    "primary": ["主要用户画像1：年龄、职业、痛点"],
    "secondary": ["次要用户画像"]
  },
  "painPoints": ["用户痛点1", "用户痛点2"],
  "coreValue": ["核心价值主张1", "核心价值主张2"],
  "features": [
    {
      "id": "feature_1",
      "name": "功能名称",
      "description": "功能描述",
      "priority": "high",
      "effort": 3,
      "value": 4,
      "acceptanceCriteria": ["验收标准1", "验收标准2"]
    }
  ],
  "successMetrics": ["成功指标1", "成功指标2"],
  "techFeasibility": {
    "overall": "medium",
    "challenges": ["技术挑战1"],
    "recommendations": ["建议1"]
  },
  "competitors": [
    {
      "name": "竞品名称",
      "features": ["核心功能1", "核心功能2"],
      "differences": "差异化描述"
    }
  ]
}

要求：
1. title: 简洁有力，体现产品定位
2. description: 一句话说明产品是什么，为谁解决什么问题
3. background: 说明市场背景、用户需求和机会
4. targetUsers: 具体的用户画像，包括年龄、职业、使用场景、痛点
5. painPoints: 列出 3-5 个用户痛点
6. coreValue: 列出 3-5 个核心价值主张
7. features: 列出 6-10 个核心功能
   - priority: high/medium/low
   - effort: 1-5（开发难度）
   - value: 1-5（用户价值）
   - acceptanceCriteria: 2-3 条可测试的验收标准
8. successMetrics: 3-5 个可衡量的成功指标
9. techFeasibility:
   - overall: easy/medium/hard
   - challenges: 2-3 个主要技术挑战
   - recommendations: 2-3 条技术建议
10. competitors: 2-3 个竞品，每个包含核心功能和差异化

请确保 JSON 格式正确，可以直接被解析。`;

export const PRD_REFINE_PROMPT = (currentPRD: string, feedback: string) => `用户对当前的 PRD 提出了以下反馈：

${feedback}

当前 PRD：
${currentPRD}

请根据反馈优化 PRD，保持相同的 JSON 结构。只返回更新后的完整 JSON，不要包含其他说明。`;
