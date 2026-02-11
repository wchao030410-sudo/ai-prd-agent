// Mermaid 图表生成 Prompts

import { PRDDocument } from '@/types/prd';

/**
 * 系统架构图生成 Prompt
 */
export const ARCHITECTURE_DIAGRAM_PROMPT = (prd: PRDDocument): string => `
# 任务

基于以下 PRD，生成系统架构图（Mermaid graph TD 格式）。

# PRD 内容

**产品名称**：${prd.title}
**产品描述**：${prd.description}

**核心功能**：
${prd.features.map(f => `- ${f.name}: ${f.description}`).join('\n')}

**技术难度**：${prd.techFeasibility?.overall || '未知'}

# 要求

1. 使用 Mermaid graph TD 格式（从上到下的流程图）
2. 包含以下层次：
   - 前端层（用户界面）
   - 后端层（API 服务）
   - 数据层（数据库、缓存）
   - 外部服务（如需要）
3. 标注技术栈建议：
   - 前端：React/Next.js
   - 后端：Node.js/Next.js API Routes
   - 数据库：SQLite/PostgreSQL
   - 其他：根据功能需求添加
4. 展示数据流向（使用箭头连接）
5. 使用清晰的中文标注

# 语法约束（必须遵守，否则图表无法渲染）

- 每个节点定义必须独占一行
- 节点文本必须简洁（不超过8个字符），使用数字编号或缩写
- 正确格式：A[用户] 或 B[前端] 或 C[(数据库)]
- 箭头格式：A --> B 或 A -->|数据| B
- 不要使用 HTML 标签（如 <br/>、<div> 等）
- 节点文本中不要使用括号、引号等特殊字符
- 复杂内容用多个节点表示，不要在一个节点里堆砌

## 错误示例（不要这样生成）

❌ 错误1：节点文本过长且包含技术栈细节
graph TD A[用户] --> B[前端界面 React Next.js]

✓ 正确1：节点文本简洁，技术栈另注
graph TD
    A[用户] --> B[前端界面]
    B[React/Next.js] --> C[后端API]

❌ 错误2：在一行中定义多个节点
graph TD A[用户] --> B[前端] --> C[API] --> D[(DB)]

✓ 正确2：每个节点独占一行
graph TD
    A[用户] --> B[前端]
    B --> C[API]
    C --> D[(数据库)]

❌ 错误3：箭头标签过长
graph TD A[用户] -->|用户提交的数据包含表单| B[验证]

✓ 正确3：箭头标签简短
graph TD
    A[用户] -->|提交| B[验证]

# 输出格式

只返回 Mermaid 代码，不要其他内容。

正确示例：
\`\`\`mermaid
graph TD
    A[用户] --> B[前端界面]
    B --> C[API服务]
    C --> D[(数据库)]
    C --> E[AI服务]
\`\`\`
`;

/**
 * 用户旅程图生成 Prompt
 */
export const JOURNEY_DIAGRAM_PROMPT = (prd: PRDDocument): string => `
# 任务

基于以下 PRD，生成用户旅程图（Mermaid journey 格式）。

# PRD 内容

**产品名称**：${prd.title}
**产品描述**：${prd.description}

**目标用户**：
- 主要用户：${prd.targetUsers.primary.join('、')}
${prd.targetUsers.secondary.length ? `- 次要用户：${prd.targetUsers.secondary.join('、')}` : ''}

**用户痛点**：
${prd.painPoints?.map(p => `- ${p}`).join('\n') || '无'}

**核心功能**：
${prd.features.slice(0, 5).map(f => `- ${f.name}`).join('\n')}

# 要求

1. 使用 Mermaid journey 格式
2. 展示典型用户使用产品的完整流程
3. 包含 4-6 个关键步骤
4. 标注每个步骤的情感指数（0-5，5 为非常满意）
5. 使用清晰的中文描述

# 语法约束（必须遵守，否则图表无法渲染）

- 每个步骤定义必须独占一行
- 步骤名称保持简洁（不超过10个字符）
- 格式：步骤名: 分数: 角色
- 不要使用 HTML 标签（如 <br/>、<div> 等）
- section 标题不超过8个字符
- 避免使用特殊符号和长句

# 输出格式

只返回 Mermaid 代码，不要其他内容。

示例格式：
\`\`\`mermaid
journey
    title 用户使用流程
    section 注册登录
      访问网站: 4: 用户
      创建账户: 3: 用户
    section 核心功能
      使用功能A: 5: 用户
      查看结果: 5: 用户
\`\`\`
`;

/**
 * 功能模块图生成 Prompt
 */
