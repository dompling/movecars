/**
 * 推送通知服务
 * 支持 Bark、Pushplus、Server酱、Telegram
 */
import type { Owner, PushChannel, BarkConfig, PushplusConfig, ServerchanConfig, TelegramConfig } from '../types';

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

export interface PushResult {
  success: boolean;
  channel: PushChannel;
  error?: string;
}

/**
 * Bark 推送 (iOS)
 */
async function pushBark(config: BarkConfig, message: PushMessage): Promise<PushResult> {
  try {
    const { serverUrl, key } = config;
    const baseUrl = serverUrl.replace(/\/$/, '');

    const params = new URLSearchParams();
    if (message.url) {
      params.set('url', message.url);
    }
    params.set('group', '挪车通知');
    params.set('sound', 'alarm');
    params.set('level', 'timeSensitive');

    const url = `${baseUrl}/${key}/${encodeURIComponent(message.title)}/${encodeURIComponent(message.body)}?${params.toString()}`;

    const response = await fetch(url);
    const result = await response.json() as { code?: number };

    if (result.code === 200) {
      return { success: true, channel: 'bark' };
    }
    return { success: false, channel: 'bark', error: JSON.stringify(result) };
  } catch (error) {
    return { success: false, channel: 'bark', error: String(error) };
  }
}

/**
 * Pushplus 推送
 */
async function pushPushplus(config: PushplusConfig, message: PushMessage): Promise<PushResult> {
  try {
    const content = message.url
      ? `${message.body}<br><br><a href="${message.url}">点击查看详情</a>`
      : message.body;

    const response = await fetch('https://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: config.token,
        title: message.title,
        content,
        template: 'html',
      }),
    });

    const result = await response.json() as { code?: number };

    if (result.code === 200) {
      return { success: true, channel: 'pushplus' };
    }
    return { success: false, channel: 'pushplus', error: JSON.stringify(result) };
  } catch (error) {
    return { success: false, channel: 'pushplus', error: String(error) };
  }
}

/**
 * Server酱推送
 */
async function pushServerchan(config: ServerchanConfig, message: PushMessage): Promise<PushResult> {
  try {
    const desp = message.url
      ? `${message.body}\n\n[点击查看详情](${message.url})`
      : message.body;

    const response = await fetch(`https://sctapi.ftqq.com/${config.sendKey}.send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        title: message.title,
        desp,
      }),
    });

    const result = await response.json() as { code?: number };

    if (result.code === 0) {
      return { success: true, channel: 'serverchan' };
    }
    return { success: false, channel: 'serverchan', error: JSON.stringify(result) };
  } catch (error) {
    return { success: false, channel: 'serverchan', error: String(error) };
  }
}

/**
 * Telegram 推送
 */
async function pushTelegram(config: TelegramConfig, message: PushMessage): Promise<PushResult> {
  try {
    let text = `<b>${message.title}</b>\n\n${message.body}`;
    if (message.url) {
      text += `\n\n<a href="${message.url}">点击查看详情</a>`;
    }

    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const result = await response.json() as { ok?: boolean };

    if (result.ok) {
      return { success: true, channel: 'telegram' };
    }
    return { success: false, channel: 'telegram', error: JSON.stringify(result) };
  } catch (error) {
    return { success: false, channel: 'telegram', error: String(error) };
  }
}

/**
 * 根据车主配置发送推送
 */
export async function sendNotification(owner: Owner, message: PushMessage): Promise<PushResult> {
  const { pushChannel, pushConfig } = owner;

  switch (pushChannel) {
    case 'bark':
      if (!pushConfig.bark) {
        return { success: false, channel: 'bark', error: 'Bark 配置缺失' };
      }
      return pushBark(pushConfig.bark, message);

    case 'pushplus':
      if (!pushConfig.pushplus) {
        return { success: false, channel: 'pushplus', error: 'Pushplus 配置缺失' };
      }
      return pushPushplus(pushConfig.pushplus, message);

    case 'serverchan':
      if (!pushConfig.serverchan) {
        return { success: false, channel: 'serverchan', error: 'Server酱配置缺失' };
      }
      return pushServerchan(pushConfig.serverchan, message);

    case 'telegram':
      if (!pushConfig.telegram) {
        return { success: false, channel: 'telegram', error: 'Telegram 配置缺失' };
      }
      return pushTelegram(pushConfig.telegram, message);

    default:
      return { success: false, channel: pushChannel, error: '未知推送渠道' };
  }
}

/**
 * 测试推送配置
 */
export async function testNotification(owner: Owner): Promise<PushResult> {
  return sendNotification(owner, {
    title: '🚗 推送测试',
    body: '恭喜！您的挪车通知配置成功，这是一条测试消息。',
  });
}
