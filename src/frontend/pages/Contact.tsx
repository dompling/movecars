import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, MapPin, Send, Loader2 } from 'lucide-react';
import { Button, Card, TextArea, Toast } from '../components/ui';
import { useLocation, useToast } from '../hooks';
import { ownerApi, requestApi, type Location } from '../utils/api';

export const Contact: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const { location, loading: locationLoading, error: locationError, getLocation } = useLocation();

  const [ownerName, setOwnerName] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [loadingOwner, setLoadingOwner] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // 加载车主信息
  useEffect(() => {
    if (!id) {
      showToast('无效的挪车码', 'error');
      return;
    }

    const loadOwner = async () => {
      const result = await ownerApi.get(id);
      if (result.success && result.data) {
        setOwnerName(result.data.name);
        setCarPlate(result.data.carPlate || '');
      } else {
        showToast('车主不存在或二维码已失效', 'error');
      }
      setLoadingOwner(false);
    };

    loadOwner();
  }, [id, showToast]);

  // 自动获取位置
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const handleSend = async () => {
    if (!id) return;

    setSending(true);

    const result = await requestApi.create({
      ownerId: id,
      message: message || '请尽快挪车，谢谢！',
      location: location || undefined,
    });

    if (result.success && result.data) {
      if (!location) {
        // 无位置，30 秒后触发推送
        setTimeout(async () => {
          await requestApi.notify(result.data!.requestId);
        }, 30000);
      }

      showToast('通知已发送', 'success');
      setTimeout(() => {
        navigate(`/w/${result.data!.requestId}`);
      }, 500);
    } else {
      showToast(result.error || '发送失败', 'error');
      setSending(false);
    }
  };

  if (loadingOwner) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-ios-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ios-blue rounded-3xl flex items-center justify-center mx-auto mb-4 ios-shadow">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">请求挪车</h1>
          <p className="text-ios-gray-1">
            车主: {ownerName}
            {carPlate && <span className="ml-2">({carPlate})</span>}
          </p>
        </div>

        {/* Location Status */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${location ? 'bg-green-50' : 'bg-orange-50'}`}>
              <MapPin size={20} className={location ? 'text-ios-green' : 'text-ios-orange'} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {locationLoading ? '正在获取位置...' : location ? '已获取位置' : '未获取位置'}
              </h3>
              <p className="text-sm text-ios-gray-1">
                {location
                  ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                  : locationError || '位置信息可帮助车主快速找到您'
                }
              </p>
            </div>
            {!location && !locationLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={getLocation}
              >
                重试
              </Button>
            )}
          </div>
        </Card>

        {/* Message Input */}
        <Card className="mb-6">
          <TextArea
            label="给车主的留言"
            placeholder="请尽快挪车，谢谢！"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            hint="告诉车主您的情况，如：挡住出口了"
          />
        </Card>

        {/* Info */}
        {!location && (
          <Card className="mb-6 bg-orange-50 border border-orange-100">
            <p className="text-sm text-orange-700">
              <strong>提示：</strong>未获取位置时，通知将在 30 秒后发送给车主，给您时间获取位置。
            </p>
          </Card>
        )}

        {/* Send Button */}
        <Button
          size="lg"
          fullWidth
          loading={sending}
          onClick={handleSend}
          icon={<Send size={20} />}
        >
          {location ? '立即通知车主' : '发送通知（30秒后送达）'}
        </Button>
      </div>

      <Toast {...toast} />
    </div>
  );
};
