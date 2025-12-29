import React, {useEffect, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {Bell, Check, Copy, ExternalLink, QrCode, Settings, Trash2} from 'lucide-react';
import {Button, Card, CardHeader, Input, Modal, Select, Toast} from '@/components/ui';
import {useToast} from '@/hooks';
import {type CreateOwnerData, ownerApi, type OwnerFull} from '@/utils/api';

type PushChannel = 'bark' | 'pushplus' | 'serverchan' | 'telegram';

const pushChannelOptions = [
  { value: 'bark', label: 'Bark (iOS)', description: '适合 iPhone 用户' },
  { value: 'pushplus', label: 'Pushplus', description: '微信公众号推送' },
  { value: 'serverchan', label: 'Server酱', description: '企业微信推送' },
  { value: 'telegram', label: 'Telegram', description: '国际化通讯' },
];

export const Admin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<OwnerFull | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // 加载车主信息
  useEffect(() => {
    if (!id || !token) {
      showToast('缺少认证信息', 'error');
      navigate('/');
      return;
    }

    const loadOwner = async () => {
      const result = await ownerApi.getFull(id, token);
      if (result.success && result.data) {
        const data = result.data;
        setOwner(data);
        setName(data.name);
        setCarPlate(data.carPlate || '');
        setPushChannel(data.pushChannel as PushChannel);

        // 设置推送配置
        if (data.pushConfig.bark) {
          setBarkServer(data.pushConfig.bark.serverUrl);
          setBarkKey(data.pushConfig.bark.key);
        }
        if (data.pushConfig.pushplus) {
          setPushplusToken(data.pushConfig.pushplus.token);
        }
        if (data.pushConfig.serverchan) {
          setServerchanKey(data.pushConfig.serverchan.sendKey);
        }
        if (data.pushConfig.telegram) {
          setTgBotToken(data.pushConfig.telegram.botToken);
          setTgChatId(data.pushConfig.telegram.chatId);
        }
      } else {
        showToast(result.error || '加载失败', 'error');
        navigate('/');
      }
      setLoading(false);
    };

    loadOwner();
  }, [id, token, navigate, showToast]);

  const qrcodeUrl = `${window.location.origin}/c/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrcodeUrl);
      setCopied(true);
      showToast('链接已复制', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('复制失败', 'error');
    }
  };

  const handleTestPush = async () => {
    if (!id) return;
    setTesting(true);
    const result = await ownerApi.testPush(id, token);
    setTesting(false);
    if (result.success) {
      showToast('测试通知已发送', 'success');
    } else {
      showToast(result.error || '发送失败', 'error');
    }
  };

  const handleSave = async () => {
    if (!id || !name.trim()) {
      showToast('请输入昵称', 'error');
      return;
    }

    const data: Partial<CreateOwnerData> = {
      name: name.trim(),
      carPlate: carPlate.trim() || undefined,
      pushChannel,
      pushConfig: {},
    };

    if (pushChannel === 'bark') {
      data.pushConfig!.bark = { serverUrl: barkServer, key: barkKey };
    } else if (pushChannel === 'pushplus') {
      data.pushConfig!.pushplus = { token: pushplusToken };
    } else if (pushChannel === 'serverchan') {
      data.pushConfig!.serverchan = { sendKey: serverchanKey };
    } else if (pushChannel === 'telegram') {
      data.pushConfig!.telegram = { botToken: tgBotToken, chatId: tgChatId };
    }

    setSaving(true);
    const result = await ownerApi.update(id, token, data);
    setSaving(false);

    if (result.success) {
      showToast('保存成功', 'success');
    } else {
      showToast(result.error || '保存失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await ownerApi.delete(id, token);
    if (result.success) {
      showToast('已删除', 'success');
      setTimeout(() => navigate('/'), 500);
    } else {
      showToast(result.error || '删除失败', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <div className="text-ios-gray-1">加载中...</div>
      </div>
    );
  }

  if (!owner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ios-bg safe-area-top safe-area-bottom">
      <div className="px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-ios-blue rounded-2xl flex items-center justify-center">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">管理后台</h1>
            <p className="text-sm text-ios-gray-1">管理你的挪车码</p>
          </div>
        </div>

        {/* QR Code Section */}
        <Card className="mb-6">
          <CardHeader
            title="我的挪车码"
            subtitle="将此链接生成二维码贴在车上"
            icon={<QrCode size={20} />}
          />

          <div className="bg-ios-gray-6 rounded-2xl p-4 mb-4">
            <p className="text-sm text-gray-600 break-all font-mono">{qrcodeUrl}</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCopy}
              icon={copied ? <Check size={18} /> : <Copy size={18} />}
            >
              {copied ? '已复制' : '复制链接'}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrcodeUrl)}`, '_blank')}
              icon={<ExternalLink size={18} />}
            >
              生成二维码
            </Button>
          </div>
        </Card>

        {/* Test Push */}
        <Card className="mb-6">
          <CardHeader
            title="推送测试"
            subtitle="验证推送配置是否正确"
            icon={<Bell size={20} />}
          />
          <Button
            variant="secondary"
            fullWidth
            loading={testing}
            onClick={handleTestPush}
          >
            发送测试通知
          </Button>
        </Card>

        {/* Settings Form */}
        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="space-y-4">
            <Input
              label="昵称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="车牌号（可选）"
              value={carPlate}
              onChange={(e) => setCarPlate(e.target.value)}
            />
          </div>
        </Card>

        <Card className="mb-6">
          <Select
            label="推送渠道"
            value={pushChannel}
            options={pushChannelOptions}
            onChange={(v) => setPushChannel(v as PushChannel)}
          />
        </Card>

        <Card className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">推送配置</h3>

          {pushChannel === 'bark' && (
            <div className="space-y-4">
              <Input
                label="Bark 服务器"
                value={barkServer}
                onChange={(e) => setBarkServer(e.target.value)}
              />
              <Input
                label="Bark Key"
                value={barkKey}
                onChange={(e) => setBarkKey(e.target.value)}
              />
            </div>
          )}

          {pushChannel === 'pushplus' && (
            <Input
              label="Pushplus Token"
              value={pushplusToken}
              onChange={(e) => setPushplusToken(e.target.value)}
            />
          )}

          {pushChannel === 'serverchan' && (
            <Input
              label="Server酱 SendKey"
              value={serverchanKey}
              onChange={(e) => setServerchanKey(e.target.value)}
            />
          )}

          {pushChannel === 'telegram' && (
            <div className="space-y-4">
              <Input
                label="Bot Token"
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
              />
              <Input
                label="Chat ID"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
              />
            </div>
          )}
        </Card>

        <Button
          size="lg"
          fullWidth
          loading={saving}
          onClick={handleSave}
          className="mb-4"
        >
          保存设置
        </Button>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => setShowDeleteModal(true)}
          className="text-ios-red"
          icon={<Trash2 size={18} />}
        >
          删除挪车码
        </Button>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="确认删除"
        >
          <p className="text-gray-600 mb-6">
            删除后无法恢复，已生成的二维码将失效。确定要删除吗？
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowDeleteModal(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
            >
              确认删除
            </Button>
          </div>
        </Modal>
      </div>

      <Toast {...toast} />
    </div>
  );
};
