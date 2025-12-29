# 智能挪车通知系统 - 项目规划

## 项目概述

基于 Cloudflare Workers 的智能挪车通知系统，支持多车主模式，前端嵌入 Worker 部署。

## 技术栈

- **后端**: Cloudflare Workers + KV 存储
- **前端**: React 18 + TypeScript + TailwindCSS
- **构建**: Vite + Wrangler
- **设计**: iOS 26 风格

## 架构设计

### 页面路由

| 路由 | 描述 | 访问者 |
|------|------|--------|
| `/` | 首页/车主注册 | 新车主 |
| `/admin/{ownerId}?token=xxx` | 车主管理后台 | 车主本人 |
| `/c/{ownerId}` | 挪车请求页面 | 访客扫码 |
| `/w/{requestId}` | 请求者等待页 | 请求者 |
| `/r/{requestId}` | 车主确认页面 | 车主 |

### KV 存储结构

- `owner:{ownerId}` - 车主配置信息
- `request:{requestId}` - 挪车请求记录（24小时过期）

### 推送渠道

- Bark (iOS)
- Pushplus
- Server酱
- Telegram

## 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 样式使用 TailwindCSS
- API 使用 RESTful 风格

## 目录结构

```
src/
├── worker/          # Cloudflare Worker 后端
│   ├── handlers/    # API 处理器
│   ├── services/    # 业务服务
│   └── types.ts     # 类型定义
└── frontend/        # React 前端
    ├── pages/       # 页面组件
    ├── components/  # UI 组件
    ├── hooks/       # 自定义 Hooks
    └── utils/       # 工具函数
```
