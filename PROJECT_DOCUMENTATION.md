# AI PRD Agent 完整项目文档

> 一个基于人工智能的产品需求文档（PRD）生成工具，帮助产品经理和创业者快速将产品想法转化为专业、结构化的 PRD 文档。

---

## 目录

1. [项目概述](#1-项目概述)
2. [核心特性](#2-核心特性)
3. [技术架构](#3-技术架构)
4. [数据模型](#4-数据模型)
5. [功能详解](#5-功能详解)
6. [API 接口文档](#6-api-接口文档)
7. [开发指南](#7-开发指南)
8. [部署说明](#8-部署说明)
9. [配置管理](#9-配置管理)
10. [组件说明](#10-组件说明)
11. [数据流与状态管理](#11-数据流与状态管理)
12. [性能优化](#12-性能优化)
13. [安全考虑](#13-安全考虑)
14. [故障排查](#14-故障排查)
15. [版本历史](#15-版本历史)

---

## 1. 项目概述

### 1.1 产品定位

**AI PRD Agent** 是一款智能化的产品需求文档生成工具，通过集成智谱 AI 的大语言模型能力，帮助用户将模糊的产品想法快速转化为结构化、可落地的专业 PRD 文档。

### 1.2 核心价值

| 维度 | 传统方式 | AI PRD Agent | 提升幅度 |
|------|---------|-------------|---------|
| **文档生成时间** | 2-8 小时 | 10-15 分钟 | **80-90%** |
| **竞品调研** | 4-16 小时 | 2-5 分钟 | **90%** |
| **技术评估** | 1-3 天 | 实时完成 | **95%** |
| **文档质量** | 依赖个人水平 | 专业模板 + AI | **一致性提升** |

### 1.3 目标用户

- **初级产品经理**：快速生成专业 PRD，减少跨部门沟通时间
- **创业者/产品负责人**：获得专业的产品文档支撑，增强团队沟通效率
- **自由产品顾问**：通过 AI 能力提升交付效率，扩大服务客户范围
- **高校产品设计专业学生**：学习 PRD 撰写规范，获得专业指导

### 1.4 项目状态

- **当前版本**: v1.0.0
- **部署状态**: 已正式上线
- **技术栈**: Next.js 16 + React 19 + Prisma + PostgreSQL + 智谱 AI
- **部署平台**: Vercel + Neon PostgreSQL

---

## 2. 核心特性

### 2.1 三步式 PRD 生成工作流

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Step 1     │  →   │  Step 2     │  →   │  Step 3     │
│  PRD 初稿   │      │  可视化图表 │      │  完整文档   │
└─────────────┘      └─────────────┘      └─────────────┘
     ↓                    ↓                    ↓
 智能生成 + 编辑        Mermaid 图表生成       导出 PDF/MD
 技术评估             系统架构图             完整可交付文档
 竞品分析             用户旅程图
 功能列表             功能模块图
                     数据流图
```

### 2.2 功能清单

#### 2.2.1 已实现功能 (MVP)

| 功能 | 状态 | 说明 |
|------|------|------|
| PRD 智能生成 | ✅ | 基于 GLM-4.6 模型生成完整 PRD |
| 会话历史管理 | ✅ | 支持多会话切换、历史记录管理 |
| 在线编辑功能 | ✅ | 实时编辑 PRD 各个章节 |
| Mermaid 图表生成 | ✅ | 自动生成系统架构、用户旅程等四种图表 |
| 完整文档导出 | ✅ | 支持 Markdown 和 PDF 格式导出 |
| 管理后台 | ✅ | JWT 认证的管理面板，统计数据查看 |
| 用户行为分析 | ✅ | 匿名用户追踪、页面访问统计 |
| 健康检查 API | ✅ | 部署健康状态监控 |

#### 2.2.2 计划功能 (V1.1)

| 功能 | 状态 | 优先级 |
|------|------|--------|
| PRD 对比功能 | 🚧 | P2 |
| 搜索和过滤 | 🚧 | P3 |
| 多模态输入 | 📝 | P3 |
| 团队协作功能 | 📝 | P3 |
| 模板库 | 📝 | P3 |

### 2.3 AI 能力

- **模型**: 智谱 AI GLM-4.6v (可配置)
- **响应模式**: JSON 强制输出，确保结构化数据
- **流式支持**: 支持流式响应（预留接口）
- **重试机制**: API 调用失败自动重试

---

## 3. 技术架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端层 (Frontend)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   UI 组件    │  │  状态管理    │  │  工具函数    │              │
│  │ shadcn/ui   │  │ React Hooks │  │   Utils     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      应用层 (Application Layer)                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Next.js App Router                      │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │  │
│  │  │  Pages  │  │API Routes│ │Middleware│ │ Layouts │      │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                       业务层 (Business Layer)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   AI 集成    │  │  数据验证    │  │  业务逻辑    │              │
│  │   lib/ai    │  │    Zod      │  │lib/prompts  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                       数据层 (Data Layer)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Prisma ORM                           │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │  │
│  │  │ Session │  │ Message │  │   PRD   │  │Analysis │      │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Neon PostgreSQL (生产环境)                    │  │
│  │              SQLite (开发环境)                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                     外部服务 (External Services)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  智谱 AI    │  │ Vercel     │  │ Vercel      │              │
│  │  GLM-4.6v   │  │ Analytics  │  │ Postgres    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 技术栈详情

#### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.6 | React 全栈框架 |
| React | 19.2.3 | UI 库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| shadcn/ui | latest | UI 组件库 |
| Lucide React | 0.563.0 | 图标库 |
| React Markdown | 10.1.0 | Markdown 渲染 |
| Mermaid | 11.12.2 | 图表渲染 |

#### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 16.1.6 | API 框架 |
| Prisma | 5.22.0 | ORM |
| Zod | 4.3.6 | 数据验证 |
| Jose | 6.1.3 | JWT 认证 |
| bcrypt | 6.0.0 | 密码加密 |

#### 数据库

| 环境 | 数据库 | 说明 |
|------|--------|------|
| 开发 | SQLite | 本地文件数据库 |
| 生产 | Neon PostgreSQL | 托管 PostgreSQL 服务 |

#### 外部服务

| 服务 | 用途 |
|------|------|
| 智谱 AI GLM-4.6v | PRD 内容生成 |
| Vercel | 应用部署托管 |
| Vercel Postgres | 生产数据库 |
| Vercel Analytics | 用户行为分析 |

### 3.3 目录结构

```
ai-prd-agent/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── admin/                # 管理后台 API
│   │   │   ├── login/            # 管理员登录
│   │   │   ├── logout/           # 管理员登出
│   │   │   └── stats/            # 统计数据
│   │   ├── prd/                  # PRD 相关 API
│   │   │   ├── generate/         # 生成 PRD
│   │   │   ├── edit/             # 编辑 PRD
│   │   │   ├── export/           # 导出 PRD
│   │   │   └── finalize/         # 生成最终文档
│   │   ├── diagrams/             # 图表 API
│   │   │   ├── generate/         # 生成图表
│   │   │   └── edit/             # 编辑图表
│   │   ├── sessions/             # 会话管理
│   │   │   ├── route.ts          # 会话列表
│   │   │   └── [id]/             # 单个会话
│   │   ├── track/                # 分析追踪
│   │   │   └── page-view/        # 页面访问追踪
│   │   ├── health/               # 健康检查
│   │   ├── deployment-health/    # 部署健康检查
│   │   └── debug-prisma/         # Prisma 调试
│   ├── admin/                    # 管理后台页面
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── login/
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页
│   └── favicon.ico/
├── components/                   # React 组件
│   ├── admin/                    # 管理后台组件
│   │   └── StatsCard.tsx
│   ├── prd/                      # PRD 相关组件
│   │   ├── ConversationPanel.tsx
│   │   ├── DiagramsViewer.tsx
│   │   ├── ExportButton.tsx
│   │   ├── InlineEditPanel.tsx
│   │   ├── MermaidChart.tsx
│   │   ├── PRDDocumentPreview.tsx
│   │   ├── PRDViewer.tsx
│   │   ├── PRDViewerEditable.tsx
│   │   ├── StepIndicator.tsx
│   │   └── ThinkingIndicator.tsx
│   ├── ui/                       # shadcn/ui 组件
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── textarea.tsx
│   ├── AnonymousUserProvider.tsx # 匿名用户追踪
│   ├── ErrorBoundary.tsx         # 错误边界
│   └── PageViewTracker.tsx       # 页面访问追踪
├── hooks/                        # React Hooks
│   ├── use-api-client.ts         # API 客户端 Hook
│   └── use-page-view-tracking.ts # 页面追踪 Hook
├── lib/                          # 核心库
│   ├── admin-auth.ts             # 管理员认证
│   ├── ai.ts                     # AI 集成
│   ├── analytics.ts              # 分析追踪
│   ├── anonymous-user.ts         # 匿名用户管理
│   ├── db.ts                     # 数据库操作
│   ├── generated/                # Prisma 生成文件
│   ├── prompts/                  # AI 提示词
│   │   ├── diagram-prompts.ts    # 图表生成提示词
│   │   ├── prd-edit-prompt.ts    # PRD 编辑提示词
│   │   └── prd-template.ts       # PRD 模板
│   ├── prisma.ts                 # Prisma 客户端
│   └── utils.ts                  # 工具函数
├── prisma/                       # Prisma 配置
│   └── schema.prisma             # 数据库模型
├── types/                        # TypeScript 类型
│   └── prd.ts                    # PRD 类型定义
├── public/                       # 静态资源
├── .env                          # 环境变量 (本地)
├── .env.example                  # 环境变量示例
├── .env.local                    # 环境变量 (本地开发)
├── middleware.ts                 # Next.js 中间件
├── next.config.ts                # Next.js 配置
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
├── vercel.json                   # Vercel 部署配置
├── package.json                  # 项目依赖
└── README.md                     # 项目说明
```

---

## 4. 数据模型

### 4.1 数据库架构

项目使用 Prisma ORM 管理数据库，支持开发环境的 SQLite 和生产环境的 PostgreSQL。

### 4.2 数据模型关系图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────────┐
│   Session   │───────│   Message   │       │   AnalyticsEvent   │
│─────────────│ 1   N │─────────────│       │─────────────────────│
│ id          │       │ id          │       │ id                  │
│ title       │       │ role        │       │ eventType           │
│ currentStep │       │ content     │       │ anonymousId         │
│ anonymousId │       │ sessionId   │       │ sessionId           │
│ sessionId   │       │ createdAt   │       │ metadata            │
│ createdAt   │       └─────────────┘       │ duration            │
│ updatedAt   │                               │ createdAt           │
└─────────────┘                               └─────────────────────┘
       │
       │ 1
       │
       │ 1
       ↓
┌─────────────────────┐       ┌─────────────────────┐
│        PRD          │       │   DailyStats        │
│─────────────────────│       │─────────────────────│
│ id                  │       │ id                  │
│ sessionId           │       │ date                │
│ title               │       │ uniqueUsers         │
│ description         │       │ totalVisits         │
│ background          │       │ prdGenerated        │
│ targetUsers (JSON)  │       │ prdSuccess          │
│ painPoints (JSON)   │       │ avgDuration         │
│ coreValue (JSON)    │       │ totalTokens         │
│ features (JSON)     │       │ errorCount          │
│ successMetrics (JSON)│      │ createdAt           │
│ techFeasibility (JSON)│     │ updatedAt           │
│ competitors (JSON)  │       └─────────────────────┘
│ mermaidArchitecture │
│ mermaidJourney      │
│ mermaidFeatures     │
│ mermaidDataflow     │
│ isFinal             │
│ finalContent        │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
```

### 4.3 数据表详解

#### 4.3.1 Session（会话表）

保存用户的对话会话。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PRIMARY KEY | CUID 格式唯一标识 |
| title | String | NOT NULL | 会话标题 |
| prdId | String | UNIQUE, FOREIGN KEY | 关联的 PRD ID |
| currentStep | Int | DEFAULT 1 | 当前工作流步骤 (1/2/3) |
| anonymousId | String | DEFAULT "unknown" | 匿名用户标识 |
| sessionId | String | UNIQUE | 会话标识 |
| createdAt | DateTime | DEFAULT NOW | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

**索引**:
- `anonymousId` - 用于匿名用户查询
- `sessionId` - 用于会话查询

**关系**:
- `1:N` → Message: 一个会话包含多条消息
- `1:1` → PRD: 一个会话关联一个 PRD

#### 4.3.2 Message（消息表）

保存对话历史记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PRIMARY KEY | CUID 格式唯一标识 |
| role | String | NOT NULL | 角色: user/assistant/system |
| content | String | NOT NULL | 消息内容 |
| sessionId | String | FOREIGN KEY | 所属会话 ID |
| createdAt | DateTime | DEFAULT NOW | 创建时间 |

**关系**:
- `N:1` → Session: 多条消息属于一个会话
- **级联删除**: 会话删除时自动删除关联消息

#### 4.3.3 PRD（产品需求文档表）

保存生成的产品需求文档。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PRIMARY KEY | CUID 格式唯一标识 |
| sessionId | String | UNIQUE, FOREIGN KEY | 关联会话 ID |
| title | String | NOT NULL | 产品名称 |
| description | String | NOT NULL | 产品描述 |
| background | String | NULLABLE | 产品背景 |
| targetUsers | String (JSON) | NOT NULL | 目标用户 JSON |
| painPoints | String (JSON) | NULLABLE | 用户痛点 JSON |
| coreValue | String (JSON) | NULLABLE | 核心价值 JSON |
| features | String (JSON) | NOT NULL | 功能列表 JSON |
| successMetrics | String (JSON) | NULLABLE | 成功指标 JSON |
| techFeasibility | String (JSON) | NULLABLE | 技术可行性 JSON |
| competitors | String (JSON) | NULLABLE | 竞品分析 JSON |
| mermaidArchitecture | String (TEXT) | NULLABLE | 系统架构图代码 |
| mermaidJourney | String (TEXT) | NULLABLE | 用户旅程图代码 |
| mermaidFeatures | String (TEXT) | NULLABLE | 功能模块图代码 |
| mermaidDataflow | String (TEXT) | NULLABLE | 数据流图代码 |
| isFinal | Boolean | DEFAULT false | 是否为最终版本 |
| finalContent | String (TEXT) | NULLABLE | 完整 PRD Markdown |
| createdAt | DateTime | DEFAULT NOW | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

**JSON 字段格式**:

```typescript
// targetUsers
{
  "primary": ["主要用户1", "主要用户2"],
  "secondary": ["次要用户1", "次要用户2"]
}

// features
[
  {
    "id": "feature_1",
    "name": "功能名称",
    "description": "功能描述",
    "priority": "high",  // high/medium/low
    "effort": 3,         // 1-5
    "value": 4,          // 1-5
    "acceptanceCriteria": ["标准1", "标准2"]
  }
]

// techFeasibility
{
  "overall": "medium",  // easy/medium/hard
  "challenges": ["挑战1", "挑战2"],
  "recommendations": ["建议1", "建议2"]
}

// competitors
[
  {
    "name": "竞品名称",
    "features": ["功能1", "功能2"],
    "differences": "差异化描述"
  }
]
```

#### 4.3.4 AnalyticsEvent（分析事件表）

记录用户行为和分析事件。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PRIMARY KEY | CUID 格式唯一标识 |
| eventType | String | NOT NULL | 事件类型 |
| anonymousId | String | NOT NULL | 匿名用户标识 |
| sessionId | String | NULLABLE | 关联会话 ID |
| metadata | String (JSON) | NULLABLE | 事件元数据 |
| duration | Int | NULLABLE | 事件持续时间(秒) |
| createdAt | DateTime | DEFAULT NOW | 创建时间 |

**事件类型**:
- `prd_generated` - PRD 生成成功
- `prd_failed` - PRD 生成失败
- `page_view` - 页面访问
- `diagram_generated` - 图表生成
- `prd_exported` - PRD 导出

**索引**:
- `eventType` - 用于事件类型查询
- `anonymousId` - 用于用户查询
- `createdAt` - 用于时间范围查询

#### 4.3.5 DailyStats（每日统计表）

聚合的每日统计数据。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PRIMARY KEY | CUID 格式唯一标识 |
| date | DateTime | UNIQUE | 统计日期 |
| uniqueUsers | Int | DEFAULT 0 | 唯一用户数 |
| totalVisits | Int | DEFAULT 0 | 总访问次数 |
| prdGenerated | Int | DEFAULT 0 | PRD 生成数量 |
| prdSuccess | Float | DEFAULT 0 | PRD 成功率 |
| avgDuration | Float | NULLABLE | 平均生成时长(秒) |
| totalTokens | Int | DEFAULT 0 | Token 总消耗 |
| errorCount | Int | DEFAULT 0 | 错误次数 |
| createdAt | DateTime | DEFAULT NOW | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

#### 4.3.6 AnalysisLog（分析日志表）

记录 AI 分析过程日志（竞品分析、可行性分析等）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String | PRIMARY KEY | CUID 格式唯一标识 |
| type | String | NOT NULL | 分析类型 |
| input | String | NOT NULL | 输入内容 |
| output | String | NOT NULL | 输出结果 |
| createdAt | DateTime | DEFAULT NOW | 创建时间 |

---

## 5. 功能详解

### 5.1 PRD 智能生成

#### 5.1.1 工作流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant A as API
    participant AI as 智谱AI
    participant DB as 数据库

    U->>F: 输入产品想法
    F->>A: POST /api/prd/generate
    A->>DB: 创建 Session
    A->>DB: 保存用户消息
    A->>AI: 调用 GLM-4.6 API
    AI-->>A: 返回 JSON PRD
    A->>DB: 保存 PRD
    A->>DB: 更新会话标题
    A->>DB: 保存 AI 消息
    A-->>F: 返回 PRD 数据
    F->>U: 展示 PRD 文档
```

#### 5.1.2 API 调用

**请求**:
```http
POST /api/prd/generate
Content-Type: application/json

{
  "idea": "我想做一个 AI 写作助手，帮助内容创作者快速生成文章初稿...",
  "anonymousId": "user_123",  // 可选
  "sessionId": "session_456"  // 可选，用于续写
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cmxxxxxxxxxxxxx",
    "prdId": "cmxxxxxxxxxxxxx",
    "prd": {
      "title": "AI 写作助手",
      "description": "一款基于人工智能的内容创作辅助工具...",
      "background": "随着内容创作需求的增长...",
      "targetUsers": {
        "primary": ["内容创作者：25-40岁，经常需要撰写文章的自媒体人和博主"],
        "secondary": ["学生群体：需要完成论文和作业的大学生"]
      },
      "painPoints": [
        "写作灵感匮乏，不知道从何下笔",
        "文章结构不清晰，逻辑混乱"
      ],
      "coreValue": [
        "智能生成文章大纲和初稿",
        "提供写作灵感和素材参考"
      ],
      "features": [
        {
          "id": "feature_1",
          "name": "智能大纲生成",
          "description": "根据用户输入的主题，自动生成文章结构大纲",
          "priority": "high",
          "effort": 3,
          "value": 5,
          "acceptanceCriteria": [
            "输入主题后10秒内生成大纲",
            "大纲包含至少3级标题结构"
          ]
        }
      ],
      "successMetrics": [
        "用户生成文章数量 > 1000篇/天",
        "用户满意度评分 > 4.5/5.0"
      ],
      "techFeasibility": {
        "overall": "medium",
        "challenges": [
          "保证生成内容的质量和原创性",
          "实现快速的模型推理响应"
        ],
        "recommendations": [
          "使用智谱 GLM-4 作为核心模型",
          "实现内容检测和去重机制"
        ]
      },
      "competitors": [
        {
          "name": "Notion AI",
          "features": ["文档生成", "内容续写", "语法检查"],
          "differences": "本产品专注于中文内容创作，提供更适合中文用户的写作辅助功能"
        }
      ]
    }
  }
}
```

### 5.2 在线编辑功能

用户可以在生成 PRD 后直接在线编辑各个章节。

#### 5.2.1 支持的编辑操作

| 章节 | 编辑类型 | API |
|------|---------|-----|
| 产品标题 | 文本编辑 | POST /api/prd/edit |
| 产品描述 | 文本编辑 | POST /api/prd/edit |
| 目标用户 | JSON 编辑 | POST /api/prd/edit |
| 功能列表 | JSON 编辑 | POST /api/prd/edit |
| 技术评估 | JSON 编辑 | POST /api/prd/edit |

**请求示例**:
```http
POST /api/prd/edit
Content-Type: application/json

{
  "sessionId": "cmxxxxxxxxxxxxx",
  "field": "description",
  "instruction": "将产品描述改为更简洁的版本，突出AI写作的核心价值"
}
```

### 5.3 Mermaid 图表生成

系统支持自动生成四种类型的 Mermaid 图表。

#### 5.3.1 图表类型

| 图表类型 | 说明 | 用途 |
|---------|------|------|
| 系统架构图 | 展示系统技术架构和组件关系 | 技术团队理解系统设计 |
| 用户旅程图 | 展示用户使用产品的完整流程 | 用户体验优化 |
| 功能模块图 | 展示核心功能的模块化结构 | 功能规划和开发 |
| 数据流图 | 展示数据在系统中的流动过程 | 数据架构设计 |

#### 5.3.2 生成 API

**请求**:
```http
POST /api/diagrams/generate
Content-Type: application/json

{
  "sessionId": "cmxxxxxxxxxxxxx"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "diagrams": {
      "architecture": "graph TB\n    Client[客户端] --> Server[API服务器]",
      "journey": "journey\n    title 用户使用旅程\n    section 注册...",
      "features": "graph LR\n    A[用户管理] --> B[内容生成]",
      "dataflow": "graph TD\n    User[用户] --> Input[输入内容]"
    }
  }
}
```

### 5.4 完整文档导出

#### 5.4.1 生成最终 PRD

```http
POST /api/prd/finalize
Content-Type: application/json

{
  "sessionId": "cmxxxxxxxxxxxxx"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "markdown": "# AI 写作助手 产品需求文档\n\n## 1. 产品概述\n..."
  }
}
```

#### 5.4.2 导出格式

支持两种导出格式：

| 格式 | MIME 类型 | 用途 |
|------|----------|------|
| Markdown | text/markdown | 版本控制、文档协作 |
| PDF | application/pdf | 演示、打印、分享 |

```http
GET /api/prd/export?sessionId=xxx&format=pdf
```

### 5.5 管理后台

#### 5.5.1 认证机制

- 使用 JWT 进行身份验证
- 密码使用 bcrypt 加密存储
- 默认管理员密码: `admin123`

**环境变量配置**:
```bash
ADMIN_PASSWORD_HASH="$2b$10$..."  # bcrypt hash
ADMIN_JWT_SECRET="your-secret-key-at-least-32-chars"
```

#### 5.5.2 管理功能

| 功能 | API | 说明 |
|------|-----|------|
| 登录 | POST /api/admin/login | JWT 认证 |
| 登出 | POST /api/admin/logout | 清除会话 |
| 统计数据 | GET /api/admin/stats | 获取统计数据 |

**统计数据包含**:
- 总会话数
- PRD 生成数
- 成功率
- 平均生成时间
- 唯一用户数
- 今日数据

---

## 6. API 接口文档

### 6.1 API 总览

| 分类 | 端点 | 方法 | 说明 |
|------|------|------|------|
| **PRD** | /api/prd/generate | POST | 生成 PRD |
| | /api/prd/edit | POST | 编辑 PRD |
| | /api/prd/finalize | POST | 生成最终文档 |
| | /api/prd/export | GET | 导出 PRD |
| **图表** | /api/diagrams/generate | POST | 生成图表 |
| | /api/diagrams/edit | POST | 编辑图表 |
| **会话** | /api/sessions | GET | 获取会话列表 |
| | /api/sessions/[id] | GET | 获取单个会话 |
| | /api/sessions/[id] | DELETE | 删除会话 |
| **管理** | /api/admin/login | POST | 管理员登录 |
| | /api/admin/logout | POST | 管理员登出 |
| | /api/admin/stats | GET | 统计数据 |
| **健康** | /api/health | GET | 健康检查 |
| | /api/deployment-health | GET | 部署健康检查 |

### 6.2 详细 API 文档

#### 6.2.1 生成 PRD

```http
POST /api/prd/generate
```

**请求参数**:
```typescript
{
  idea: string;           // 产品想法，最少10字符
  anonymousId?: string;   // 匿名用户ID（可选）
  sessionId?: string;     // 会话ID，用于续写（可选）
}
```

**响应**:
```typescript
{
  success: true;
  data: {
    sessionId: string;    // 会话ID
    prdId: string;        // PRD记录ID
    prd: PRDDocument;     // 完整PRD数据
  };
}
```

**错误响应**:
```typescript
{
  success: false;
  error: string;          // 错误信息
}
```

**HTTP 状态码**:
- `200` - 成功
- `400` - 请求参数错误
- `500` - 服务器错误

#### 6.2.2 获取会话列表

```http
GET /api/sessions
```

**响应**:
```typescript
{
  success: true;
  data: Array<{
    id: string;
    title: string;
    updatedAt: string;
    currentStep: number;
    prd?: {
      id: string;
      title: string;
      description: string;
      isFinal: boolean;
    };
  }>;
}
```

#### 6.2.3 获取单个会话

```http
GET /api/sessions/[id]
```

**响应**:
```typescript
{
  success: true;
  data: {
    session: {
      id: string;
      title: string;
      currentStep: number;
      createdAt: string;
      updatedAt: string;
    };
    prd: PRDDocument;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      createdAt: string;
    }>;
  };
}
```

#### 6.2.4 删除会话

```http
DELETE /api/sessions/[id]
```

**响应**:
```typescript
{
  success: true;
  data: {
    deletedId: string;
  };
}
```

#### 6.2.5 生成图表

```http
POST /api/diagrams/generate
```

**请求参数**:
```typescript
{
  sessionId: string;      // 会话ID
}
```

**响应**:
```typescript
{
  success: true;
  data: {
    diagrams: {
      architecture: string;  // Mermaid 代码
      journey: string;       // Mermaid 代码
      features: string;      // Mermaid 代码
      dataflow: string;      // Mermaid 代码
    };
  };
}
```

#### 6.2.6 管理员登录

```http
POST /api/admin/login
```

**请求参数**:
```typescript
{
  password: string;        // 管理员密码
}
```

**响应**:
```typescript
{
  success: true;
  data: {
    token: string;         // JWT token
  };
}
```

#### 6.2.7 获取统计数据

```http
GET /api/admin/stats
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```typescript
{
  success: true;
  data: {
    totalSessions: number;
    totalPRDs: number;
    successRate: number;
    avgDuration: number;
    uniqueUsers: number;
    todayStats: {
      sessions: number;
      prds: number;
      users: number;
    };
  };
}
```

---

## 7. 开发指南

### 7.1 环境准备

#### 7.1.1 系统要求

- Node.js >= 18.17.0
- npm >= 9.0.0
- Git

#### 7.1.2 安装依赖

```bash
# 克隆项目
git clone https://github.com/yourusername/ai-prd-agent.git
cd ai-prd-agent

# 安装依赖
npm install
```

### 7.2 本地开发

#### 7.2.1 环境变量配置

创建 `.env.local` 文件：

```bash
# 智谱 AI API Key
ZHIPU_API_KEY=your_api_key_here

# 数据库（开发环境使用 SQLite）
DATABASE_URL="file:./dev.db"

# 管理后台密码（可选）
ADMIN_PASSWORD_HASH="$2b$10$..."
ADMIN_JWT_SECRET="your-secret-key"

# Next.js App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 7.2.2 数据库初始化

```bash
# 生成 Prisma Client
npx prisma generate

# 推送数据库 schema
npx prisma db push

# （可选）打开 Prisma Studio
npx prisma studio
```

#### 7.2.3 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 7.3 代码规范

#### 7.3.1 TypeScript 配置

项目使用严格的 TypeScript 配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### 7.3.2 ESLint 配置

使用 ESLint 进行代码检查：

```bash
npm run lint
```

### 7.4 测试

#### 7.4.1 手动测试

1. **PRD 生成测试**
   - 输入产品想法
   - 检查生成的 PRD 结构
   - 验证 JSON 格式

2. **图表生成测试**
   - 生成四种图表
   - 验证 Mermaid 代码正确性
   - 检查图表渲染

3. **导出功能测试**
   - 测试 Markdown 导出
   - 测试 PDF 导出

#### 7.4.2 API 测试

使用 curl 或 Postman 测试 API：

```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试 PRD 生成
curl -X POST http://localhost:3000/api/prd/generate \
  -H "Content-Type: application/json" \
  -d '{"idea":"AI写作助手"}'
```

### 7.5 调试技巧

#### 7.5.1 查看 Prisma 查询

```typescript
// 在 lib/db.ts 中启用日志
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

#### 7.5.2 查看 AI API 调用

在 `lib/ai.ts` 中添加日志：

```typescript
console.log('AI Request:', { messages, options });
const response = await chatCompletion(options);
console.log('AI Response:', response);
```

---

## 8. 部署说明

### 8.1 Vercel 部署（推荐）

#### 8.1.1 准备工作

1. **注册账号**
   - [Vercel](https://vercel.com)
   - [智谱 AI](https://open.bigmodel.cn)
   - [Neon](https://neon.tech)（PostgreSQL 数据库）

2. **获取 API Keys**
   - 智谱 AI API Key
   - Neon 数据库连接字符串

#### 8.1.2 部署步骤

1. **推送代码到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/ai-prd-agent.git
git push -u origin main
```

2. **在 Vercel 导入项目**

   - 登录 Vercel Dashboard
   - 点击 "Add New..." → "Project"
   - 选择 GitHub 仓库

3. **配置环境变量**

在 Vercel 项目设置中添加：

| 变量名 | 值 | 说明 |
|--------|---|------|
| `ZHIPU_API_KEY` | `your_key` | 智谱 API 密钥 |
| `DATABASE_URL` | `postgresql://...` | Neon 数据库连接 |
| `ADMIN_PASSWORD_HASH` | `$2b$10$...` | bcrypt hash |
| `ADMIN_JWT_SECRET` | `secret...` | JWT 密钥 |

4. **配置数据库**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 链接项目
vercel link

# 拉取环境变量
vercel env pull .env.local

# 推送数据库 schema
npx prisma db push
```

5. **部署**

点击 "Deploy" 按钮，等待构建完成。

#### 8.1.3 自动部署

配置完成后，每次推送到 `main` 分支都会自动部署：

```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel 自动构建和部署
```

### 8.2 Docker 部署（可选）

#### 8.2.1 Dockerfile

```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 运行应用
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

#### 8.2.2 运行容器

```bash
# 构建镜像
docker build -t ai-prd-agent .

# 运行容器
docker run -p 3000:3000 \
  -e ZHIPU_API_KEY=your_key \
  -e DATABASE_URL=your_db_url \
  ai-prd-agent
```

### 8.3 部署验证

部署完成后，进行以下验证：

- [ ] 访问主页正常加载
- [ ] 测试 PRD 生成功能
- [ ] 测试图表生成功能
- [ ] 测试导出功能
- [ ] 检查数据库连接
- [ ] 测试管理后台登录
- [ ] 查看 Vercel Analytics 数据

---

## 9. 配置管理

### 9.1 环境变量

#### 9.1.1 必需变量

```bash
# 智谱 AI
ZHIPU_API_KEY=your_api_key_here

# 数据库
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Next.js
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### 9.1.2 可选变量

```bash
# AI 模型配置
ZHIPU_MODEL=glm-4.6v

# 管理后台
ADMIN_PASSWORD_HASH=$2b$10$...
ADMIN_JWT_SECRET=your-secret-key

# 分析（Vercel Analytics 自动配置）
```

### 9.2 Next.js 配置

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16+ 配置
  // Turbopack 在开发模式下默认启用
};

export default nextConfig;
```

### 9.3 Tailwind CSS 配置

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ...更多颜色
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 9.4 Prisma 配置

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // 生产环境
  url      = env("DATABASE_URL")
}
```

---

## 10. 组件说明

### 10.1 核心 PRD 组件

#### 10.1.1 PRDViewer

只读 PRD 查看器组件。

**Props**:
```typescript
interface PRDViewerProps {
  prd: PRDDocument;
}
```

**功能**:
- 结构化展示 PRD 各章节
- 支持卡片布局
- 优先级徽章显示
- 响应式设计

#### 10.1.2 PRDViewerEditable

可编辑的 PRD 查看器组件。

**Props**:
```typescript
interface PRDViewerEditableProps {
  prd: PRDDocument;
  sessionId: string;
  onPRDUpdate: (prd: PRDDocument) => void;
}
```

**功能**:
- 支持在线编辑各章节
- 实时保存到数据库
- 编辑状态指示
- 错误处理

#### 10.1.3 MermaidChart

Mermaid 图表渲染组件。

**Props**:
```typescript
interface MermaidChartProps {
  code: string;
  title: string;
  description?: string;
}
```

**功能**:
- 渲染 Mermaid 图表
- 支持四种图表类型
- 错误处理和回退
- 加载状态显示

#### 10.1.4 DiagramsViewer

图表集合查看器。

**Props**:
```typescript
interface DiagramsViewerProps {
  diagrams: Diagrams;
  onEdit?: (diagramType: string, code: string) => void;
}
```

**功能**:
- 展示所有生成的图表
- 支持编辑图表代码
- 图表类型切换

### 10.2 UI 组件

项目使用 shadcn/ui 组件库：

| 组件 | 文件 | 说明 |
|------|------|------|
| Button | components/ui/button.tsx | 按钮 |
| Card | components/ui/card.tsx | 卡片 |
| Input | components/ui/input.tsx | 输入框 |
| Textarea | components/ui/textarea.tsx | 文本域 |
| Badge | components/ui/badge.tsx | 徽章 |

### 10.3 工具组件

#### 10.3.1 ErrorBoundary

错误边界组件，捕获子组件错误。

```typescript
<ErrorBoundary fallback={<ErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

#### 10.3.2 AnonymousUserProvider

匿名用户追踪 Provider。

```typescript
<AnonymousUserProvider>
  <App />
</AnonymousUserProvider>
```

#### 10.3.3 PageViewTracker

页面访问追踪组件。

自动追踪页面访问并发送到分析端点。

---

## 11. 数据流与状态管理

### 11.1 前端状态管理

项目使用 React Hooks 进行状态管理，无额外状态管理库。

#### 11.1.1 主页面状态

```typescript
// app/page.tsx
const [idea, setIdea] = useState('');              // 用户输入
const [loading, setLoading] = useState(false);     // 加载状态
const [sessions, setSessions] = useState<Session[]>([]);  // 会话列表
const [selectedSession, setSelectedSession] = useState<Session | null>(null);
const [currentPRD, setCurrentPRD] = useState<PRDDocument | null>(null);
const [diagrams, setDiagrams] = useState<Diagrams | null>(null);
const [currentStep, setCurrentStep] = useState(1); // 工作流步骤
const [error, setError] = useState('');
```

#### 11.1.2 数据流图

```
┌─────────────┐
│   用户输入   │
└──────┬──────┘
       ↓
┌─────────────────────────────────────┐
│          useState Hook              │
│  ┌─────────────────────────────────┐│
│  │ idea → loading → currentPRD     ││
│  └─────────────────────────────────┘│
└──────────────┬──────────────────────┘
               ↓
        ┌──────────────┐
        │  API 调用    │
        └──────┬───────┘
               ↓
        ┌──────────────┐
        │  数据库更新   │
        └──────┬───────┘
               ↓
        ┌──────────────┐
        │  状态更新     │
        │  setState    │
        └──────┬───────┘
               ↓
        ┌──────────────┐
        │  UI 重新渲染 │
        └──────────────┘
```

### 11.2 匿名用户管理

使用匿名 ID 追踪用户行为：

```typescript
// lib/anonymous-user.ts
export function generateAnonymousId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getAnonymousIdFromCookie(request: NextRequest): string {
  const cookie = request.cookies.get('anonymous_id');
  if (cookie) return cookie.value;

  const newId = generateAnonymousId();
  // 设置 Cookie，有效期 30 天
  return newId;
}
```

### 11.3 分析追踪

```typescript
// lib/analytics.ts
export async function trackPRDGeneration(data: {
  anonymousId: string;
  sessionId?: string;
  title: string;
  status: 'success' | 'failed';
  duration: number;
  tokensUsed?: number;
  error?: string;
}): Promise<void> {
  // 记录分析事件到数据库
}
```

---

## 12. 性能优化

### 12.1 前端优化

#### 12.1.1 代码分割

Next.js 自动进行代码分割：

```typescript
// 动态导入组件
const MermaidChart = dynamic(() => import('@/components/prd/MermaidChart'), {
  loading: () => <Skeleton />,
  ssr: false,  // Mermaid 仅客户端渲染
});
```

#### 12.1.2 图片优化

使用 Next.js Image 组件：

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority
/>
```

#### 12.1.3 缓存策略

- HTTP 缓存头配置
- 静态资源 CDN 缓存
- API 响应缓存（可考虑 Redis）

### 12.2 后端优化

#### 12.2.1 数据库优化

```typescript
// 索引优化
model Session {
  // ...
  @@index([anonymousId])
  @@index([sessionId])
}

// 查询优化
const sessions = await prisma.session.findMany({
  take: 50,  // 限制返回数量
  orderBy: { updatedAt: 'desc' },
  include: {
    prd: {
      select: {  // 只选择需要的字段
        id: true,
        title: true,
        isFinal: true,
      },
    },
  },
});
```

#### 12.2.2 API 响应优化

```typescript
// 流式响应（预留）
export async function* streamPRD(idea: string) {
  yield* chatStream(SYSTEM_PROMPT, PRD_GENERATION_PROMPT(idea));
}
```

#### 12.2.3 并发控制

图表生成使用队列控制并发：

```typescript
// 串行生成图表，避免 API 限流
for (const diagramType of ['architecture', 'journey', 'features', 'dataflow']) {
  const diagram = await generateDiagram(diagramType, prd);
  setDiagrams(prev => ({ ...prev, [diagramType]: diagram }));
}
```

### 12.3 监控指标

| 指标 | 目标值 | 监控方式 |
|------|--------|---------|
| PRD 生成时间 | < 20 秒 | Analytics |
| API 响应时间 | < 2 秒 | Vercel Analytics |
| 数据库查询 | < 100 ms | Prisma 日志 |
| 错误率 | < 1% | Sentry/Error Tracking |

---

## 13. 安全考虑

### 13.1 API 安全

#### 13.1.1 请求验证

使用 Zod 进行严格的请求验证：

```typescript
const GeneratePRDSchema = z.object({
  idea: z.string().min(10, '产品想法至少需要10个字符'),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
});

const result = GeneratePRDSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { error: '请求参数错误', details: result.error },
    { status: 400 }
  );
}
```

#### 13.1.2 环境变量保护

- 敏感信息存储在环境变量中
- 不在客户端代码中暴露 API Keys
- 使用 `.env.local` 本地开发，`.env.production` 生产环境

### 13.2 认证与授权

#### 13.2.1 管理员认证

```typescript
// lib/admin-auth.ts
import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET
);

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}
```

#### 13.2.2 中间件保护

```typescript
// middleware.ts
import { verifyToken } from '@/lib/admin-auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 保护管理后台
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyToken(token))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}
```

### 13.3 数据安全

#### 13.3.1 SQL 注入防护

使用 Prisma ORM 自动防护：

```typescript
// 参数化查询，自动转义
const session = await prisma.session.findUnique({
  where: { id: sessionId },
});
```

#### 13.3.2 XSS 防护

React 自动转义输出：

```typescript
// 安全的 HTML 转义
<div>{userInput}</div>  // 自动转义

// 使用 React Markdown 渲染用户内容
<ReactMarkdown>{content}</ReactMarkdown>
```

#### 13.3.3 CORS 配置

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*',
          },
        ],
      },
    ];
  },
};
```

### 13.4 速率限制（建议实现）

```typescript
// 建议添加速率限制中间件
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 100,  // 最多 100 个请求
});
```

---

## 14. 故障排查

### 14.1 常见问题

#### 14.1.1 API 调用失败

**症状**: PRD 生成时返回错误

**排查步骤**:

1. 检查 API Key 是否正确
```bash
echo $ZHIPU_API_KEY
```

2. 验证 API Key 是否有额度
   - 登录智谱 AI 控制台
   - 查看 API 使用情况

3. 查看错误日志
```bash
# Vercel
vercel logs

# 本地
npm run dev  # 查看控制台输出
```

**解决方案**:
- 更新 API Key
- 检查网络连接
- 增加重试逻辑

#### 14.1.2 数据库连接错误

**症状**: `Error: Can't reach database server`

**排查步骤**:

1. 检查 DATABASE_URL 是否正确
```bash
echo $DATABASE_URL
```

2. 测试数据库连接
```bash
npx prisma db push
```

3. 查看数据库日志（Neon 控制台）

**解决方案**:
- 更新连接字符串
- 检查防火墙设置
- 重启数据库实例

#### 14.1.3 图表渲染失败

**症状**: Mermaid 图表不显示

**排查步骤**:

1. 检查浏览器控制台是否有错误
2. 验证 Mermaid 代码语法
3. 查看网络请求

**解决方案**:
- 更新 Mermaid 版本
- 修复代码语法错误
- 清除浏览器缓存

#### 14.1.4 管理后台登录失败

**症状**: 密码正确但无法登录

**排查步骤**:

1. 检查 JWT_SECRET 是否设置
2. 验证密码哈希
```bash
# 生成新的密码哈希
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('admin123', 10));"
```

**解决方案**:
- 设置正确的 JWT_SECRET
- 更新密码哈希
- 清除浏览器 Cookie

### 14.2 调试工具

#### 14.2.1 Prisma Studio

```bash
npx prisma studio
```

打开 http://localhost:5555 查看数据库内容。

#### 14.2.2 Vercel 日志

```bash
# 实时日志
vercel logs

# 特定部署日志
vercel logs <deployment-url>
```

#### 14.2.3 浏览器开发工具

- **Console**: 查看客户端错误
- **Network**: 查看请求响应
- **Application**: 查看 Cookie 和 LocalStorage

### 14.3 错误处理

#### 14.3.1 API 错误响应格式

```typescript
{
  success: false;
  error: string;          // 用户友好的错误信息
  details?: any;          // 详细错误信息（开发环境）
}
```

#### 14.3.2 前端错误显示

```typescript
{error && (
  <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
    {error}
  </div>
)}
```

---

## 15. 版本历史

### v1.0.0 (2026-02-14)

**核心功能**:
- ✅ PRD 智能生成（GLM-4.6v）
- ✅ 三步式工作流（初稿 → 图表 → 完整文档）
- ✅ 在线编辑功能
- ✅ Mermaid 图表生成（4种类型）
- ✅ 完整文档导出（Markdown/PDF）
- ✅ 会话历史管理
- ✅ 管理后台（JWT 认证）
- ✅ 用户行为分析
- ✅ 健康检查 API

**技术栈**:
- Next.js 16.1.6
- React 19.2.3
- Prisma 5.22.0
- Neon PostgreSQL（生产环境）
- Vercel（部署平台）

**部署状态**: 已正式上线

### 未来版本计划

#### v1.1.0 (计划中)
- PRD 对比功能
- 搜索和过滤
- 成本监控和预警

#### v2.0.0 (规划中)
- 多模态输入
- 团队协作功能
- 模板库
- 移动端应用

---

## 附录

### A. 相关资源

- [智谱 AI 文档](https://open.bigmodel.cn/dev/api)
- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [shadcn/ui 组件](https://ui.shadcn.com)
- [Vercel 部署指南](https://vercel.com/docs)

### B. 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

### C. 贡献指南

欢迎提交 Issue 和 Pull Request！

### D. 联系方式

- 项目地址: [GitHub](https://github.com/yourusername/ai-prd-agent)
- 在线演示: [Demo](https://your-app.vercel.app)

---

**文档版本**: v1.0.0
**最后更新**: 2026-02-23
**维护者**: AI PRD Agent Team
