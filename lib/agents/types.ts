// 多 Agent 协作系统类型定义

import { PRDDocument } from '@/types/prd';

/**
 * Agent 执行状态
 */
export interface AgentExecutionState {
  agentId: string;
  agentName: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
  startTime?: number;
  endTime?: number;
  logs?: string[]; // 实时日志
}

/**
 * Agent 执行结果
 */
export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  tokensUsed?: number;
}

/**
 * 需求分析 Agent 输出
 */
export interface RequirementAnalysisOutput {
  // 需求完整性评分 (0-100)
  completenessScore: number;
  // 需求拆解
  decomposedRequirements: {
    functional: string[]; // 功能需求
    nonFunctional: string[]; // 非功能需求
    constraints: string[]; // 约束条件
  };
  // 识别的风险
  risks: {
    technical: string[];
    business: string[];
    market: string[];
  };
  // 建议的澄清问题
  suggestedQuestions: string[];
}

/**
 * 竞品分析 Agent 输出
 */
export interface CompetitorAnalysisOutput {
  competitors: Array<{
    name: string;
    category: 'direct' | 'indirect' | 'substitute';
    description: string;
    coreFeatures: string[];
    pricing: string;
    targetAudience: string;
    strengths: string[];
    weaknesses: string[];
    marketShare?: string;
  }>;
  // 市场机会
  marketOpportunities: string[];
  // 差异化建议
  differentiationSuggestions: string[];
  // 功能对比矩阵
  featureComparison: {
    features: string[];
    competitors: string[];
    matrix: boolean[][]; // [competitorIndex][featureIndex]
  };
}

/**
 * 市场研究 Agent 输出
 */
export interface MarketResearchOutput {
  // 市场规模
  marketSize: {
    tam: string; // Total Addressable Market
    sam: string; // Service Addressable Market
    som: string; // Service Obtainable Market
  };
  // 市场趋势
  trends: Array<{
    name: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    timeHorizon: 'short' | 'medium' | 'long';
  }>;
  // 目标用户细分
  userSegments: Array<{
    name: string;
    size: string;
    characteristics: string[];
    needs: string[];
    channels: string[];
  }>;
  // 行业基准
  industryBenchmarks: Array<{
    metric: string;
    benchmark: string;
    source?: string;
  }>;
}

/**
 * PRD 撰写 Agent 输入
 */
export interface PRDWriterInput {
  originalIdea: string;
  clarificationAnswers?: Array<{ question: string; answer: string }>;
  requirementAnalysis?: RequirementAnalysisOutput;
  competitorAnalysis?: CompetitorAnalysisOutput;
  marketResearch?: MarketResearchOutput;
}

/**
 * 质量审查 Agent 输出
 */
export interface QualityReviewOutput {
  // 整体评分 (0-100)
  overallScore: number;
  // 各维度评分
  dimensionScores: {
    clarity: number; // 清晰度
    completeness: number; // 完整性
    consistency: number; // 一致性
    testability: number; // 可测试性
    feasibility: number; // 可行性
  };
  // 发现的问题
  issues: Array<{
    severity: 'critical' | 'major' | 'minor';
    category: 'clarity' | 'completeness' | 'consistency' | 'feasibility';
    description: string;
    suggestion: string;
    location?: string; // 问题所在位置
  }>;
  // 改进建议
  improvementSuggestions: string[];
  // 是否需要迭代
  needsIteration: boolean;
}

/**
 * 多 Agent 工作流配置
 */
export interface MultiAgentWorkflowConfig {
  // 是否启用各 Agent
  enableRequirementAnalysis: boolean;
  enableCompetitorAnalysis: boolean;
  enableMarketResearch: boolean;
  enableQualityReview: boolean;
  // 最大迭代次数
  maxIterations: number;
  // 质量阈值（超过此值停止迭代）
  qualityThreshold: number;
  // 超时时间（秒）
  timeoutSeconds: number;
}

/**
 * 工作流执行进度
 */
export interface WorkflowProgress {
  currentStage: string;
  overallProgress: number; // 0-100
  agents: AgentExecutionState[];
  estimatedTimeRemaining?: number; // 秒
}

/**
 * 完整 PRD 生成结果
 */
export interface MultiAgentPRDResult {
  prd: PRDDocument;
  workflowSummary: {
    totalDuration: number;
    agentsExecuted: string[];
    iterations: number;
    finalQualityScore?: number;
    tokensUsed: number;
  };
  artifacts: {
    requirementAnalysis?: RequirementAnalysisOutput;
    competitorAnalysis?: CompetitorAnalysisOutput;
    marketResearch?: MarketResearchOutput;
    qualityReview?: QualityReviewOutput;
  };
}
