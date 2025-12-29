/**
 * 用户认证相关 API 处理器
 */
import type { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, RouteContext, User } from '../types';
import {
  createSession,
  createUser,
  deleteSession,
  generateId,
  generateSessionToken,
  getSession,
  getUser,
  getUserByPhone,
  getUserOwners,
  hashPassword,
  phoneExists,
  verifyPassword,
} from '../services/kv';

/**
 * JSON 响应工具函数
 */
function jsonResponse<T>(data: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * 验证手机号格式
 */
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证密码强度
 */
function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 32;
}

/**
 * 用户注册
 * POST /api/user/register
 */
export async function handleRegister(ctx: RouteContext): Promise<Response> {
  try {
    const body = await ctx.request.json() as RegisterRequest;

    // 验证必填字段
    if (!body.phone || !body.password) {
      return jsonResponse({ success: false, error: '请输入手机号和密码' }, 400);
    }

    // 验证手机号格式
    if (!isValidPhone(body.phone)) {
      return jsonResponse({ success: false, error: '手机号格式不正确' }, 400);
    }

    // 验证密码强度
    if (!isValidPassword(body.password)) {
      return jsonResponse({ success: false, error: '密码长度需要 6-32 位' }, 400);
    }

    // 检查手机号是否已注册
    if (await phoneExists(ctx.env.MOVECARS_KV, body.phone)) {
      return jsonResponse({ success: false, error: '该手机号已注册' }, 400);
    }

    // 创建用户
    const user: User = {
      id: generateId(12),
      phone: body.phone,
      passwordHash: await hashPassword(body.password),
      createdAt: Date.now(),
    };

    await createUser(ctx.env.MOVECARS_KV, user);

    // 自动登录，创建会话
    const token = generateSessionToken();
    const expiresAt = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000; // 永久有效（100年）

    await createSession(ctx.env.MOVECARS_KV, {
      userId: user.id,
      token,
      expiresAt,
    });

    return jsonResponse<LoginResponse>({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
        },
        token,
        expiresAt,
      },
      message: '注册成功',
    });
  } catch (error) {
    return jsonResponse({ success: false, error: '注册失败: ' + String(error) }, 500);
  }
}

/**
 * 用户登录
 * POST /api/user/login
 */
export async function handleLogin(ctx: RouteContext): Promise<Response> {
  try {
    const body = await ctx.request.json() as LoginRequest;

    // 验证必填字段
    if (!body.phone || !body.password) {
      return jsonResponse({ success: false, error: '请输入手机号和密码' }, 400);
    }

    // 查找用户
    const user = await getUserByPhone(ctx.env.MOVECARS_KV, body.phone);
    if (!user) {
      return jsonResponse({ success: false, error: '手机号或密码错误' }, 401);
    }

    // 验证密码
    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      return jsonResponse({ success: false, error: '手机号或密码错误' }, 401);
    }

    // 创建会话
    const token = generateSessionToken();
    const expiresAt = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000; // 永久有效（100年）

    await createSession(ctx.env.MOVECARS_KV, {
      userId: user.id,
      token,
      expiresAt,
    });

    return jsonResponse<LoginResponse>({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
        },
        token,
        expiresAt,
      },
      message: '登录成功',
    });
  } catch (error) {
    return jsonResponse({ success: false, error: '登录失败: ' + String(error) }, 500);
  }
}

/**
 * 用户登出
 * POST /api/user/logout
 */
export async function handleLogout(ctx: RouteContext): Promise<Response> {
  const authHeader = ctx.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    await deleteSession(ctx.env.MOVECARS_KV, token);
  }

  return jsonResponse({ success: true, message: '已登出' });
}

/**
 * 获取当前用户信息
 * GET /api/user/me
 */
export async function handleGetCurrentUser(ctx: RouteContext): Promise<Response> {
  const authHeader = ctx.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return jsonResponse({ success: false, error: '未登录' }, 401);
  }

  const session = await getSession(ctx.env.MOVECARS_KV, token);
  if (!session) {
    return jsonResponse({ success: false, error: '会话已过期，请重新登录' }, 401);
  }

  const user = await getUser(ctx.env.MOVECARS_KV, session.userId);
  if (!user) {
    return jsonResponse({ success: false, error: '用户不存在' }, 404);
  }

  return jsonResponse({
    success: true,
    data: {
      id: user.id,
      phone: user.phone,
      createdAt: user.createdAt,
    },
  });
}

/**
 * 获取用户的所有挪车码
 * GET /api/user/owners
 */
export async function handleGetUserOwners(ctx: RouteContext): Promise<Response> {
  const authHeader = ctx.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return jsonResponse({ success: false, error: '未登录' }, 401);
  }

  const session = await getSession(ctx.env.MOVECARS_KV, token);
  if (!session) {
    return jsonResponse({ success: false, error: '会话已过期，请重新登录' }, 401);
  }

  const owners = await getUserOwners(ctx.env.MOVECARS_KV, session.userId);

  // 返回车主列表（不包含敏感的推送配置详情）
  const safeOwners = owners.map(owner => ({
    id: owner.id,
    name: owner.name,
    carPlate: owner.carPlate,
    adminToken: owner.adminToken,
    createdAt: owner.createdAt,
  }));

  return jsonResponse({
    success: true,
    data: safeOwners,
  });
}
