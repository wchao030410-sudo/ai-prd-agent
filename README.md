<div align="center">

# 🤖 AI PRD Agent

**AI驱动的产品需求文档生成工具 - 10分钟完成专业PRD**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[在线演示](https://your-project.vercel.app) • [功能介绍](#-核心功能) • [快速开始](#-快速开始) • [部署指南](#-部署指南)

</div>

---

## ✨ 项目简介

**AI PRD Agent** 是一款专为产品经理和创业者打造的智能化PRD生成工具。通过输入简单的产品想法，AI会自动生成包含以下内容的专业级产品需求文档：

- 🎯 **产品概述** - 标题、描述、背景
- 👥 **目标用户画像** - 主要/次要用户分析
- 💡 **用户痛点分析** - 深度痛点挖掘
- 🚀 **核心价值主张** - 差异化价值
- ✅ **功能列表** - RICE优先级排序 + 工作量评估
- 📊 **成功指标** - 可衡量的关键指标
- 🔧 **技术可行性评估** - 难度分级 + 技术挑战
- 🏢 **竞品智能分析** - 核心功能 + 差异化策略

### 🎯 核心价值

| 传统方式 | AI PRD Agent | 提升 |
|:---|:---|:---:|
| 2-8 小时 | **10-15 分钟** | **80-90%** |
| 依赖个人经验 | **AI专业模板** | **质量一致** |
| 主观判断 | **RICE量化评分** | **数据驱动** |

---

## 🎬 项目演示

### 界面预览

<!-- TODO: 添加项目截图 -->
<!--
![主页截图](docs/images/homepage.png)
![PRD生成示例](docs/images/prd-example.png)
-->

### 功能演示

<!-- TODO: 添加GIF演示或视频链接 -->
<!--
[![Watch demo](docs/images/demo-thumbnail.png)](docs/demo-video.mp4)
-->

---

## 🚀 核心功能

### 1️⃣ 智能PRD生成
- 支持自然语言输入产品想法
- AI自动识别关键要素并补充遗漏章节
- 强制JSON输出，确保结构完整
- 30秒内生成完整PRD

### 2️⃣ RICE优先级排序
- **Reach (覆盖度)**: 预计用户覆盖范围 (1-10)
- **Impact (影响力)**: 对用户/业务的影响程度 (1-10)
- **Confidence (信心)**: 对成功可能性的信心 (1-10)
- **Effort (工作量)**: 开发所需工作量 (1-5)
- 自动计算 RICE = (R × I × C) / E

### 3️⃣ 技术可行性评估
- 总体难度分级 (Easy/Medium/Hard)
- 列出2-3个关键技术挑战
- 提供可操作的技术建议

### 4️⃣ 竞品智能分析
- 自动识别2-3个相关竞品
- 分析竞品核心功能
- 提供差异化策略建议

### 5️⃣ 会话历史管理
- 完整的会话历史记录
- 支持快速切换查看
- 实时保存，永不丢失

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 16.1 (App Router)
- **UI库**: React 19.2 + shadcn/ui
- **样式**: Tailwind CSS 3.4
- **类型**: TypeScript 5.x
- **验证**: Zod 4.3

### 后端
- **API**: Next.js API Routes
- **ORM**: Prisma 5.22
- **数据库**: SQLite (开发) / Vercel Postgres (生产)
- **AI**: 智谱 GLM-4.6

---

## 📦 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- npm 或 yarn 或 pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/ai-prd-agent.git
cd ai-prd-agent
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

复制 `.env.example` 为 `.env.local`：
```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的API密钥：
```env
ZHIPU_API_KEY=your_api_key_here
DATABASE_URL=file:./dev.db
```

> 💡 获取智谱API密钥：[https://open.bigmodel.cn/usercenter/apikeys](https://open.bigmodel.cn/usercenter/apikeys)

4. **初始化数据库**
```bash
npx prisma generate
npx prisma db push
```

5. **启动开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

---

## 🌐 部署指南

### Vercel 部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-prd-agent)

1. 点击上方按钮，将项目导入 Vercel
2. 配置环境变量：
   - `ZHIPU_API_KEY`: 你的智谱API密钥
   - `DATABASE_URL`: Vercel Postgres 连接字符串（自动创建）
3. 点击 Deploy，等待部署完成

### 其他平台

本项目可以部署到任何支持 Next.js 的平台：
- Railway
- Render
- Fly.io
- 自建服务器

详细说明请查看 [部署文档](DEPLOYMENT.md)。

---

## 📖 使用说明

### 生成第一个PRD

1. 打开应用，在文本框中输入你的产品想法（至少50字符）
2. 点击"生成PRD"按钮
3. 等待30秒左右，AI将生成完整的PRD文档
4. 查看生成的PRD，包含所有专业章节

### 示例提示词

```
我想做一个面向自由职业者的AI写作助手，可以帮助他们：
1. 快速生成文章大纲
2. 润色和优化文本
3. 检查语法和拼写错误
4. 提供写作建议
主要用户是自媒体作者和内容创作者，希望提高写作效率和质量。
```

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 开发路线图

- [x] MVP 版本 - 基础PRD生成
- [x] 会话历史管理
- [x] RICE 优先级排序
- [ ] PRD 导出功能 (PDF/Markdown)
- [ ] 用户认证系统
- [ ] 多模型支持 (GPT-4, Claude)
- [ ] 团队协作功能
- [ ] 移动端适配

查看完整路线图：[AI_PRD_Agent_PRD.md](AI_PRD_Agent_PRD.md)

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Prisma](https://www.prisma.io/) - 数据库ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库
- [智谱AI](https://open.bigmodel.cn/) - AI模型支持

---

<div align="center">

**如果这个项目对你有帮助，请考虑给它一颗⭐️**

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div>
