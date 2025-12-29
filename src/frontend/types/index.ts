/**
 * 前端类型定义
 */

// 位置信息
export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

// 地图链接
export interface MapUrls {
  amapUrl: string;   // 高德地图
  appleUrl: string;  // Apple 地图
}
