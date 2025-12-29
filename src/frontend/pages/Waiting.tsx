import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { Clock, MapPin, Check, Navigation, Loader2, Map, Phone } from 'lucide-react';
import { Button, Card, Toast, Modal } from '@/components/ui';
import { useToast, openAmap, openAppleMaps } from '@/hooks';
import { requestApi, type RequestStatus } from '@/utils/api';

export const Waiting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast, showToast } = useToast();
  const [showMapModal, setShowMapModal] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  // 获取请求状态
  const { data, loading, cancel } = useRequest(
    async () => {
      if (!id) throw new Error('无效的请求');
      const result = await requestApi.get(id);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    {
      pollingInterval: 5000, // 5秒轮询一次
      ready: !!id,
      onSuccess: (data: RequestStatus) => {
        // 状态为 confirmed 或 completed 时停止轮询
        if (data.status === 'confirmed' || data.status === 'completed') {
          cancel();
        }
      },
    }
  );

  // 获取手机号授权状态
  const { data: phoneStatus, refresh: refreshPhoneStatus } = useRequest(
    async () => {
      if (!id) throw new Error('无效的请求');
      const result = await requestApi.getPhoneStatus(id);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    {
      pollingInterval: 5000, // 如果已请求但未授权，轮询检查
      ready: !!id,
      pollingWhenHidden: false,
    }
  );

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

  const handleOpenAmap = () => {
    if (data?.ownerLocation) {
      openAmap(data.ownerLocation.lat, data.ownerLocation.lng);
      setShowMapModal(false);
    }
  };

  const handleOpenApple = () => {
    if (data?.ownerLocation) {
      openAppleMaps(data.ownerLocation.lat, data.ownerLocation.lng);
      setShowMapModal(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    const result = await requestApi.complete(id);
    if (result.success) {
      showToast('感谢使用！', 'success');
    }
  };

  // 请求获取车主手机号
  const handleRequestPhone = async () => {
    if (!id) return;
    setPhoneLoading(true);
    const result = await requestApi.requestPhone(id);
    setPhoneLoading(false);

    if (result.success) {
      showToast(result.message || '已发送授权请求，请等待车主确认', 'success');
      refreshPhoneStatus();
    } else {
      showToast(result.error || '请求失败', 'error');
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

        {/* Phone Authorization Card */}
        {phoneStatus?.hasLinkedAccount && (
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Phone size={20} className="text-ios-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">车主手机号</h3>
                {phoneStatus.phoneAuthorized ? (
                  <a
                    href={`tel:${phoneStatus.authorizedPhone}`}
                    className="text-lg font-bold text-ios-blue underline"
                  >
                    {phoneStatus.authorizedPhone}
                  </a>
                ) : phoneStatus.phoneRequested ? (
                  <p className="text-sm text-ios-orange">等待车主授权中...</p>
                ) : (
                  <p className="text-sm text-ios-gray-1">点击下方按钮请求获取</p>
                )}
              </div>
            </div>
            {phoneStatus.phoneAuthorized ? (
              <Button
                fullWidth
                onClick={() => window.location.href = `tel:${phoneStatus.authorizedPhone}`}
                icon={<Phone size={18} />}
              >
                拨打电话
              </Button>
            ) : (
              <Button
                fullWidth
                variant={phoneStatus.phoneRequested ? 'secondary' : 'primary'}
                loading={phoneLoading}
                disabled={phoneStatus.phoneRequested}
                onClick={handleRequestPhone}
                icon={<Phone size={18} />}
              >
                {phoneStatus.phoneRequested ? '等待授权中' : '请求获取手机号'}
              </Button>
            )}
            {phoneStatus.phoneAuthorized === false && (
              <p className="text-sm text-ios-red text-center mt-3">车主拒绝了授权请求</p>
            )}
          </Card>
        )}

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
              onClick={() => setShowMapModal(true)}
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

      {/* Map Selection Modal */}
      <Modal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        title="选择地图"
      >
        <div className="space-y-3">
          <Button
            fullWidth
            variant="secondary"
            onClick={handleOpenAmap}
            icon={<Map size={18} />}
          >
            高德地图
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={handleOpenApple}
            icon={<Navigation size={18} />}
          >
            Apple 地图
          </Button>
        </div>
      </Modal>

      <Toast {...toast} />
    </div>
  );
};
