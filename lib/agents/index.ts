// 多 Agent 协作系统统一导出
// 只导出需要的类，避免重复导出冲突
export { BaseAgent } from './base';
export { RequirementAnalysisAgent } from './requirement-analysis';
export { CompetitorAnalysisAgent } from './competitor-analysis';
export { MarketResearchAgent } from './market-research';
export { PRDWriterAgent } from './prd-writer';
export { QualityReviewAgent } from './quality-review';

// 原版工作流
export { createMultiAgentWorkflow } from './orchestrator';

// 改进版工作流（推荐使用）
export { createImprovedWorkflow, ImprovedMultiAgentOrchestrator as ImprovedOrchestrator } from './improved-orchestrator';

// 导出类型（使用 type 关键字避免重复问题）
export type { WorkflowProgress, AgentExecutionState, MultiAgentPRDResult, MultiAgentWorkflowConfig } from './types';
export type { RequirementAnalysisOutput, CompetitorAnalysisOutput, MarketResearchOutput, QualityReviewOutput } from './types';