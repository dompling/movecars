import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, UserPlus, ShieldCheck } from 'lucide-react';
import { Button, Card, Input, Toast } from '@/components/ui';
import { useToast } from '@/hooks';
import { userApi, setToken } from '@/utils/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!phone.trim()) {
      showToast('请输入手机号', 'error');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      showToast('手机号格式不正确', 'error');
      return;
    }
    if (!password) {
      showToast('请输入密码', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('密码至少需要 6 位', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('两次输入的密码不一致', 'error');
      return;
    }

    setLoading(true);
    const result = await userApi.register({ phone: phone.trim(), password });
    setLoading(false);

    if (result.success && result.data) {
      setToken(result.data.token);
      showToast('注册成功', 'success');
      setTimeout(() => navigate('/dashboard'), 500);
    } else {
      showToast(result.error || '注册失败', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ios-green rounded-3xl flex items-center justify-center mx-auto mb-4 ios-shadow">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">注册账号</h1>
          <p className="text-ios-gray-1">注册后可管理所有挪车码</p>
        </div>

        {/* Register Form */}
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
              placeholder="请输入密码（至少 6 位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} className="text-ios-gray-1" />}
            />
            <Input
              label="确认密码"
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<ShieldCheck size={18} className="text-ios-gray-1" />}
            />
          </div>
        </Card>

        {/* Register Button */}
        <Button
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleRegister}
          className="mb-4"
        >
          注册
        </Button>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-ios-gray-1">
            已有账号？
            <Link to="/login" className="text-ios-blue ml-1 font-medium">
              立即登录
            </Link>
          </p>
        </div>

        {/* Skip Register */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-ios-gray-1 hover:text-ios-gray-2">
            跳过注册，直接创建挪车码
          </Link>
        </div>
      </div>

      <Toast {...toast} />
    </div>
  );
};
