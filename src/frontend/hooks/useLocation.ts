import { useState, useCallback } from 'react';
import type { Location, MapUrls } from '@/types';
import { generateMapUrls } from '@/utils/coordinates';

interface UseLocationResult {
  location: Location | null;
  loading: boolean;
  error: string | null;
  getLocation: () => Promise<Location | null>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(async (): Promise<Location | null> => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持定位功能');
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(loc);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          let errorMessage = '获取位置失败';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = '您拒绝了位置权限，请在设置中开启';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = '无法获取位置信息';
              break;
            case err.TIMEOUT:
              errorMessage = '获取位置超时，请重试';
              break;
          }
          setError(errorMessage);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { location, loading, error, getLocation };
}

/**
 * 获取地图链接（使用 GCJ-02 坐标转换）
 */
export function getMapUrls(lat: number, lng: number): MapUrls {
  return generateMapUrls(lat, lng);
}

/**
 * 打开高德地图
 */
export function openAmap(lat: number, lng: number) {
  const urls = generateMapUrls(lat, lng);
  window.open(urls.amapUrl, '_blank');
}

/**
 * 打开 Apple 地图
 */
export function openAppleMaps(lat: number, lng: number) {
  const urls = generateMapUrls(lat, lng);
  window.location.href = urls.appleUrl;
}

/**
 * 智能打开地图（iOS 用 Apple Maps，其他用高德）
 */
export function openInMaps(lat: number, lng: number) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    openAppleMaps(lat, lng);
  } else {
    openAmap(lat, lng);
  }
}
