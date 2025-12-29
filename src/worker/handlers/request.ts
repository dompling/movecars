/**
 * 挪车请求 API 处理器
 */
import type {
  ApiResponse,
  ConfirmMoveRequestBody,
  CreateMoveRequestBody,
  MoveRequest,
  Owner,
  RouteContext
} from '../types';
import {createRequest, generateId, getOwner, getRequest, updateRequest} from '../services/kv';
import {sendNotification} from '../services/notification';

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
 * 格式化位置信息
 */
function formatLocation(lat: number, lng: number): string {
  return `📍 坐标: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * 发送挪车通知给车主
 */
async function notifyOwner(
  owner: Owner,
  request: MoveRequest,
  baseUrl: string
): Promise<void> {
  let body = `📝 留言: ${request.message || '请尽快挪车'}`;

  if (request.requesterLocation) {
    body += `\n\n${formatLocation(request.requesterLocation.lat, request.requesterLocation.lng)}`;
  }

  body += `\n\n⏰ 时间: ${new Date(request.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

  await sendNotification(owner, {
    title: '🚗 有人请求挪车',
    body,
    url: `${baseUrl}/r/${request.id}`,
  });
}

/**
 * 创建挪车请求
 * POST /api/request
 */
export async function handleCreateRequest(ctx: RouteContext): Promise<Response> {
  try {
    const body = await ctx.request.json() as CreateMoveRequestBody;

    // 验证必填字段
    if (!body.ownerId) {
      return jsonResponse({ success: false, error: '缺少车主 ID' }, 400);
    }

    // 检查车主是否存在
    const owner = await getOwner(ctx.env.MOVECARS_KV, body.ownerId);
    if (!owner) {
      return jsonResponse({ success: false, error: '车主不存在' }, 404);
    }

    // 生成请求 ID
    const requestId = generateId(12);

    const request: MoveRequest = {
      id: requestId,
      ownerId: body.ownerId,
      message: body.message || '',
      requesterLocation: body.location,
      status: 'pending',
      createdAt: Date.now(),
    };

    await createRequest(ctx.env.MOVECARS_KV, request);

    // 获取基础 URL
    const url = new URL(ctx.request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // 根据是否有位置决定推送时机
    if (body.location) {
      // 有位置，立即推送
      await notifyOwner(owner, request, baseUrl);
      request.status = 'notified';
      request.notifiedAt = Date.now();
      await updateRequest(ctx.env.MOVECARS_KV, request);
    } else {
      // 无位置，使用 Cloudflare Durable Objects 的 alarm 或简单的延迟
      // 由于 Workers 没有原生定时器，我们在前端使用 30 秒后再调用推送 API
      // 这里先标记为 pending
    }

    return jsonResponse({
      success: true,
      data: {
        requestId: request.id,
        waitingUrl: `/w/${request.id}`,
        status: request.status,
        hasLocation: !!body.location,
      },
      message: body.location ? '已发送通知' : '请求已创建，将在 30 秒后发送通知',
    });
  } catch (error) {
    return jsonResponse({ success: false, error: '创建失败: ' + String(error) }, 500);
  }
}

/**
 * 延迟推送（无位置时 30 秒后调用）
 * POST /api/request/:id/notify
 */
export async function handleDelayedNotify(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;

  const request = await getRequest(ctx.env.MOVECARS_KV, id);
  if (!request) {
    return jsonResponse({ success: false, error: '请求不存在' }, 404);
  }

  // 如果已经通知过了，跳过
  if (request.status !== 'pending') {
    return jsonResponse({ success: true, message: '已通知' });
  }

  const owner = await getOwner(ctx.env.MOVECARS_KV, request.ownerId);
  if (!owner) {
    return jsonResponse({ success: false, error: '车主不存在' }, 404);
  }

  // 获取基础 URL
  const url = new URL(ctx.request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  await notifyOwner(owner, request, baseUrl);

  request.status = 'notified';
  request.notifiedAt = Date.now();
  await updateRequest(ctx.env.MOVECARS_KV, request);

  return jsonResponse({ success: true, message: '通知已发送' });
}

/**
 * 获取请求状态
 * GET /api/request/:id
 */
export async function handleGetRequest(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;

  const request = await getRequest(ctx.env.MOVECARS_KV, id);
  if (!request) {
    return jsonResponse({ success: false, error: '请求不存在或已过期' }, 404);
  }

  // 获取车主公开信息
  const owner = await getOwner(ctx.env.MOVECARS_KV, request.ownerId);
  const ownerName = owner?.name || '车主';

  return jsonResponse({
    success: true,
    data: {
      id: request.id,
      status: request.status,
      message: request.message,
      requesterLocation: request.requesterLocation,
      ownerLocation: request.ownerLocation,
      ownerName,
      createdAt: request.createdAt,
      notifiedAt: request.notifiedAt,
      confirmedAt: request.confirmedAt,
    },
  });
}

/**
 * 车主确认请求并分享位置
 * PUT /api/request/:id/confirm
 */
export async function handleConfirmRequest(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;

  const request = await getRequest(ctx.env.MOVECARS_KV, id);
  if (!request) {
    return jsonResponse({ success: false, error: '请求不存在或已过期' }, 404);
  }

  try {
    const body = await ctx.request.json() as ConfirmMoveRequestBody;

    request.status = 'confirmed';
    request.confirmedAt = Date.now();

    if (body.location) {
      request.ownerLocation = body.location;
    }

    await updateRequest(ctx.env.MOVECARS_KV, request);

    return jsonResponse({
      success: true,
      message: '已确认，对方可以看到您的位置了',
      data: {
        status: request.status,
        ownerLocation: request.ownerLocation,
      },
    });
  } catch (error) {
    return jsonResponse({ success: false, error: '确认失败: ' + String(error) }, 500);
  }
}

/**
 * 标记请求完成
 * PUT /api/request/:id/complete
 */
export async function handleCompleteRequest(ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params;

  const request = await getRequest(ctx.env.MOVECARS_KV, id);
  if (!request) {
    return jsonResponse({ success: false, error: '请求不存在或已过期' }, 404);
  }

  request.status = 'completed';
  request.completedAt = Date.now();

  await updateRequest(ctx.env.MOVECARS_KV, request);

  return jsonResponse({
    success: true,
    message: '已完成',
  });
}
