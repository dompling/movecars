/**
 * 车主相关 API 处理器
 */
import type {ApiResponse, CreateOwnerRequest, Owner, OwnerPublic, RouteContext, UpdateOwnerRequest} from '../types';
import {
  createOwner,
  deleteOwner,
  generateAdminToken,
  generateId,
  getOwner,
  ownerExists,
  updateOwner
} from '../services/kv';
import {testNotification} from '../services/notification';

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
 * 创建车主
 * POST /api/owner
 */
export async function handleCreateOwner(ctx: RouteContext): Promise<Response> {
  try {
    const body = await ctx.request.json() as CreateOwnerRequest;

    // 验证必填字段
    if (!body.name || !body.pushChannel || !body.pushConfig) {
      return jsonResponse({ success: false, error: '缺少必填字段' }, 400);
    }

    // 验证推送配置
    const channel = body.pushChannel;
    if (channel === 'bark' && !body.pushConfig.bark) {
      return jsonResponse({ success: false, error: '请填写 Bark 配置' }, 400);
    }
    if (channel === 'pushplus' && !body.pushConfig.pushplus) {
      return jsonResponse({ success: false, error: '请填写 Pushplus 配置' }, 400);
    }
    if (channel === 'serverchan' && !body.pushConfig.serverchan) {
      return jsonResponse({ success: false, error: '请填写 Server酱配置' }, 400);
    }
    if (channel === 'telegram' && !body.pushConfig.telegram) {
      return jsonResponse({ success: false, error: '请填写 Telegram 配置' }, 400);
    }

    // 生成唯一 ID
    let ownerId = generateId(6);
    while (await ownerExists(ctx.env.MOVECARS_KV, ownerId)) {
      ownerId = generateId(6);
    }

    const owner: Owner = {
      id: ownerId,
      name: body.name,
      carPlate: body.carPlate,
      defaultReply: body.defaultReply,
      pushChannel: body.pushChannel,
      pushConfig: body.pushConfig,
      adminToken: generateAdminToken(),
      createdAt: Date.now(),
    };

    await createOwner(ctx.env.MOVECARS_KV, owner);

    return jsonResponse({
      success: true,
      data: {
        id: owner.id,
        adminToken: owner.adminToken,
        adminUrl: `/admin/${owner.id}?token=${owner.adminToken}`,
        qrcodeUrl: `/c/${owner.id}`,
      },
      message: '车主创建成功',
    });
  } catch (error) {
    return jsonResponse({ success: false, error: '创建失败: ' + String(error) }, 500);
  }
}

/**
 * 获取车主公开信息
 * GET /api/owner/:id
 */
export async function handleGetOwner(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;

  const owner = await getOwner(ctx.env.MOVECARS_KV, id);
  if (!owner) {
    return jsonResponse({ success: false, error: '车主不存在' }, 404);
  }

  const publicInfo: OwnerPublic = {
    id: owner.id,
    name: owner.name,
    carPlate: owner.carPlate,
  };

  return jsonResponse({ success: true, data: publicInfo });
}

/**
 * 获取车主完整信息（需要 adminToken）
 * GET /api/owner/:id/full?token=xxx
 */
export async function handleGetOwnerFull(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;
  const url = new URL(ctx.request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return jsonResponse({ success: false, error: '缺少认证 Token' }, 401);
  }

  const owner = await getOwner(ctx.env.MOVECARS_KV, id);
  if (!owner) {
    return jsonResponse({ success: false, error: '车主不存在' }, 404);
  }

  if (owner.adminToken !== token) {
    return jsonResponse({ success: false, error: '认证失败' }, 403);
  }

  return jsonResponse({
    success: true,
    data: {
      ...owner,
      adminToken: undefined, // 不返回 token
    }
  });
}

/**
 * 更新车主配置
 * PUT /api/owner/:id?token=xxx
 */
export async function handleUpdateOwner(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;
  const url = new URL(ctx.request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return jsonResponse({ success: false, error: '缺少认证 Token' }, 401);
  }

  const owner = await getOwner(ctx.env.MOVECARS_KV, id);
  if (!owner) {
    return jsonResponse({ success: false, error: '车主不存在' }, 404);
  }

  if (owner.adminToken !== token) {
    return jsonResponse({ success: false, error: '认证失败' }, 403);
  }

  try {
    const body = await ctx.request.json() as UpdateOwnerRequest;

    const updatedOwner: Owner = {
      ...owner,
      name: body.name ?? owner.name,
      carPlate: body.carPlate ?? owner.carPlate,
      defaultReply: body.defaultReply ?? owner.defaultReply,
      pushChannel: body.pushChannel ?? owner.pushChannel,
      pushConfig: body.pushConfig ?? owner.pushConfig,
      updatedAt: Date.now(),
    };

    await updateOwner(ctx.env.MOVECARS_KV, updatedOwner);

    return jsonResponse({ success: true, message: '更新成功' });
  } catch (error) {
    return jsonResponse({ success: false, error: '更新失败: ' + String(error) }, 500);
  }
}

/**
 * 删除车主
 * DELETE /api/owner/:id?token=xxx
 */
export async function handleDeleteOwner(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;
  const url = new URL(ctx.request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return jsonResponse({ success: false, error: '缺少认证 Token' }, 401);
  }

  const owner = await getOwner(ctx.env.MOVECARS_KV, id);
  if (!owner) {
    return jsonResponse({ success: false, error: '车主不存在' }, 404);
  }

  if (owner.adminToken !== token) {
    return jsonResponse({ success: false, error: '认证失败' }, 403);
  }

  await deleteOwner(ctx.env.MOVECARS_KV, id);

  return jsonResponse({ success: true, message: '删除成功' });
}

/**
 * 测试推送
 * POST /api/owner/:id/test-push?token=xxx
 */
export async function handleTestPush(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;
  const url = new URL(ctx.request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return jsonResponse({ success: false, error: '缺少认证 Token' }, 401);
  }

  const owner = await getOwner(ctx.env.MOVECARS_KV, id);
  if (!owner) {
    return jsonResponse({ success: false, error: '车主不存在' }, 404);
  }

  if (owner.adminToken !== token) {
    return jsonResponse({ success: false, error: '认证失败' }, 403);
  }

  const result = await testNotification(owner);

  if (result.success) {
    return jsonResponse({ success: true, message: '推送成功' });
  } else {
    return jsonResponse({ success: false, error: result.error || '推送失败' }, 500);
  }
}
