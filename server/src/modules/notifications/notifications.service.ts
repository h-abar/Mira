import {
  type Notification,
  type NotificationStatus,
  type Prisma,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';

export type Lang = 'ar' | 'en';

const DEFAULT_SALON_NAME: Record<Lang, string> = {
  ar: 'ميرا',
  en: 'Mira',
};

export interface SendWhatsAppOptions {
  referenceId?: string;
  type?: string;
  lang?: Lang;
}

export interface SendWhatsAppResult {
  notification: Notification;
  simulated?: boolean;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: string;
}

export interface CampaignInput {
  audience: 'birthday' | 'inactive' | 'ids';
  clientIds?: number[];
  inactiveDays?: number;
  message: string;
  lang?: Lang;
}

export interface CampaignResult {
  targetCount: number;
  withPhone: number;
  sentCount: number;
  results: { clientId: number; status: 'SENT' | 'FAILED' | 'NO_PHONE' }[];
}

export interface RetryResult {
  notification: Notification;
  simulated?: boolean;
}

export async function retryNotification(id: number): Promise<RetryResult> {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Notification not found.');
  }

  const result = await sendWhatsApp(existing.target, existing.message, {
    referenceId: existing.referenceId ?? undefined,
    type: existing.type,
  });

  const updated = await prisma.notification.update({
    where: { id },
    data: { status: 'SENT' },
  });

  return { notification: updated, simulated: result.simulated };
}

async function sendCampaign(input: CampaignInput): Promise<CampaignResult> {
  const now = new Date();
  const message = String(input.message || '').trim();
  if (!message) {
    throw new ApiError(400, 'Campaign message is required.');
  }

  let clients: { id: number; name: string; whatsapp: string | null; phone: string | null }[] = [];

  if (input.audience === 'ids') {
    const ids = (input.clientIds ?? []).filter((id) => Number.isInteger(id));
    clients = await prisma.client.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, whatsapp: true, phone: true },
    });
  } else if (input.audience === 'birthday') {
    const all = await prisma.client.findMany({
      select: { id: true, name: true, whatsapp: true, phone: true, birthdate: true },
    });
    const month = now.getMonth();
    clients = all.filter(
      (client) => client.birthdate && new Date(client.birthdate).getMonth() === month,
    );
  } else {
    const days = input.inactiveDays && input.inactiveDays > 0 ? input.inactiveDays : 30;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const active = await prisma.invoice.findMany({
      where: { date: { gte: since } },
      distinct: ['clientId'],
      select: { clientId: true },
    });
    const activeSet = new Set(active.map((invoice) => invoice.clientId));
    const all = await prisma.client.findMany({
      select: { id: true, name: true, whatsapp: true, phone: true },
    });
    clients = all.filter((client) => !activeSet.has(client.id));
  }

  const results: CampaignResult['results'] = [];
  let sentCount = 0;

  for (const client of clients) {
    const phone = client.whatsapp || client.phone;
    if (!phone) {
      results.push({ clientId: client.id, status: 'NO_PHONE' });
      continue;
    }
    const personalized = message.replace(/\{name\}/g, client.name);
    try {
      await sendWhatsApp(phone, personalized, {
        type: 'campaign',
        lang: input.lang,
      });
      sentCount += 1;
      results.push({ clientId: client.id, status: 'SENT' });
    } catch {
      results.push({ clientId: client.id, status: 'FAILED' });
    }
  }

  return {
    targetCount: clients.length,
    withPhone: results.filter((r) => r.status !== 'NO_PHONE').length,
    sentCount,
    results,
  };
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    throw new ApiError(400, 'رقم الهاتف غير صالح، يجب أن يتكون من 8 إلى 15 رقماً');
  }
  return digits;
}

async function getWhatsAppConfig(): Promise<{ token: string; phoneId: string; enabled: boolean }> {
  const keys = ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'WHATSAPP_ENABLED'];
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  const token = stored.get('WHATSAPP_TOKEN') || env.WHATSAPP_TOKEN || '';
  const phoneId = stored.get('WHATSAPP_PHONE_ID') || env.WHATSAPP_PHONE_ID || '';
  const enabled = stored.get('WHATSAPP_ENABLED') === 'true' || Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID);

  return { token, phoneId, enabled };
}

async function sendToWhatsApp(
  to: string,
  message: string,
  config: { token: string; phoneId: string },
): Promise<void> {
  const url = `https://graph.facebook.com/v19.0/${config.phoneId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${text}`);
  }
}

export function formatDateTime(date: Date, time: string): string {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${time}`;
}

export async function sendWhatsApp(
  phone: string,
  message: string,
  opts: SendWhatsAppOptions = {},
): Promise<SendWhatsAppResult> {
  const target = normalizePhone(phone);
  const type = opts.type ?? 'whatsapp';

  const pending = await prisma.notification.create({
    data: {
      type,
      target,
      message,
      status: 'PENDING',
      referenceId: opts.referenceId ?? null,
    },
  });

  const { token, phoneId, enabled } = await getWhatsAppConfig();
  const configured = enabled && Boolean(token && phoneId);

  if (!configured) {
    console.log(
      `[notifications] WhatsApp not configured — simulated send to ${target}: ${message}`,
    );
    const sent = await prisma.notification.update({
      where: { id: pending.id },
      data: { status: 'SENT' },
    });
    return { notification: sent, simulated: true };
  }

  try {
    await sendToWhatsApp(target, message, { token, phoneId });
    const sent = await prisma.notification.update({
      where: { id: pending.id },
      data: { status: 'SENT' },
    });
    return { notification: sent };
  } catch (err) {
    await prisma.notification.update({
      where: { id: pending.id },
      data: { status: 'FAILED' },
    });
    console.error('[notifications] WhatsApp send failed:', err);
    throw new ApiError(502, 'فشل إرسال رسالة واتساب');
  }
}

export function reminderTemplate(
  clientName: string,
  serviceName: string,
  dateTime: string,
  salonName?: string,
  lang: Lang = 'ar',
): string {
  const salon = salonName ?? DEFAULT_SALON_NAME[lang];
  if (lang === 'en') {
    return `Dear ${clientName},\n\nThis is a reminder for your appointment:\n${serviceName} on ${dateTime}\n\n${salon}`;
  }
  return `عزيزتي ${clientName}،\n\nهذا تذكير بموعدك:\n${serviceName} يوم ${dateTime}\n\n${salon}`;
}

export function confirmationTemplate(
  clientName: string,
  invoiceNo: string,
  total: number,
  salonName?: string,
  lang: Lang = 'ar',
): string {
  const salon = salonName ?? DEFAULT_SALON_NAME[lang];
  if (lang === 'en') {
    return `Dear ${clientName},\n\nThank you for visiting us! Your invoice ${invoiceNo} total is ${total}.\n\n${salon}`;
  }
  return `عزيزتي ${clientName}،\n\nشكراً لزيارتك! فاتورتك ${invoiceNo} بإجمالي ${total}.\n\n${salon}`;
}

export const notificationsService = {
  sendWhatsApp: (
    phone: string,
    message: string,
    opts: SendWhatsAppOptions = {},
  ): Promise<SendWhatsAppResult> => sendWhatsApp(phone, message, opts),

  async list(query: NotificationListQuery = {}) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const where: Prisma.NotificationWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [total, items] = await prisma.$transaction([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, total, page, limit };
  },

  sendCampaign: (input: CampaignInput): Promise<CampaignResult> => sendCampaign(input),

  retry: (id: number): Promise<RetryResult> => retryNotification(id),
};