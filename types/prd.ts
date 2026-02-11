// PRD 文档类型定义

export interface PRDDocument {
  title: string;
  description: string;
  background?: string;
  targetUsers: {
    primary: string[];
    secondary: string[];
  };
  painPoints?: string[];
  coreValue?: string[];
  features: PRDFeature[];
  successMetrics?: string[];
  techFeasibility?: TechFeasibility;
  competitors?: Competitor[];
}

export interface PRDFeature {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: number; // 1-5
  value: number; // 1-5
  acceptanceCriteria: string[];
}

export interface TechFeasibility {
  overall: 'easy' | 'medium' | 'hard';
  challenges: string[];
  recommendations: string[];
}

export interface Competitor {
  name: string;
  features: string[];
  differences: string;
}

export interface UserStory {
  id: string;
  asA: string; // 用户角色
  iWant: string; // 功能描述
  soThat: string; // 价值/目的
  acceptanceCriteria: string[];
}

export interface PriorityItem {
  featureId: string;
  reach: number; // 覆盖用户数量 (1-10)
  impact: number; // 对用户的影响程度 (1-10)
  confidence: number; // 信心程度 (1-10)
  effort: number; // 开发工作量 (1-10)
  riceScore?: number; // (R × I × C) / E
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Session {
  id: string;
  title: string;
  prdId?: string;
  currentStep?: number;  // 当前在第几步 (1/2/3)
  createdAt: Date;
  updatedAt: Date;
}

// Mermaid 图表类型
export interface Diagrams {
  architecture?: string;  // 系统架构图代码
  journey?: string;       // 用户旅程图代码
  features?: string;      // 功能模块图代码
  dataflow?: string;      // 数据流图代码
}

// 编辑指令类型
export interface EditInstruction {
  instruction: string;
  targetField?: string;  // 可选：指定修改的字段
}

// 最终 PRD 类型
export interface FinalPRD {
  markdown: string;      // 完整 Markdown 内容
  diagrams: Diagrams;
  generatedAt: Date;
}

// 导出格式类型
export type ExportFormat = 'pdf' | 'md' | 'docx';

// 工作流步骤类型
export interface WorkflowStep {
  step: 1 | 2 | 3;
  status: 'pending' | 'in_progress' | 'completed';
}
