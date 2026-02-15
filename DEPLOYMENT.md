# Vercel 部署指南

## 概述

本项目是一个用于学习日语台词的全栈Web应用，使用 Next.js、Prisma、PostgreSQL 和 DeepSeek API 构建。

## 前置要求

- GitHub 账户
- Vercel 账户
- DeepSeek API 密钥
- 云端 PostgreSQL 数据库（Vercel Postgres 或 Supabase）

---

## 部署步骤

### 1. 推送代码到 GitHub

如果尚未推送到 GitHub：

```bash
# 在 GitHub 上创建新仓库后，执行以下命令
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 2. 在 Vercel 中创建项目

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New..." → "Project"
3. 导入你的 GitHub 仓库
4. 点击 "Import" 按钮

### 3. 配置环境变量

在 Vercel 项目设置中（Settings → Environment Variables），添加以下环境变量：

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://user:pass@host:5432/db` | 是 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-xxxxxxxx` | 是 |
| `NEXT_PUBLIC_APP_URL` | 应用 URL | `https://your-app.vercel.app` | 否（Vercel 自动设置） |

**注意**：
- 不要将真实的密钥提交到代码中
- 这些变量在部署后可通过 `process.env.VARIABLE_NAME` 访问

### 4. 设置云端数据库

你需要一个云端的 PostgreSQL 数据库。推荐使用：

#### 选项 A：Vercel Postgres（推荐）

1. 在 Vercel 项目中点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "Postgres" 并创建
4. Vercel 会自动将 `DATABASE_URL` 添加到环境变量

#### 选项 B：Supabase

1. 访问 [supabase.com](https://supabase.com) 创建项目
2. 在项目设置中找到 "Connection String"
3. 复制 "URI" 格式的连接字符串
4. 将 `DATABASE_URL` 添加到 Vercel 环境变量

### 5. 运行数据库迁移

由于项目使用 Prisma，需要将数据库 schema 同步到生产数据库：

#### 方法 1：本地运行（推荐用于首次部署）

```bash
# 获取云端数据库连接字符串
vercel env pull .env.production

# 运行数据库推送
npx prisma db push
```

#### 方法 2：通过 Vercel CLI

```bash
# 安装 Vercel CLI（如果尚未安装）
npm i -g vercel

# 登录 Vercel
vercel login

# 推送数据库 schema
DATABASE_URL="你的云端数据库连接字符串" npx prisma db push
```

### 6. 部署应用

1. 在 Vercel 项目页面点击 "Deploy" 按钮
2. Vercel 会自动：
   - 安装依赖（`npm install`）
   - 构建项目（`npm run build`）
   - 启动应用（`npm start`）
3. 部署完成后，你会获得一个 HTTPS URL（如 `https://your-app.vercel.app`）

---

## 部署后操作

### 测试应用

1. 访问你的 Vercel 应用 URL
2. 检查首页是否正常加载
3. 尝试上传 CSV 文件并测试功能

### 上传脚本数据

由于生产环境没有数据，你需要上传 CSV 文件来初始化脚本数据：

1. 准备包含日本游戏台词的 CSV 文件
2. 在应用中上传该文件
3. 验证脚本列表显示正确

### 检查日志

如果遇到问题，可以在 Vercel 项目中查看日志：
- 进入 "Logs" 标签
- 查看 "Build Logs"（构建日志）和 "Runtime Logs"（运行时日志）

---

## 更新部署

### 更新代码

1. 本地修改代码
2. 提交并推送到 GitHub：
   ```bash
   git add .
   git commit -m "描述你的更改"
   git push
   ```
3. Vercel 会自动检测更改并重新部署

### 更新数据库 Schema

如果你修改了 `prisma/schema.prisma`：

```bash
# 同步 schema 到生产数据库
npx prisma db push
```

---

## 环境变量说明

### DATABASE_URL

PostgreSQL 数据库连接字符串，格式：
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]
```

示例：
- 本地：`postgresql://stevelin@localhost:5432/japanese_script_learning`
- Vercel Postgres：自动生成
- Supabase：从 Supabase 项目设置中获取

### DEEPSEEK_API_KEY

DeepSeek API 密钥，用于生成学习材料。

获取方式：
1. 访问 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册/登录账户
3. 在 API Keys 页面创建新密钥

### NEXT_PUBLIC_APP_URL

应用的基础 URL，用于生成链接等。

- 开发环境：`http://localhost:3000`
- 生产环境：`https://your-app.vercel.app`（Vercel 自动设置）

---

## 故障排查

### 问题 1：部署失败

**原因**：可能是环境变量未设置或构建错误。

**解决方法**：
1. 检查 Vercel 构建日志
2. 确保所有必需的环境变量已设置
3. 确认 `package.json` 中的脚本正确

### 问题 2：数据库连接错误

**原因**：`DATABASE_URL` 配置不正确或数据库不可访问。

**解决方法**：
1. 验证 `DATABASE_URL` 格式正确
2. 确认数据库已创建且可访问
3. 检查数据库是否允许 Vercel 的 IP 访问

### 问题 3：DeepSeek API 错误

**原因**：API 密钥无效或过期。

**解决方法**：
1. 确认 `DEEPSEEK_API_KEY` 正确设置
2. 检查 API 密钥是否有效
3. 查看 DeepSeek API 文档确认使用方式

### 问题 4：页面显示 404

**原因**：可能是路由配置问题或文件未正确部署。

**解决方法**：
1. 检查 `app/` 目录下的文件结构
2. 确认文件命名符合 Next.js App Router 规范
3. 查看运行时日志获取更多错误信息

---

## 成本估算

### Vercel 免费套餐

- 每月 100GB 带宽
- 每月 6,000 分钟构建时间
- 无服务器函数执行时间限制（按需付费）
- 适合小型项目和个人使用

### Vercel Postgres 定价

- Hobby：$0/月（512MB 存储）
- Pro：$20/月（8GB 存储）

### DeepSeek API 定价

根据 DeepSeek 官方定价：
- 按实际使用的 token 数量计费
- 新用户通常有免费额度

---

## 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Vercel 文档](https://vercel.com/docs)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)

---

## 附录

### 项目结构

```
japanese-script-learning/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── script/            # 脚本列表页面
│   ├── learning/[id]/     # 学习材料页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 首页
├── components/            # React 组件
├── lib/                  # 工具库
│   ├── db/              # Prisma 客户端
│   ├── deepseek/        # DeepSeek API 集成
│   └── csv/             # CSV 解析器
├── prisma/              # 数据库模型
│   └── schema.prisma
├── .env.example         # 环境变量示例
├── next.config.mjs      # Next.js 配置
├── package.json        # 依赖和脚本
└── DEPLOYMENT.md       # 本文档
```

### 可用脚本

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# Prisma 生成客户端
npm run db:generate

# Prisma 推送 schema 到数据库
npm run db:push

# Prisma Studio（数据库可视化）
npm run db:studio
```
