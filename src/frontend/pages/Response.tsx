import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Car, MapPin, Check, Navigation, Loader2, Clock } from 'lucide-react';
import { Button, Card, Toast } from '@/components/ui';
import { useLocation, useToast, openInMaps } from '@/hooks';
import { requestApi, type RequestStatus } from '@/utils/api';

export const Response: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast, showToast } = useToast();
  const { location, loading: locationLoading, getLocation } = useLocation();

  const [data, setData] = useState<RequestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // 加载请求信息
  useEffect(() => {
    if (!id) return;

    const loadRequest = async () => {
      const result = await requestApi.get(id);
      if (result.success && result.data) {
        setData(result.data);
        if (result.data.status === 'confirmed' || result.data.status === 'completed') {
          setConfirmed(true);
        }
      } else {
        showToast('请求不存在或已过期', 'error');
      }
      setLoading(false);
    };

    loadRequest();
  }, [id, showToast]);

  // 自动获取位置
  useEffect(() => {
    if (!confirmed) {
      getLocation();
    }
  }, [confirmed, getLocation]);

  const handleConfirm = async () => {
    if (!id) return;

    setConfirming(true);
    const result = await requestApi.confirm(id, location || undefined);

    if (result.success) {
      setConfirmed(true);
      showToast('已确认，对方可以看到您的位置', 'success');
    } else {
      showToast(result.error || '确认失败', 'error');
    }
    setConfirming(false);
  };

  const handleOpenRequesterMap = () => {
    if (data?.requesterLocation) {
      openInMaps(data.requesterLocation.lat, data.requesterLocation.lng);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-ios-blue" size={32} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-ios-gray-1">请求不存在或已过期</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 ios-shadow ${
            confirmed ? 'bg-green-50' : 'bg-blue-50'
          }`}>
            {confirmed ? (
              <Check className="text-ios-green" size={40} />
            ) : (
              <Car className="text-ios-blue" size={40} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {confirmed ? '已确认' : '有人请求挪车'}
          </h1>
          <p className="text-ios-gray-1">
            {confirmed ? '对方已收到您的确认' : '请查看详情并确认'}
          </p>
        </div>

        {/* Request Info */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock size={20} className="text-ios-blue" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">请求时间</h3>
              <p className="text-sm text-ios-gray-1">
                {new Date(data.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>

          {data.message && (
            <div className="bg-ios-gray-6 rounded-2xl p-4">
              <p className="text-sm text-ios-gray-1 mb-1">对方留言</p>
              <p className="text-gray-900">{data.message}</p>
            </div>
          )}
        </Card>

        {/* Requester Location */}
        {data.requesterLocation && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <MapPin size={20} className="text-ios-orange" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">对方位置</h3>
                <p className="text-sm text-ios-gray-1">
                  {data.requesterLocation.lat.toFixed(6)}, {data.requesterLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
            <Button
              fullWidth
              variant="secondary"
              onClick={handleOpenRequesterMap}
              icon={<Navigation size={18} />}
            >
              在地图中查看
            </Button>
          </Card>
        )}

        {/* Confirm Section */}
        {!confirmed && (
          <>
            <Card className="mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  location ? 'bg-green-50' : 'bg-gray-100'
                }`}>
                  <MapPin size={20} className={location ? 'text-ios-green' : 'text-ios-gray-2'} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {locationLoading ? '获取位置中...' : location ? '已获取您的位置' : '未获取位置'}
                  </h3>
                  <p className="text-sm text-ios-gray-1">
                    {location
                      ? '确认后将分享给对方'
                      : '分享位置可帮助对方找到您'
                    }
                  </p>
                </div>
                {!location && !locationLoading && (
                  <Button variant="ghost" size="sm" onClick={getLocation}>
                    获取
                  </Button>
                )}
              </div>
            </Card>

            <Button
              size="lg"
              fullWidth
              loading={confirming}
              onClick={handleConfirm}
              icon={<Check size={20} />}
            >
              确认并{location ? '分享位置' : '通知对方'}
            </Button>

            <p className="text-center text-sm text-ios-gray-1 mt-4">
              确认后，对方将收到通知{location ? '并能看到您的位置' : ''}
            </p>
          </>
        )}

        {/* Confirmed State */}
        {confirmed && (
          <Card className="text-center">
            <Check className="text-ios-green mx-auto mb-3" size={48} />
            <h3 className="font-semibold text-gray-900 mb-1">操作完成</h3>
            <p className="text-sm text-ios-gray-1">
              对方已收到您的确认{data.ownerLocation ? '和位置信息' : ''}
            </p>
          </Card>
        )}
      </div>

      <Toast {...toast} />
    </div>
  );
};
