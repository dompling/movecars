import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, LogIn } from 'lucide-react';
import { Button, Card, Input, Toast } from '@/components/ui';
import { useToast } from '@/hooks';
import { userApi, setToken } from '@/utils/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) {
      showToast('请输入手机号', 'error');
      return;
    }
    if (!password) {
      showToast('请输入密码', 'error');
      return;
    }

    setLoading(true);
    const result = await userApi.login({ phone: phone.trim(), password });
    setLoading(false);

    if (result.success && result.data) {
      setToken(result.data.token);
      showToast('登录成功', 'success');
      setTimeout(() => navigate('/dashboard'), 500);
    } else {
      showToast(result.error || '登录失败', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ios-blue rounded-3xl flex items-center justify-center mx-auto mb-4 ios-shadow">
            <LogIn size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">登录账号</h1>
          <p className="text-ios-gray-1">登录后可管理所有挪车码</p>
        </div>

        {/* Login Form */}
        <Card className="mb-6">
          <div className="space-y-4">
            <Input
              label="手机号"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
              icon={<Phone size={18} className="text-ios-gray-1" />}
            />
            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} className="text-ios-gray-1" />}
            />
          </div>
        </Card>

        {/* Login Button */}
        <Button
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleLogin}
          className="mb-4"
        >
          登录
        </Button>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-ios-gray-1">
            还没有账号？
            <Link to="/register" className="text-ios-blue ml-1 font-medium">
              立即注册
            </Link>
          </p>
        </div>

        {/* Skip Login */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-ios-gray-1 hover:text-ios-gray-2">
            跳过登录，直接创建挪车码
          </Link>
        </div>
      </div>

      <Toast {...toast} />
    </div>
  );
};
