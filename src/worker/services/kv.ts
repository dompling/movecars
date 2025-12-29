/**
 * KV 存储服务
 */
import type { Owner, MoveRequest, Env } from './types';

const OWNER_PREFIX = 'owner:';
const REQUEST_PREFIX = 'request:';

/**
 * 生成随机 ID
 */
export function generateId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成管理员 Token
 */
export function generateAdminToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============ 车主相关操作 ============

/**
 * 创建车主
 */
export async function createOwner(kv: KVNamespace, owner: Owner): Promise<void> {
  await kv.put(`${OWNER_PREFIX}${owner.id}`, JSON.stringify(owner));
}

/**
 * 获取车主
 */
export async function getOwner(kv: KVNamespace, ownerId: string): Promise<Owner | null> {
  const data = await kv.get(`${OWNER_PREFIX}${ownerId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * 更新车主
 */
export async function updateOwner(kv: KVNamespace, owner: Owner): Promise<void> {
  await kv.put(`${OWNER_PREFIX}${owner.id}`, JSON.stringify(owner));
}

/**
 * 删除车主
 */
export async function deleteOwner(kv: KVNamespace, ownerId: string): Promise<void> {
  await kv.delete(`${OWNER_PREFIX}${ownerId}`);
}

/**
 * 检查车主 ID 是否存在
 */
export async function ownerExists(kv: KVNamespace, ownerId: string): Promise<boolean> {
  const data = await kv.get(`${OWNER_PREFIX}${ownerId}`);
  return data !== null;
}

// ============ 挪车请求相关操作 ============

/**
 * 创建挪车请求
 */
export async function createRequest(kv: KVNamespace, request: MoveRequest): Promise<void> {
  // 设置 24 小时后过期
  const expirationTtl = 60 * 60 * 24;
  await kv.put(`${REQUEST_PREFIX}${request.id}`, JSON.stringify(request), { expirationTtl });
}

/**
 * 获取挪车请求
 */
export async function getRequest(kv: KVNamespace, requestId: string): Promise<MoveRequest | null> {
  const data = await kv.get(`${REQUEST_PREFIX}${requestId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * 更新挪车请求
 */
export async function updateRequest(kv: KVNamespace, request: MoveRequest): Promise<void> {
  // 保持 24 小时过期时间
  const expirationTtl = 60 * 60 * 24;
  await kv.put(`${REQUEST_PREFIX}${request.id}`, JSON.stringify(request), { expirationTtl });
}

/**
 * 删除挪车请求
 */
export async function deleteRequest(kv: KVNamespace, requestId: string): Promise<void> {
  await kv.delete(`${REQUEST_PREFIX}${requestId}`);
}
