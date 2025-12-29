/**
 * API 调用封装
 */

const API_BASE = '/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: '网络请求失败，请检查网络连接',
    };
  }
}

// ========== 车主 API ==========

export interface CreateOwnerData {
  name: string;
  carPlate?: string;
  defaultReply?: string; // 默认回复语
  pushChannel: 'bark' | 'pushplus' | 'serverchan' | 'telegram';
  pushConfig: {
    bark?: { serverUrl: string; key: string };
    pushplus?: { token: string };
    serverchan?: { sendKey: string };
    telegram?: { botToken: string; chatId: string };
  };
}

export interface OwnerResult {
  id: string;
  adminToken: string;
  adminUrl: string;
  qrcodeUrl: string;
}

export interface OwnerPublic {
  id: string;
  name: string;
  carPlate?: string;
}

export interface OwnerFull extends OwnerPublic {
  defaultReply?: string; // 默认回复语
  pushChannel: string;
  pushConfig: CreateOwnerData['pushConfig'];
  createdAt: number;
}

export const ownerApi = {
  create: (data: CreateOwnerData) =>
    request<OwnerResult>('/owner', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    request<OwnerPublic>(`/owner/${id}`),

  getFull: (id: string, token: string) =>
    request<OwnerFull>(`/owner/${id}/full?token=${token}`),

  update: (id: string, token: string, data: Partial<CreateOwnerData>) =>
    request(`/owner/${id}?token=${token}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string, token: string) =>
    request(`/owner/${id}?token=${token}`, {
      method: 'DELETE',
    }),

  testPush: (id: string, token: string) =>
    request(`/owner/${id}/test-push?token=${token}`, {
      method: 'POST',
    }),
};

// ========== 挪车请求 API ==========

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface CreateRequestData {
  ownerId: string;
  message: string;
  location?: Location;
}

export interface RequestResult {
  requestId: string;
  waitingUrl: string;
  status: string;
  hasLocation: boolean;
}

export interface RequestStatus {
  id: string;
  status: 'pending' | 'notified' | 'confirmed' | 'completed';
  message: string;
  requesterLocation?: Location;
  ownerLocation?: Location;
  ownerName: string;
  createdAt: number;
  notifiedAt?: number;
  confirmedAt?: number;
}

export const requestApi = {
  create: (data: CreateRequestData) =>
    request<RequestResult>('/request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: string) =>
    request<RequestStatus>(`/request/${id}`),

  notify: (id: string) =>
    request(`/request/${id}/notify`, {
      method: 'POST',
    }),

  confirm: (id: string, location?: Location) =>
    request(`/request/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ location }),
    }),

  complete: (id: string) =>
    request(`/request/${id}/complete`, {
      method: 'PUT',
    }),
};
