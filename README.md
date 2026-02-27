# AI PRD Agent

基于 AI 的产品需求文档（PRD）自动生成工具，通过三步工作流帮助用户将产品想法转化为完整的专业文档。

## 功能特性

- **智能澄清对话**: 当用户输入较为模糊时，AI 会生成针对性的澄清问题来收集更多信息
- **三步工作流**:
  1. PRD 初稿生成
  2. 可视化图表（架构图、用户旅程图、功能模块图、数据流图）
  3. 完整文档导出（Markdown / Word）
- **实时产品画像预览**: 澄清对话过程中实时显示已收集的产品信息
- **可编辑 PRD**: 支持直接编辑生成的 PRD 内容
- **会话管理**: 保存历史会话，随时查看和编辑

## 技术栈

- **前端**: Next.js 16.1.6 + React 19.2.3 + TypeScript 5
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: PostgreSQL (Prisma ORM v5.22.0)
- **AI 模型**: 智谱 AI GLM-4.6v
- **图表**: Mermaid.js v11.12.2
- **文档导出**: docx (Word), Markdown

## 快速开始

### 环境变量配置

复制 `.env.example` 到 `.env.local` 并配置：

```bash
cp .env.example .env.local
```

必需的环境变量：

```env
# 智谱AI API密钥（必需）
ZHIPU_API_KEY=your_api_key_here

# 数据库连接（必需）
DATABASE_URL=your_database_url_here

# 管理后台认证（可选）
ADMIN_PASSWORD_HASH=your_hash_here
ADMIN_JWT_SECRET=your_secret_here
```

### 安装依赖

```bash
npm install
```

### 数据库迁移

```bash
npx prisma generate
npx prisma db push
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 使用方法

1. **输入产品想法**: 在主页输入你的产品想法
2. **智能澄清**（如需要）: 如果输入较为模糊，AI 会提出澄清问题
3. **查看 PRD 初稿**: AI 生成结构化的 PRD 初稿
4. **生成可视化图表**: 一键生成系统架构图、用户旅程图等
5. **导出完整文档**: 导出为 Markdown 或 Word 格式

## 项目结构

```
ai-prd-agent/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── prd/           # PRD 相关 API
│   │   │   ├── analyze-input/  # 输入质量分析
│   │   │   ├── generate/       # PRD 生成
│   │   │   ├── edit/           # PRD 编辑
│   │   │   └── export/         # 文档导出
│   │   └── diagrams/      # 图表相关 API
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── prd/              # PRD 相关组件
│   │   ├── ClarificationChat.tsx      # 澄清对话组件
│   │   ├── ProductProfilePreview.tsx  # 产品画像预览
│   │   ├── PRDViewer.tsx              # PRD 查看器
│   │   └── ...
│   └── ui/               # shadcn/ui 组件
├── lib/                  # 工具库
│   ├── prompts/          # AI 提示词模板
│   │   ├── clarification-prompt.ts  # 澄清问题 Prompt
│   │   ├── prd-template.ts           # PRD 生成 Prompt
│   │   └── diagram-prompts.ts        # 图表生成 Prompt
│   ├── ai.ts            # 智谱 AI 集成
│   ├── db.ts            # 数据库操作
│   └── export/          # 文档导出
├── prisma/              # 数据库模型
│   └── schema.prisma
├── types/               # TypeScript 类型定义
│   └── prd.ts
└── docs/                # 文档
    └── plans/           # 设计文档
```

## 设计文档

- [澄清流程设计文档](./docs/plans/2025-02-27-clarification-flow-design.md)
- [澄清流程实施计划](./docs/plans/2025-02-27-clarification-flow-implementation.md)

## 开发指南

### 可用的 npm 脚本

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint
```

### 数据库操作

```bash
npx prisma studio         # 打开 Prisma Studio
npx prisma generate       # 生成 Prisma Client
npx prisma db push        # 推送 schema 到数据库
```

## License

MIT
