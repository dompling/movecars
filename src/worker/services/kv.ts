/**
 * KV 存储服务
 */
import type {MoveRequest, Owner, User, UserSession} from '../types';

const OWNER_PREFIX = 'owner:';
const REQUEST_PREFIX = 'request:';
const USER_PREFIX = 'user:';
const USER_PHONE_PREFIX = 'user_phone:';
const SESSION_PREFIX = 'session:';
const USER_OWNERS_PREFIX = 'user_owners:';

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

// ============ 用户相关操作 ============

/**
 * 简单的密码哈希（生产环境应使用更安全的方案）
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'movecars_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

/**
 * 生成会话 Token
 */
export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 创建用户
 */
export async function createUser(kv: KVNamespace, user: User): Promise<void> {
  // 存储用户数据
  await kv.put(`${USER_PREFIX}${user.id}`, JSON.stringify(user));
  // 存储手机号到用户 ID 的映射（用于登录查找）
  await kv.put(`${USER_PHONE_PREFIX}${user.phone}`, user.id);
  // 初始化用户的车主列表
  await kv.put(`${USER_OWNERS_PREFIX}${user.id}`, JSON.stringify([]));
}

/**
 * 通过 ID 获取用户
 */
export async function getUser(kv: KVNamespace, userId: string): Promise<User | null> {
  const data = await kv.get(`${USER_PREFIX}${userId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * 通过手机号获取用户
 */
export async function getUserByPhone(kv: KVNamespace, phone: string): Promise<User | null> {
  const userId = await kv.get(`${USER_PHONE_PREFIX}${phone}`);
  if (!userId) return null;
  return getUser(kv, userId);
}

/**
 * 检查手机号是否已注册
 */
export async function phoneExists(kv: KVNamespace, phone: string): Promise<boolean> {
  const userId = await kv.get(`${USER_PHONE_PREFIX}${phone}`);
  return userId !== null;
}

/**
 * 创建用户会话
 */
export async function createSession(kv: KVNamespace, session: UserSession): Promise<void> {
  // 会话有效期 7 天
  const expirationTtl = 60 * 60 * 24 * 7;
  await kv.put(`${SESSION_PREFIX}${session.token}`, JSON.stringify(session), { expirationTtl });
}

/**
 * 获取会话
 */
export async function getSession(kv: KVNamespace, token: string): Promise<UserSession | null> {
  const data = await kv.get(`${SESSION_PREFIX}${token}`);
  if (!data) return null;
  const session = JSON.parse(data) as UserSession;
  // 检查是否过期
  if (session.expiresAt < Date.now()) {
    await kv.delete(`${SESSION_PREFIX}${token}`);
    return null;
  }
  return session;
}

/**
 * 删除会话（登出）
 */
export async function deleteSession(kv: KVNamespace, token: string): Promise<void> {
  await kv.delete(`${SESSION_PREFIX}${token}`);
}

/**
 * 获取用户的所有车主 ID
 */
export async function getUserOwnerIds(kv: KVNamespace, userId: string): Promise<string[]> {
  const data = await kv.get(`${USER_OWNERS_PREFIX}${userId}`);
  return data ? JSON.parse(data) : [];
}

/**
 * 添加车主到用户列表
 */
export async function addOwnerToUser(kv: KVNamespace, userId: string, ownerId: string): Promise<void> {
  const ownerIds = await getUserOwnerIds(kv, userId);
  if (!ownerIds.includes(ownerId)) {
    ownerIds.push(ownerId);
    await kv.put(`${USER_OWNERS_PREFIX}${userId}`, JSON.stringify(ownerIds));
  }
}

/**
 * 从用户列表移除车主
 */
export async function removeOwnerFromUser(kv: KVNamespace, userId: string, ownerId: string): Promise<void> {
  const ownerIds = await getUserOwnerIds(kv, userId);
  const newOwnerIds = ownerIds.filter(id => id !== ownerId);
  await kv.put(`${USER_OWNERS_PREFIX}${userId}`, JSON.stringify(newOwnerIds));
}

/**
 * 获取用户的所有车主详情
 */
export async function getUserOwners(kv: KVNamespace, userId: string): Promise<Owner[]> {
  const ownerIds = await getUserOwnerIds(kv, userId);
  const owners: Owner[] = [];
  for (const ownerId of ownerIds) {
    const owner = await getOwner(kv, ownerId);
    if (owner) {
      owners.push(owner);
    }
  }
  return owners;
}
