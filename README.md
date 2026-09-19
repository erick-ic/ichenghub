# iChengHub

iChengHub 是一个集 AI 工具导航、提示词、技术博客和实用工具于一体的中英文网站，支持个人收藏、使用足迹、工具推荐和需求反馈。

站点地址：[ichenghub.cn](https://ichenghub.cn)

## 功能

- **工具与网址导航**：按分类浏览工具、查看详情和访问外部资源。
- **提示词库**：浏览、复制与收藏提示词。
- **技术博客**：中英文文章、Markdown 渲染、代码高亮、目录与收藏。
- **实用工具**：图片压缩、二维码生成、AI 额度追踪；额度配置与记录保存在当前浏览器的 `localStorage` 中。
- **个人中心**：GitHub / Gitee 登录、登录方式绑定与解绑、收藏、使用足迹和提交记录。账号至少保留一种登录方式。
- **提交与反馈**：推荐工具、提交需求、查看审核结果和通知。
- **国际化**：支持中文和英文，页面路由使用 `/zh`、`/en` 前缀，默认语言为中文。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 应用框架 | Next.js 14.2、React 18、TypeScript |
| 样式与组件 | Tailwind CSS、Radix UI、Lucide |
| 数据库 | PostgreSQL、Prisma 5 |
| 用户认证 | Auth.js / NextAuth v5 beta、Prisma Adapter、数据库会话 |
| 国际化 | next-intl |
| 内容渲染 | react-markdown、Prism |
| 部署 | Next.js standalone、PM2、反向代理 |

具体依赖版本见 [platform/package.json](platform/package.json)。

## 项目结构

```text
iChengHub/
├── README.md
└── platform/                     # 应用根目录，npm 与 Prisma 命令在此执行
    ├── auth.ts                   # GitHub / Gitee 认证配置
    ├── prisma/
    │   ├── schema.prisma         # 数据模型
    │   └── migrations/           # 数据库迁移
    ├── public/                   # 静态资源
    ├── src/
    │   ├── app/
    │   │   ├── [locale]/         # 中英文页面
    │   │   ├── api/             # API 与 OAuth 路由
    │   │   └── actions/         # Server Actions
    │   ├── components/          # 页面和业务组件
    │   ├── hooks/               # React Hooks
    │   ├── i18n/                # 国际化配置与文案
    │   ├── lib/                 # 数据访问和公共逻辑
    │   └── middleware.ts        # 语言路由处理
    ├── next.config.mjs          # Next.js 与 standalone 配置
    ├── ecosystem.config.js      # PM2 配置
    └── deploy.sh                # standalone 打包脚本
```

## 本地开发

准备 Node.js、npm 和一个可连接的 PostgreSQL 数据库。项目未固定 Node.js 版本，运行环境需满足 `package-lock.json` 中依赖的版本要求。

### 1. 安装依赖

```bash
cd platform
npm ci
```

### 2. 配置环境变量

在 `platform/` 下创建 `.env`，替换下方占位值。该文件已被 Git 忽略。

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/ichenghub"
AUTH_SECRET="replace-with-a-random-secret-at-least-32-characters"

AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
AUTH_GITEE_ID="your-gitee-client-id"
AUTH_GITEE_SECRET="your-gitee-client-secret"
```

`AUTH_SECRET` 用于用户认证，使用至少 32 个字符的随机密钥，可通过 `openssl rand -base64 32` 生成。用户通过 GitHub 或 Gitee OAuth 登录。

当前数据库连接代码会追加 `?connect_timeout=10`，因此示例连接串不包含查询参数。需要额外连接参数时，应同步调整 [Prisma 连接配置](platform/src/lib/prisma.ts)。

### 3. 初始化数据库并启动

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

迁移用于创建和更新表结构，当前项目未配置种子数据脚本，不会自动填充工具、链接、提示词和博客等内容。

- 中文首页：[http://localhost:3000/zh](http://localhost:3000/zh)
- 英文首页：[http://localhost:3000/en](http://localhost:3000/en)
- 个人中心：[http://localhost:3000/zh/profile](http://localhost:3000/zh/profile)

## OAuth 配置

在对应平台创建 OAuth 应用，将 Client ID 和 Client Secret 写入 `.env`。开发环境回调地址如下：

| 平台 | 回调地址 |
| --- | --- |
| GitHub | `http://localhost:3000/api/auth/callback/github` |
| Gitee | `http://localhost:3000/api/auth/callback/gitee` |

生产环境将域名替换为实际的 HTTPS 站点地址，回调路径不包含语言前缀。开发与生产分别使用回调地址匹配的应用凭据。

Gitee 需要 `user_info` 和 `emails` 权限。系统只采纳邮箱列表中 `state === 'confirmed'` 的邮箱，优先使用已确认的主邮箱。不同平台不会仅凭相同邮箱自动合并账号；用户需先登录原账号，再从个人中心绑定其他平台。

## 常用命令

以下命令均在 `platform/` 目录执行：

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务 |
| `npm run build` | 构建生产版本与 standalone 产物 |
| `npm run lint` | ESLint 检查 |
| `npx tsc --noEmit` | TypeScript 类型检查 |
| `npx prisma generate` | 生成 Prisma Client |
| `npx prisma migrate dev --name <name>` | 在开发数据库上创建并应用迁移 |
| `npx prisma migrate deploy` | 应用已有迁移，适用于部署环境 |
| `npx prisma studio` | 查看和维护数据库数据 |

修改数据模型时同步提交迁移文件；修改界面文案时同步维护 `platform/src/i18n/messages/zh.json` 和 `en.json`。当前未配置统一的自动化测试命令。