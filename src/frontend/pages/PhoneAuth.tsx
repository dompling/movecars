import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { Phone, Check, X, Shield, Loader2 } from 'lucide-react';
import { Button, Card, Toast } from '@/components/ui';
import { useToast } from '@/hooks';
import { requestApi } from '@/utils/api';

export const PhoneAuth: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [authLoading, setAuthLoading] = useState(false);
  const [authResult, setAuthResult] = useState<'authorized' | 'denied' | null>(null);

  // 获取请求信息
  const { data, loading } = useRequest(
    async () => {
      if (!id) throw new Error('无效的请求');
      const result = await requestApi.get(id);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    {
      ready: !!id,
    }
  );

  // 获取手机号授权状态
  const { data: phoneStatus } = useRequest(
    async () => {
      if (!id) throw new Error('无效的请求');
      const result = await requestApi.getPhoneStatus(id);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    {
      ready: !!id,
    }
  );

  const handleAuthorize = async (authorize: boolean) => {
    if (!id) return;
    setAuthLoading(true);
    const result = await requestApi.authorizePhone(id, authorize);
    setAuthLoading(false);

    if (result.success) {
      setAuthResult(authorize ? 'authorized' : 'denied');
      showToast(
        authorize ? '已授权，对方可以看到您的手机号了' : '已拒绝授权',
        authorize ? 'success' : 'info'
      );
    } else {
      showToast(result.error || '操作失败', 'error');
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

  // 检查是否有手机号请求
  if (!phoneStatus?.phoneRequested) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-ios-gray-1">没有待处理的手机号授权请求</p>
        </div>
      </div>
    );
  }

  // 已处理过授权
  if (phoneStatus?.phoneAuthorized !== undefined || authResult) {
    const isAuthorized = authResult === 'authorized' || phoneStatus?.phoneAuthorized;
    return (
      <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
        <div className="px-6 py-8 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 ios-shadow ${
              isAuthorized ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {isAuthorized ? (
                <Check className="text-ios-green" size={32} />
              ) : (
                <X className="text-ios-red" size={32} />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isAuthorized ? '已授权' : '已拒绝'}
            </h1>
            <p className="text-ios-gray-1">
              {isAuthorized
                ? '对方已可以看到您的手机号'
                : '您已拒绝了手机号授权请求'}
            </p>
          </div>

          <Button
            size="lg"
            fullWidth
            variant="secondary"
            onClick={() => navigate(`/r/${id}`)}
          >
            查看挪车请求详情
          </Button>
        </div>
        <Toast {...toast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4 ios-shadow">
            <Phone className="text-ios-blue" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">手机号授权请求</h1>
          <p className="text-ios-gray-1">有人请求获取您的手机号</p>
        </div>

        {/* Request Info */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">请求信息</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ios-gray-1">留言内容</span>
              <span className="font-medium">{data.message || '请尽快挪车'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ios-gray-1">请求时间</span>
              <span className="font-medium">
                {new Date(data.createdAt).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </Card>

        {/* Privacy Notice */}
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Shield className="text-ios-orange mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">隐私提示</h4>
              <p className="text-sm text-ios-gray-1">
                授权后，对方将能够看到您的完整手机号并可直接拨打联系您。
                如果您不希望分享手机号，请点击拒绝。
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            fullWidth
            loading={authLoading}
            onClick={() => handleAuthorize(true)}
            icon={<Check size={20} />}
          >
            授权分享手机号
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            loading={authLoading}
            onClick={() => handleAuthorize(false)}
            icon={<X size={20} />}
          >
            拒绝授权
          </Button>
        </div>
      </div>

      <Toast {...toast} />
    </div>
  );
};
