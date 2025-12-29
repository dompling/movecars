/**
 * Cloudflare Worker 入口
 * 智能挪车通知系统
 */
import type { Env } from './types';
import { Router } from './router';
import {
  handleCreateOwner,
  handleGetOwner,
  handleGetOwnerFull,
  handleUpdateOwner,
  handleDeleteOwner,
  handleTestPush,
} from './handlers/owner';
import {
  handleCreateRequest,
  handleGetRequest,
  handleDelayedNotify,
  handleConfirmRequest,
  handleCompleteRequest,
} from './handlers/request';

// 内联前端 HTML（构建时会被替换）
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#F2F2F7" />
  <title>智能挪车</title>
  <script type="module" crossorigin src="/assets/main.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/main.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

// 创建路由器
const apiRouter = new Router();

// 车主相关 API
apiRouter.post('/api/owner', handleCreateOwner);
apiRouter.get('/api/owner/:id', handleGetOwner);
apiRouter.get('/api/owner/:id/full', handleGetOwnerFull);
apiRouter.put('/api/owner/:id', handleUpdateOwner);
apiRouter.delete('/api/owner/:id', handleDeleteOwner);
apiRouter.post('/api/owner/:id/test-push', handleTestPush);

// 挪车请求相关 API
apiRouter.post('/api/request', handleCreateRequest);
apiRouter.get('/api/request/:id', handleGetRequest);
apiRouter.post('/api/request/:id/notify', handleDelayedNotify);
apiRouter.put('/api/request/:id/confirm', handleConfirmRequest);
apiRouter.put('/api/request/:id/complete', handleCompleteRequest);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // API 路由
    if (url.pathname.startsWith('/api/')) {
      const response = await apiRouter.handle(request, env);
      if (response) {
        // 添加 CORS 头
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(response.body, {
          status: response.status,
          headers,
        });
      }
      return new Response(JSON.stringify({ success: false, error: 'API 不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 静态资源处理
    if (url.pathname.startsWith('/assets/')) {
      // 在实际部署中，这里会由 [site] 配置处理
      // 返回 404 让 Workers Sites 处理
      return new Response('Not Found', { status: 404 });
    }

    // 所有其他路由返回 SPA HTML
    return new Response(HTML_TEMPLATE, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache',
      },
    });
  },
};
