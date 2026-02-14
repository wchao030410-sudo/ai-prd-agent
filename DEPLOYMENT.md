# 🚀 AI PRD Agent 部署指南

本指南将帮助你将 AI PRD Agent 部署到生产环境。

---

## 📋 部署前准备

### 必需资源

| 资源 | 说明 | 获取链接 |
|:---|:---|:---|
| **智谱 API Key** | 用于AI生成PRD | [https://open.bigmodel.cn/usercenter/apikeys](https://open.bigmodel.cn/usercenter/apikeys) |
| **GitHub账号** | 用于代码托管和CI/CD | [https://github.com](https://github.com) |
| **Vercel账号** | 用于部署（推荐） | [https://vercel.com](https://vercel.com) |

### 智谱API Key 获取步骤

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入「用户中心」→「API密钥」
4. 点击「新增API密钥」
5. 复制生成的密钥（格式：`id.secret`）

---

## 🌐 Vercel 部署（推荐）

Vercel 是 Next.js 官方推荐的部署平台，提供免费的额度。

### 步骤 1：准备代码

1. **将代码推送到 GitHub**
```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/ai-prd-agent.git
git push -u origin main
```

2. **确保 `.gitignore` 正确配置**
```
.env
.env.local
*.db
*.db-journal
node_modules
.next
```

### 步骤 2：导入 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New..."** → **"Project"**
3. 导入你的 GitHub 仓库 `ai-prd-agent`
4. Vercel 会自动检测项目配置

### 步骤 3：配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|:---|:---|:---|
| `ZHIPU_API_KEY` | `你的API密钥` | 从智谱平台获取 |
| `DATABASE_URL` | `postgresql://...` | Vercel Postgres 自动生成 |

### 步骤 4：配置数据库

**使用 Vercel Postgres（推荐）**

1. 在 Vercel 项目中，点击 **"Storage"** → **"Create Database"**
2. 选择 **"Postgres"**
3. Vercel 会自动：
   - 创建数据库实例
   - 生成 `DATABASE_URL`
   - 连接到你的项目

4. **运行数据库迁移**

在 Vercel 部署完成后，执行以下命令：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 推送数据库 schema
vercel env pull .env.local
npx prisma db push
```

### 步骤 5：部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（约1-2分钟）
3. 部署成功后，你会获得一个 `.vercel.app` 域名

### 步骤 6：验证部署

1. 访问你的 Vercel 域名
2. 测试 PRD 生成功能
3. 检查数据库连接是否正常

---

## 🔄 自动部署

配置完成后，每次你推送代码到 GitHub 的 `main` 分支，Vercel 会自动重新部署。

```bash
git add .
git commit -m "Add new feature"
git push origin main
# Vercel 会自动构建和部署
```

---

## 🐳 Docker 部署（可选）

如果你更喜欢 Docker，可以使用以下配置：

### Dockerfile

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

### 运行容器

```bash
# 构建镜像
docker build -t ai-prd-agent .

# 运行容器
docker run -p 3000:3000 \
  -e ZHIPU_API_KEY=your_key \
  -e DATABASE_URL=file:./dev.db \
  ai-prd-agent
```

---

## 🔧 常见问题

### Q1: 部署后 API 调用失败？

**A:** 检查以下几点：
1. 环境变量 `ZHIPU_API_KEY` 是否正确设置
2. API Key 是否有足够的额度
3. Vercel 函数日志是否显示错误信息

### Q2: 数据库连接错误？

**A:**
1. 确保 `DATABASE_URL` 格式正确
2. 检查 Vercel Postgres 是否正常启动
3. 运行 `npx prisma db push` 更新 schema

### Q3: 构建失败？

**A:**
1. 检查 `package.json` 中的依赖版本
2. 确保 Node.js 版本 >= 18
3. 查看 Vercel 构建日志的具体错误

### Q4: 如何获取自定义域名？

**A:**
1. 在 Vercel 项目设置中，点击 **"Domains"**
2. 添加你的域名
3. 按照提示配置 DNS 记录

---

## 📊 监控和日志

### Vercel Analytics

Vercel 提供免费的分析工具：

1. 在项目设置中启用 **"Web Analytics"**
2. 查看 **Analytics** 标签页了解：
   - 页面访问量
   - API 响应时间
   - 错误率

### 日志查看

```bash
# 使用 Vercel CLI 查看实时日志
vercel logs

# 查看特定部署的日志
vercel logs <deployment-url>
```

---

## 🔒 安全最佳实践

1. **永远不要提交 `.env` 文件到 Git**
2. **定期轮换 API Key**
3. **启用 Vercel 的环境变量加密**
4. **设置速率限制**（在 API 路由中）
5. **定期备份数据库**

---

## 📈 优化建议

### 性能优化

1. **启用 ISR（增量静态再生成）**
   ```typescript
   export const revalidate = 3600; // 1小时
   ```

2. **配置 CDN 缓存**
   - Vercel 自动配置 Edge Network
   - 静态资源自动缓存

3. **优化图片**
   ```typescript
   import Image from 'next/image';
   // 使用 Next.js Image 组件
   ```

### 成本优化

1. **监控 API 调用量**
   - 在 Prisma 中记录每次调用的 Token 数
   - 设置月度消费预警

2. **使用 Vercel 免费额度**
   - 每月 100GB 流量
   - 无限次部署
   - 1000 次 Edge Function 调用/天

---

## 🎉 部署成功后的清单

- [ ] 项目可在线访问
- [ ] PRD 生成功能正常
- [ ] 数据库读写正常
- [ ] 环境变量已配置
- [ ] 自定义域名已设置（可选）
- [ ] 监控和日志已启用
- [ ] README 中的演示链接已更新

---

**需要帮助？** 请查看 [Vercel 官方文档](https://vercel.com/docs) 或提交 Issue。
