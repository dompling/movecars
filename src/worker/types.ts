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

// 车主信息
export interface Owner {
  id: string;
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
