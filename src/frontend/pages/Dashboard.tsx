import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, LogOut, Plus, Settings, QrCode, Loader2 } from 'lucide-react';
import { Button, Card, Toast } from '@/components/ui';
import { useToast } from '@/hooks';
import { userApi, clearToken, isLoggedIn, type UserOwner, type UserInfo } from '@/utils/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [owners, setOwners] = useState<UserOwner[]>([]);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);

    // 获取用户信息
    const userResult = await userApi.getCurrentUser();
    if (!userResult.success) {
      clearToken();
      navigate('/login');
      return;
    }
    setUser(userResult.data!);

    // 获取用户的挪车码
    const ownersResult = await userApi.getMyOwners();
    if (ownersResult.success && ownersResult.data) {
      setOwners(ownersResult.data);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await userApi.logout();
    clearToken();
    showToast('已退出登录', 'success');
    setTimeout(() => navigate('/'), 500);
  };

  if (loading) {
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-ios-blue rounded-2xl flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">我的挪车码</h1>
              <p className="text-sm text-ios-gray-1">{user?.phone}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            icon={<LogOut size={18} />}
          >
            退出
          </Button>
        </div>

        {/* Create New Button */}
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/')}
          icon={<Plus size={20} />}
          className="mb-6"
        >
          创建新挪车码
        </Button>

        {/* Owner List */}
        {owners.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-ios-gray-1" />
            </div>
            <p className="text-ios-gray-1 mb-4">还没有创建挪车码</p>
            <Button variant="secondary" onClick={() => navigate('/')}>
              去创建
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-ios-gray-1">
              共 {owners.length} 个挪车码
            </h2>
            {owners.map((owner) => (
              <Card key={owner.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Car size={20} className="text-ios-blue" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{owner.name}</h3>
                      <p className="text-sm text-ios-gray-1">
                        {owner.carPlate || '未设置车牌'}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/admin/${owner.id}?token=${owner.adminToken}`}
                    className="flex items-center gap-1 text-ios-blue text-sm font-medium"
                  >
                    <Settings size={16} />
                    管理
                  </Link>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-ios-gray-1">
                    创建时间: {new Date(owner.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Toast {...toast} />
    </div>
  );
};
