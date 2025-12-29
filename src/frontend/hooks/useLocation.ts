import { useState, useCallback } from 'react';
import type { Location } from '../utils/api';

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
 * 打开系统地图导航
 */
export function openInMaps(lat: number, lng: number) {
  // 检测设备类型
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isIOS) {
    // iOS 优先使用 Apple Maps
    window.location.href = `maps://maps.apple.com/?ll=${lat},${lng}&q=位置`;
  } else if (isAndroid) {
    // Android 使用 Google Maps
    window.location.href = `geo:${lat},${lng}?q=${lat},${lng}`;
  } else {
    // 其他设备打开网页版 Google Maps
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }
}
