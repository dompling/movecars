/**
 * 简单路由器
 */
import type { Env, RouteContext } from './types';

type Handler = (ctx: RouteContext) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  private addRoute(method: string, path: string, handler: Handler) {
    // 将路径转换为正则表达式
    const paramNames: string[] = [];
    const pattern = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
      handler,
    });
  }

  get(path: string, handler: Handler) {
    this.addRoute('GET', path, handler);
    return this;
  }

  post(path: string, handler: Handler) {
    this.addRoute('POST', path, handler);
    return this;
  }

  put(path: string, handler: Handler) {
    this.addRoute('PUT', path, handler);
    return this;
  }

  delete(path: string, handler: Handler) {
    this.addRoute('DELETE', path, handler);
    return this;
  }

  async handle(request: Request, env: Env): Promise<Response | null> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = pathname.match(route.pattern);
      if (!match) continue;

      // 提取参数
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });

      const ctx: RouteContext = { request, env, params };
      return route.handler(ctx);
    }

    return null;
  }
}
