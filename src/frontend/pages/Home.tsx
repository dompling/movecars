import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowRight, Bell, Shield, Zap } from 'lucide-react';
import { Button, Card, Input, Select, Toast } from '@/components/ui';
import { useToast } from '@/hooks';
import { ownerApi, type CreateOwnerData } from '@/utils/api';

type PushChannel = 'bark' | 'pushplus' | 'serverchan' | 'telegram';

const pushChannelOptions = [
  { value: 'bark', label: 'Bark (iOS)', description: '适合 iPhone 用户，即时推送' },
  { value: 'pushplus', label: 'Pushplus', description: '微信公众号推送，免费好用' },
  { value: 'serverchan', label: 'Server酱', description: '企业微信/微信推送' },
  { value: 'telegram', label: 'Telegram', description: '国际化通讯工具' },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [step, setStep] = useState<'intro' | 'form'>('intro');
  const [loading, setLoading] = useState(false);

  // 表单状态
  const [name, setName] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [pushChannel, setPushChannel] = useState<PushChannel>('bark');

  // 推送配置
  const [barkServer, setBarkServer] = useState('https://api.day.app');
  const [barkKey, setBarkKey] = useState('');
  const [pushplusToken, setPushplusToken] = useState('');
  const [serverchanKey, setServerchanKey] = useState('');
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('请输入昵称', 'error');
      return;
    }

    // 验证推送配置
    if (pushChannel === 'bark' && !barkKey) {
      showToast('请输入 Bark Key', 'error');
      return;
    }
    if (pushChannel === 'pushplus' && !pushplusToken) {
      showToast('请输入 Pushplus Token', 'error');
      return;
    }
    if (pushChannel === 'serverchan' && !serverchanKey) {
      showToast('请输入 Server酱 SendKey', 'error');
      return;
    }
    if (pushChannel === 'telegram' && (!tgBotToken || !tgChatId)) {
      showToast('请完整填写 Telegram 配置', 'error');
      return;
    }

    const data: CreateOwnerData = {
      name: name.trim(),
      carPlate: carPlate.trim() || undefined,
      pushChannel,
      pushConfig: {},
    };

    // 设置对应的推送配置
    if (pushChannel === 'bark') {
      data.pushConfig.bark = { serverUrl: barkServer, key: barkKey };
    } else if (pushChannel === 'pushplus') {
      data.pushConfig.pushplus = { token: pushplusToken };
    } else if (pushChannel === 'serverchan') {
      data.pushConfig.serverchan = { sendKey: serverchanKey };
    } else if (pushChannel === 'telegram') {
      data.pushConfig.telegram = { botToken: tgBotToken, chatId: tgChatId };
    }

    setLoading(true);
    const result = await ownerApi.create(data);
    setLoading(false);

    if (result.success && result.data) {
      showToast('创建成功！', 'success');
      // 跳转到管理页面
      setTimeout(() => {
        navigate(result.data!.adminUrl);
      }, 500);
    } else {
      showToast(result.error || '创建失败', 'error');
    }
  };

  // 渲染介绍页面
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
        <div className="px-6 py-12 max-w-md mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-20 h-20 bg-ios-blue rounded-3xl flex items-center justify-center mx-auto mb-6 ios-shadow-lg">
              <Car size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">智能挪车</h1>
            <p className="text-ios-gray-1 text-lg">扫码即可通知车主，安全便捷</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-12">
            <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Bell className="text-ios-blue" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">即时通知</h3>
                  <p className="text-sm text-ios-gray-1">多种推送渠道，秒级送达</p>
                </div>
              </div>
            </Card>

            <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                  <Shield className="text-ios-green" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">隐私保护</h3>
                  <p className="text-sm text-ios-gray-1">不暴露手机号，安全放心</p>
                </div>
              </div>
            </Card>

            <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Zap className="text-ios-orange" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">位置共享</h3>
                  <p className="text-sm text-ios-gray-1">双向定位，快速找到对方</p>
                </div>
              </div>
            </Card>
          </div>

          {/* CTA */}
          <Button
            size="lg"
            fullWidth
            onClick={() => setStep('form')}
            className="animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          >
            开始创建我的挪车码
            <ArrowRight size={20} />
          </Button>
        </div>

        <Toast {...toast} />
      </div>
    );
  }

  // 渲染注册表单
  return (
    <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setStep('intro')}
            className="text-ios-blue mb-4 font-medium"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900">创建挪车码</h1>
          <p className="text-ios-gray-1 mt-1">填写信息后即可生成专属二维码</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Input
                label="昵称"
                placeholder="如：张先生"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="车牌号（可选）"
                placeholder="如：京A12345"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                hint="显示给请求挪车的人看"
              />
            </div>
          </Card>

          <Card>
            <Select
              label="推送渠道"
              value={pushChannel}
              options={pushChannelOptions}
              onChange={(v) => setPushChannel(v as PushChannel)}
            />
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">推送配置</h3>

            {pushChannel === 'bark' && (
              <div className="space-y-4">
                <Input
                  label="Bark 服务器"
                  placeholder="https://api.day.app"
                  value={barkServer}
                  onChange={(e) => setBarkServer(e.target.value)}
                />
                <Input
                  label="Bark Key"
                  placeholder="你的 Bark Key"
                  value={barkKey}
                  onChange={(e) => setBarkKey(e.target.value)}
                  hint="在 Bark App 中获取"
                />
              </div>
            )}

            {pushChannel === 'pushplus' && (
              <Input
                label="Pushplus Token"
                placeholder="你的 Token"
                value={pushplusToken}
                onChange={(e) => setPushplusToken(e.target.value)}
                hint="在 pushplus.plus 获取"
              />
            )}

            {pushChannel === 'serverchan' && (
              <Input
                label="Server酱 SendKey"
                placeholder="你的 SendKey"
                value={serverchanKey}
                onChange={(e) => setServerchanKey(e.target.value)}
                hint="在 sct.ftqq.com 获取"
              />
            )}

            {pushChannel === 'telegram' && (
              <div className="space-y-4">
                <Input
                  label="Bot Token"
                  placeholder="123456:ABC-DEF..."
                  value={tgBotToken}
                  onChange={(e) => setTgBotToken(e.target.value)}
                  hint="通过 @BotFather 创建"
                />
                <Input
                  label="Chat ID"
                  placeholder="你的 Chat ID"
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  hint="通过 @userinfobot 获取"
                />
              </div>
            )}
          </Card>

          <Button
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleSubmit}
          >
            创建挪车码
          </Button>
        </div>
      </div>

      <Toast {...toast} />
    </div>
  );
};
