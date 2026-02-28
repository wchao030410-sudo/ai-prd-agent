// 改进的 PRD 撰写提示词 - 强制使用前序 Agent 输出
export const PRD_WRITER_SYSTEM_PROMPT = `你是一位经验丰富的产品文档专家，擅长撰写专业、清晰、可落地的 PRD 文档。

你的核心职责：
1. 严格基于需求分析结果生成功能列表
2. 充分参考竞品分析的差异化建议
3. 确保文档各部分逻辑自洽
4. 验收标准必须具体可测试

【重要】你必须使用所有提供的上下文信息，不能只依赖用户原始想法！`;

export const PRD_WRITER_WITH_ANALYSIS_PROMPT = (input: {
  idea: string;
  clarifications?: Array<{ question: string; answer: string }>;
  requirementAnalysis?: any;
  competitorAnalysis?: any;
}) => {
  const clarificationText = input.clarifications?.length
    ? `\n【用户澄清回答】\n${input.clarifications.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n\n')}`
    : '';

  const requirementSection = input.requirementAnalysis
    ? `
【需求分析结果 - 必须使用】
- 完整性评分: ${input.requirementAnalysis.completenessScore}/100
- 功能需求: ${input.requirementAnalysis.decomposedRequirements?.functional?.join(', ') || '无'}
- 非功能需求: ${input.requirementAnalysis.decomposedRequirements?.nonFunctional?.join(', ') || '无'}
- 识别的风险: ${input.requirementAnalysis.risks?.technical?.join(', ') || '无'}
- 建议问题: ${input.requirementAnalysis.suggestedQuestions?.join(', ') || '无'}
`
    : '';

  const competitorSection = input.competitorAnalysis
    ? `
【竞品分析结果 - 必须参考】
- 竞品列表:
${input.competitorAnalysis.competitors?.map((c: any) => `  * ${c.name}: ${c.coreFeatures?.join(', ') || '核心功能未知'}, 优势: ${c.strengths?.join(', ') || '无'}, 劣势: ${c.weaknesses?.join(', ') || '无'}`).join('\n') || '无'}
- 差异化建议: ${input.competitorAnalysis.differentiationSuggestions?.join('; ') || '无'}
- 市场机会: ${input.competitorAnalysis.marketOpportunities?.join('; ') || '无'}
`
    : '';

  return `【用户原始想法】
${input.idea}${clarificationText}
${requirementSection}
${competitorSection}

【任务要求】
请严格基于上述"需求分析结果"和"竞品分析结果"撰写 PRD 文档。

特别注意：
1. 功能列表必须来自"功能需求"的拆解，不能随意添加
2. 差异化定位必须参考"差异化建议"
3. 验收标准必须具体、可测试
4. 技术评估要结合"识别的风险"

请按以下 JSON 结构输出：
{
  "title": "产品名称（简洁有力）",
  "description": "一句话描述产品核心价值",
  "background": "产品背景（参考需求分析中的背景）",
  "targetUsers": {
    "primary": ["主要用户画像"],
    "secondary": ["次要用户画像"]
  },
  "painPoints": ["用户痛点（来自需求分析）"],
  "coreValue": ["核心价值主张"],
  "features": [
    {
      "id": "feature_1",
      "name": "功能名称",
      "description": "功能描述（清晰具体）",
      "priority": "high|medium|low",
      "effort": 1-5,
      "value": 1-5,
      "acceptanceCriteria": ["验收标准1（可测试）", "验收标准2"]
    }
  ],
  "successMetrics": ["成功指标（参考需求分析）"],
  "techFeasibility": {
    "overall": "easy|medium|hard",
    "challenges": ["技术挑战（参考识别的风险）"],
    "recommendations": ["建议"]
  },
  "competitors": [
    {
      "name": "竞品名称",
      "features": ["核心功能"],
      "differences": "差异化描述（参考竞品分析）"
    }
  ]
}`;
};

// PRD 优化 Agent 提示词 - 基于质量审查反馈
export const PRD_REFINER_PROMPT = (input: {
  currentPRD: any;
  reviewFeedback: any;
}) => `【当前 PRD 文档】
${JSON.stringify(input.currentPRD, null, 2)}

【质量审查反馈】
- 整体评分: ${input.reviewFeedback.overallScore}/100
- 各维度评分: ${JSON.stringify(input.reviewFeedback.dimensionScores)}
- 发现的问题: ${JSON.stringify(input.reviewFeedback.issues)}
- 改进建议: ${input.reviewFeedback.improvementSuggestions?.join('; ')}

【任务要求】
请根据上述质量审查反馈，优化 PRD 文档。重点：
1. 修复 critical 和 major 问题
2. 按照改进建议完善文档
3. 确保修改后逻辑自洽

请输出优化后的完整 JSON（保持相同结构）`;