# 智能挪车通知系统

基于 Cloudflare Workers 的智能挪车通知系统，扫码即可通知车主，支持多种推送渠道。

## 功能特点

- 🚗 **扫码即通知** - 他人扫码后即可通知车主挪车
- 📍 **位置共享** - 双向位置分享，快速找到对方
- 🔔 **多渠道推送** - 支持 Bark、Pushplus、Server酱、Telegram
- 🔒 **隐私保护** - 不暴露手机号，安全放心
- 📱 **iOS 风格** - 精美的 iOS 26 设计风格
- ⚡ **极速部署** - Cloudflare Workers 全球边缘节点

## 工作流程

```
请求者                              车主
  │                                  │
  ├─ 扫码进入页面                     │
  ├─ 填写留言、获取位置                │
  ├─ 点击发送                         │
  │   ├─ 有位置 → 立即推送 ──────────→ 收到通知
  │   └─ 无位置 → 30秒后推送 ────────→ 收到通知
  │                                  │
  ├─ 等待中...                        ├─ 查看请求者位置
  │                                  ├─ 点击确认，分享位置
  │                                  │
  ├─ 收到确认，查看车主位置 ←──────────┤
  │                                  │
  ▼                                  ▼
```

## 快速部署

### 前置要求

- [Node.js](https://nodejs.org/) 18+
- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd movecars
npm install
```

### 2. 本地开发

```bash
# 同时启动前端和 Worker 开发服务器
npm run dev
```

访问 http://localhost:5173

> **本地开发说明：**
> - 使用 `--local` 模式运行 Worker，KV 数据存储在本地 `.wrangler` 目录
> - 无需配置真实的 KV namespace ID
> - API 请求自动代理到 Worker (8787 端口)

### 5. 部署到 Cloudflare

**方式一：通过 GitHub Actions（推荐）**

推送代码到 `main` 分支即可自动部署，Actions 会自动创建/获取 KV namespace。

**方式二：手动部署**

```bash
npm run deploy
```

> 首次部署会自动创建 KV namespace

部署成功后会显示访问地址，如 `https://movecars.your-subdomain.workers.dev`

### 6. 绑定自定义域名（可选）

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的 Workers
3. 点击 "Settings" → "Triggers"
4. 添加自定义域名

## GitHub Actions 自动部署

项目已配置 GitHub Actions，推送到 `main` 或 `master` 分支时自动部署。

### 配置步骤

1. 在 GitHub 仓库中进入 **Settings** → **Secrets and variables** → **Actions**

2. 添加以下 Secrets：

   | Secret 名称 | 说明 | 获取方式 |
   |------------|------|---------|
   | `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | [创建 Token](https://dash.cloudflare.com/profile/api-tokens)，选择 "Edit Cloudflare Workers" 模板 |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | 在 Workers 页面右侧栏可以找到 |

3. 推送代码后会自动触发部署

### 手动触发部署

在 GitHub 仓库的 **Actions** 页面，选择 "Deploy to Cloudflare Workers" workflow，点击 "Run workflow"。

## 推送渠道配置

### Bark (iOS 推荐)

1. 在 App Store 下载 [Bark](https://apps.apple.com/app/bark-customed-notifications/id1403753865)
2. 打开 App，复制你的 Key
3. 服务器地址默认为 `https://api.day.app`

### Pushplus

1. 访问 [pushplus.plus](https://www.pushplus.plus/)
2. 微信扫码登录
3. 复制你的 Token

### Server酱

1. 访问 [sct.ftqq.com](https://sct.ftqq.com/)
2. 登录并获取 SendKey

### Telegram

1. 在 Telegram 中找到 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 创建机器人，获取 Bot Token
3. 找到 [@userinfobot](https://t.me/userinfobot) 获取你的 Chat ID

## 项目结构

```
movecars/
├── src/
│   ├── worker/                 # Cloudflare Worker 后端
│   │   ├── index.ts            # Worker 入口
│   │   ├── router.ts           # API 路由
│   │   ├── handlers/           # 请求处理器
│   │   │   ├── owner.ts        # 车主 API
│   │   │   └── request.ts      # 挪车请求 API
│   │   ├── services/           # 服务层
│   │   │   ├── kv.ts           # KV 存储
│   │   │   └── notification.ts # 推送服务
│   │   └── types.ts            # 类型定义
│   │
│   └── frontend/               # React 前端
│       ├── pages/              # 页面组件
│       ├── components/         # UI 组件
│       ├── hooks/              # 自定义 Hooks
│       └── utils/              # 工具函数
│
├── wrangler.toml               # Cloudflare 配置
├── vite.config.ts              # Vite 配置
└── package.json
```

## API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/owner` | 创建车主 |
| GET | `/api/owner/:id` | 获取车主公开信息 |
| GET | `/api/owner/:id/full?token=xxx` | 获取车主完整信息 |
| PUT | `/api/owner/:id?token=xxx` | 更新车主配置 |
| DELETE | `/api/owner/:id?token=xxx` | 删除车主 |
| POST | `/api/owner/:id/test-push?token=xxx` | 测试推送 |
| POST | `/api/request` | 创建挪车请求 |
| GET | `/api/request/:id` | 获取请求状态 |
| PUT | `/api/request/:id/confirm` | 车主确认请求 |

## 常见问题

### 推送收不到？

1. 检查推送配置是否正确
2. 使用管理后台的"发送测试通知"功能测试
3. 检查推送服务是否正常（Bark 服务器、Pushplus 账号等）

### 位置获取失败？

1. 确保使用 HTTPS 访问（位置 API 需要安全上下文）
2. 检查浏览器是否授权了位置权限
3. 部分浏览器可能需要手动开启位置服务

### 如何更换推送渠道？

进入管理后台，在"推送渠道"中选择新的渠道并填写配置，保存后即可生效。

## 技术栈

- **后端**: Cloudflare Workers + KV
- **前端**: React 18 + TypeScript + TailwindCSS
- **构建**: Vite + Wrangler
- **设计**: iOS 26 风格

## 开源协议

MIT License

## 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