export const FEATURES_DIAGRAM_PROMPT = (prd: PRDDocument): string => `
# 任务

基于以下 PRD，生成功能模块图（Mermaid graph LR 格式）。

# PRD 内容

**产品名称**：${prd.title}
**产品描述**：${prd.description}

**核心功能列表**：
${prd.features.map(f => `- **${f.name}**（优先级：${f.priority}）：${f.description}`).join('\n')}

# 要求

1. 使用 Mermaid graph LR（从左到右）格式，不要使用 mindmap
2. 展示功能的模块化结构
3. 可以按功能优先级或功能类型分组
4. 高优先级功能使用更醒目的位置
5. 使用清晰的中文标注

# 语法约束（必须遵守，否则图表无法渲染）

- 每个节点定义必须独占一行
- 节点文本必须简洁（不超过6个字符）
- 正确格式：A[产品] 或 B[功能A]
- 箭头格式：A --> B 或 A -->|包含| B
- 不要使用 mindmap 语法，只用 graph LR
- 不要使用 HTML 标签（如 <br/>、<div> 等）
- 功能名称过长时使用缩写或编号
- 使用数字编号：F1[功能1] F2[功能2] F3[功能3]

## 错误示例（不要这样生成）

❌ 错误1：在一行中堆砌多个节点
graph LR A[产品] --> B[功能1] C[功能2] D[功能3]

✓ 正确1：每个节点独占一行
graph LR
    A[产品] --> B[功能1]
    A --> C[功能2]
    A --> D[功能3]

❌ 错误2：使用中文括号说明
graph LR A[产品] --> B(高优先级功能) C[功能A]

✓ 正确2：直接连接，不用括号
graph LR
    A[产品] --> B[核心功能]
    B --> C[功能A]

❌ 错误3：节点文本过长
graph LR A[产品] --> B[用户管理与认证系统]

✓ 正确3：使用简洁的文本
graph LR
    A[产品] --> B[用户管理]
    B --> C[认证]

# 输出格式

只返回 Mermaid 代码，不要其他内容。

正确示例：
\`\`\`mermaid
graph LR
    A[产品] --> B[用户管理]
    A --> C[核心功能]
    A --> D[数据分析]
    C --> C1[功能A]
    C --> C2[功能B]
\`\`\`
`;

/**
 * 数据流图生成 Prompt
 */
export const DATAFLOW_DIAGRAM_PROMPT = (prd: PRDDocument): string => `
# 任务

基于以下 PRD，生成数据流图（Mermaid graph TD 格式）。

# PRD 内容

**产品名称**：${prd.title}
**产品描述**：${prd.description}

**核心功能**：
${prd.features.map(f => `- ${f.name}: ${f.description}`).join('\n')}

**技术难度**：${prd.techFeasibility?.overall || '未知'}

# 要求

1. 使用 Mermaid graph TD 格式
2. 重点展示数据的流动过程：
   - 用户输入数据从哪里开始
   - 数据如何在系统各组件间传递
   - 数据如何被处理和转换
   - 数据最终如何存储或展示
3. 标注关键数据类型和格式
4. 展示数据验证、过滤、转换等处理步骤
5. 使用清晰的中文标注

# 语法约束（必须遵守，否则图表无法渲染）

- 每个节点定义必须独占一行
- 节点文本必须简洁（不超过6个字符）
- 正确格式：A[输入] 或 B[验证] 或 C[(数据库)]
- 箭头格式：A --> B 或 A -->|数据| B
- 箭头标签必须简短（不超过4个字符）
- 不要使用 HTML 标签（如 <br/>、<div> 等）
- 复杂流程拆分成多个节点

## 错误示例（不要这样生成）

❌ 错误1：节点文本过长
graph TD A[用户界面] -->|用户输入数据包含各种格式| B[数据验证]

✓ 正确1：拆分长文本
graph TD
    A[用户界面] -->|输入| B[数据验证]
    B -->|验证| C[处理]

❌ 错误2：箭头标签过长
graph TD A[输入] -->|用户提交的表单数据| B[验证]

✓ 正确2：箭头标签简短
graph TD
    A[输入] -->|提交| B[验证]

❌ 错误3：描述信息放在节点中
graph TD A[用户输入步骤] --> B[数据验证和清洗]

✓ 正确3：节点只有动作名称
graph TD
    A[用户输入] --> B[数据验证]
    B --> C[数据清洗]

# 输出格式

只返回 Mermaid 代码，不要其他内容。

正确示例：
\`\`\`mermaid
graph TD
    A[用户输入] -->|提交| B[数据验证]
    B -->|通过| C[数据处理]
    B -->|失败| D[错误提示]
    C -->|保存| E[(数据库)]
    C -->|返回| F[展示]
\`\`\`
`;

/**
 * 图表编辑 Prompt（用于修改现有图表）
 */
export const DIAGRAM_EDIT_PROMPT = (
  diagramType: 'architecture' | 'journey' | 'features' | 'dataflow',
  currentCode: string,
  instruction: string
): string => {
  const diagramNames = {
    architecture: '系统架构图',
    journey: '用户旅程图',
    features: '功能模块图',
    dataflow: '数据流图',
  };

  return `
# 任务

用户要求修改${diagramNames[diagramType]}，请根据指令修改 Mermaid 代码。

# 当前图表代码

\`\`\`
${currentCode}
\`\`\`

# 用户修改指令

${instruction}

# 要求

1. 保持 Mermaid 语法正确
2. 不要使用 HTML 标签（如 <br/>）
3. 节点文本保持简洁，不使用换行
4. 只返回修改后的 Mermaid 代码
5. 不要添加任何解释性文字
`;
};
