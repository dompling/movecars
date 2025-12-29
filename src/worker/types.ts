/**
 * 智能挪车系统 - 类型定义
 */

// 推送渠道类型
export type PushChannel = 'bark' | 'pushplus' | 'serverchan' | 'telegram';

// Bark 配置
export interface BarkConfig {
  serverUrl: string;  // 如: https://api.day.app
  key: string;
}

// Pushplus 配置
export interface PushplusConfig {
  token: string;
}

// Server酱 配置
export interface ServerchanConfig {
  sendKey: string;
}

// Telegram 配置
export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

// 推送配置联合类型
export interface PushConfig {
  bark?: BarkConfig;
  pushplus?: PushplusConfig;
  serverchan?: ServerchanConfig;
  telegram?: TelegramConfig;
}

// 用户信息
export interface User {
  id: string;
  phone: string;
  passwordHash: string; // 密码哈希
  createdAt: number;
  updatedAt?: number;
}

// 车主信息
export interface Owner {
  id: string;
  userId?: string; // 关联的用户 ID
  name: string;
  carPlate?: string;
  defaultReply?: string; // 默认回复语
  pushChannel: PushChannel;
  pushConfig: PushConfig;
  adminToken: string;
  createdAt: number;
  updatedAt?: number;
}

// 车主公开信息（不包含敏感配置）
export interface OwnerPublic {
  id: string;
  name: string;
  carPlate?: string;
}

// 位置信息
export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

// 挪车请求状态
export type RequestStatus = 'pending' | 'notified' | 'confirmed' | 'completed';

// 挪车请求
export interface MoveRequest {
  id: string;
  ownerId: string;
  message: string;
  requesterLocation?: Location;
  ownerLocation?: Location;
  status: RequestStatus;
  createdAt: number;
  notifiedAt?: number;
  confirmedAt?: number;
  completedAt?: number;
  // 手机号授权相关
  phoneRequested?: boolean;      // 是否请求了手机号
  phoneAuthorized?: boolean;     // 车主是否授权
  authorizedPhone?: string;      // 授权后的手机号（脱敏显示）
}

// API 响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 创建车主请求
export interface CreateOwnerRequest {
  name: string;
  carPlate?: string;
  defaultReply?: string;
  pushChannel: PushChannel;
  pushConfig: PushConfig;
}

// 更新车主请求
export interface UpdateOwnerRequest {
  name?: string;
  carPlate?: string;
  defaultReply?: string;
  pushChannel?: PushChannel;
  pushConfig?: PushConfig;
}

// 创建挪车请求
export interface CreateMoveRequestBody {
  ownerId: string;
  message: string;
  location?: Location;
}

// 确认挪车请求
export interface ConfirmMoveRequestBody {
  location?: Location;
}

// Worker 环境变量
export interface Env {
  MOVECARS_KV: KVNamespace;
  APP_NAME?: string;
  APP_URL?: string;
}

// 路由上下文
export interface RouteContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

// ========== 用户认证相关 ==========

// 用户注册请求
export interface RegisterRequest {
  phone: string;
  password: string;
}

// 用户登录请求
export interface LoginRequest {
  phone: string;
  password: string;
}

// 用户会话
export interface UserSession {
  userId: string;
  token: string;
  expiresAt: number;
}

// 登录响应
export interface LoginResponse {
  user: {
    id: string;
    phone: string;
  };
  token: string;
  expiresAt: number;
}
