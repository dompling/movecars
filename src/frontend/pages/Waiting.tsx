import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, MapPin, Check, Navigation, Loader2 } from 'lucide-react';
import { Button, Card, Toast } from '@/components/ui';
import { usePolling, useToast, openInMaps } from '@/hooks';
import { requestApi, type RequestStatus } from '@/utils/api';

export const Waiting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast, showToast } = useToast();

  const fetcher = useCallback(async () => {
    if (!id) throw new Error('无效的请求');
    const result = await requestApi.get(id);
    if (!result.success) throw new Error(result.error);
    return result.data!;
  }, [id]);

  const { data, loading } = usePolling<RequestStatus>({
    fetcher,
    interval: 3000,
    enabled: !!id,
    shouldStop: (data) => data.status === 'confirmed' || data.status === 'completed',
  });

  const statusInfo = useMemo(() => {
    if (!data) return null;

    switch (data.status) {
      case 'pending':
        return {
          icon: <Clock className="text-ios-orange" size={32} />,
          title: '等待发送通知...',
          subtitle: '通知将在 30 秒后发送给车主',
          color: 'orange',
        };
      case 'notified':
        return {
          icon: <Loader2 className="text-ios-blue animate-spin" size={32} />,
          title: '已通知车主',
          subtitle: '等待车主确认中...',
          color: 'blue',
        };
      case 'confirmed':
        return {
          icon: <Check className="text-ios-green" size={32} />,
          title: '车主已确认',
          subtitle: '车主已收到通知并确认',
          color: 'green',
        };
      case 'completed':
        return {
          icon: <Check className="text-ios-green" size={32} />,
          title: '已完成',
          subtitle: '感谢使用智能挪车',
          color: 'green',
        };
      default:
        return null;
    }
  }, [data]);

  const handleOpenMap = () => {
    if (data?.ownerLocation) {
      openInMaps(data.ownerLocation.lat, data.ownerLocation.lng);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    const result = await requestApi.complete(id);
    if (result.success) {
      showToast('感谢使用！', 'success');
    }
  };

  if (loading && !data) {
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
        {/* Status Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 ios-shadow ${
            statusInfo?.color === 'green' ? 'bg-green-50' :
            statusInfo?.color === 'blue' ? 'bg-blue-50' : 'bg-orange-50'
          }`}>
            {statusInfo?.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{statusInfo?.title}</h1>
          <p className="text-ios-gray-1">{statusInfo?.subtitle}</p>
        </div>

        {/* Request Info */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">请求信息</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ios-gray-1">车主</span>
              <span className="font-medium">{data.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ios-gray-1">留言</span>
              <span className="font-medium">{data.message || '请尽快挪车'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ios-gray-1">发送时间</span>
              <span className="font-medium">
                {new Date(data.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
            {data.confirmedAt && (
              <div className="flex justify-between">
                <span className="text-ios-gray-1">确认时间</span>
                <span className="font-medium text-ios-green">
                  {new Date(data.confirmedAt).toLocaleString('zh-CN')}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Owner Location */}
        {data.ownerLocation && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <MapPin size={20} className="text-ios-green" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">车主位置</h3>
                <p className="text-sm text-ios-gray-1">
                  {data.ownerLocation.lat.toFixed(6)}, {data.ownerLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
            <Button
              fullWidth
              onClick={handleOpenMap}
              icon={<Navigation size={18} />}
            >
              在地图中查看
            </Button>
          </Card>
        )}

        {/* Action Buttons */}
        {data.status === 'confirmed' && (
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            onClick={handleComplete}
          >
            车已挪走，完成
          </Button>
        )}

        {/* Status Animation */}
        {(data.status === 'pending' || data.status === 'notified') && (
          <div className="text-center mt-8">
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-ios-blue animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-ios-blue animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-ios-blue animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm text-ios-gray-1 mt-3">正在等待车主响应...</p>
          </div>
        )}
      </div>

      <Toast {...toast} />
    </div>
  );
};
