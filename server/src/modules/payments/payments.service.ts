import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { sendWhatsApp } from '../notifications/notifications.service';
import { MoyasarGateway } from './gateways/moyasarGateway';

interface PaymentGateway {
  createCharge(input: {
    amount: number;
    currency: string;
    method: string;
  }): Promise<{ transactionId: string }>;
}

const PAYMENT_CONFIG_KEYS = ['PAYMENT_METHOD', 'PAYMENT_API_KEY', 'PAYMENT_PUBLIC_KEY', 'PAYMENT_GATEWAY', 'PAYMENT_GATEWAY_ENV'] as const;

export interface PaymentConfig {
  method: string | null;
  apiKey: string | null;
  publicKey: string | null;
  configured: boolean;
}

export interface ExtendedPaymentConfig extends PaymentConfig {
  gateway: string | null;
  gatewayEnv: string | null;
}

export async function getPaymentConfig(): Promise<ExtendedPaymentConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...PAYMENT_CONFIG_KEYS] } },
  });
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const method = map.get('PAYMENT_METHOD') ?? null;
  const apiKey = map.get('PAYMENT_API_KEY') ?? null;
  const publicKey = map.get('PAYMENT_PUBLIC_KEY') ?? null;
  const gateway = map.get('PAYMENT_GATEWAY') ?? null;
  const gatewayEnv = map.get('PAYMENT_GATEWAY_ENV') ?? null;
  return {
    method,
    apiKey,
    publicKey,
    gateway,
    gatewayEnv,
    configured: Boolean(apiKey && publicKey),
  };
}

export interface PaymentCreateInput {
  invoiceId?: number;
  appointmentId?: number;
  amount: number;
  method: string;
}

export interface PaymentListQuery {
  status?: string;
  invoiceId?: number;
  page?: number;
  limit?: number;
}

async function createPayment(input: PaymentCreateInput) {
  const config = await getPaymentConfig();

  if (input.invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
    if (!invoice) {
      throw new ApiError(404, 'الفاتورة غير موجودة');
    }
  }
  if (input.appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: input.appointmentId },
    });
    if (!appointment) {
      throw new ApiError(404, 'الموعد غير موجود');
    }
  }

  let gatewayInstance: PaymentGateway | null = null;
  if (config.gateway === 'moyasar') {
    gatewayInstance = new MoyasarGateway({
      apiKey: config.apiKey ?? '',
      publicKey: config.publicKey ?? '',
      env: config.gatewayEnv ?? 'sandbox',
    });
  }
  // Additional gateways can be added here (e.g., Stripe)

  const pending = await prisma.payment.create({
    data: {
      invoiceId: input.invoiceId ?? null,
      appointmentId: input.appointmentId ?? null,
      method: input.method,
      amount: input.amount,
      status: 'PENDING',
    },
  });

  // Simulate or perform real charge
  let transactionId: string;
  if (gatewayInstance) {
    const chargeResult = await gatewayInstance.createCharge({ amount: input.amount, currency: 'SAR', method: input.method });
    transactionId = chargeResult.transactionId;
  } else {
    transactionId = `SIMULATED-${randomUUID()}`;
  }

  const paid = await prisma.payment.update({
    where: { id: pending.id },
    data: { status: 'PAID', transactionId },
  });

  // A paid appointment deposit confirms the booking automatically.
  if (paid.appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: paid.appointmentId },
      select: { status: true },
    });
    if (appointment && appointment.status === 'BOOKED') {
      await prisma.appointment.update({
        where: { id: paid.appointmentId },
        data: { status: 'CONFIRMED' },
      });
    }
  }

  try {
    const phone = await resolveClientPhone(paid.invoiceId, paid.appointmentId);
    if (phone) {
      const templateRow = await prisma.setting.findUnique({
        where: { key: 'WHATSAPP_MESSAGE_TEMPLATE' },
      });
      const template =
        templateRow?.value || 'تم دفع الفاتورة بنجاح. رقم العملية: {{transactionId}}';
      const message = template.replace('{{transactionId}}', paid.transactionId ?? '');
      await sendWhatsApp(phone, message, {
        type: 'payment',
        referenceId: String(paid.id),
      });
    }
  } catch (e) {
    console.error('Failed to send WhatsApp notification', e);
  }

  return {
    id: paid.id,
    status: paid.status,
    method: paid.method,
    amount: Number(paid.amount),
    invoiceId: paid.invoiceId,
    appointmentId: paid.appointmentId,
    transactionId: paid.transactionId,
    simulated: !gatewayInstance,
    gateway: config.gateway ?? null,
    gatewayConfigured: config.configured,
  };
}

async function listPayments(query: PaymentListQuery = {}) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

  const where: Prisma.PaymentWhereInput = {};
  if (query.status) {
    where.status = query.status;
  }
  if (query.invoiceId) {
    where.invoiceId = query.invoiceId;
  }

  const [total, items] = await prisma.$transaction([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit };
}

async function refundPayment(id: number) {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'الدفعة غير موجودة');
  }
  if (existing.status === 'REFUNDED') {
    throw new ApiError(400, 'الدفعة مسترجعة بالفعل');
  }

  return prisma.payment.update({
    where: { id },
    data: { status: 'REFUNDED' },
  });
}

async function resolveClientPhone(
  invoiceId: number | null,
  appointmentId: number | null,
): Promise<string | null> {
  if (invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { client: { select: { whatsapp: true, phone: true } } },
    });
    return invoice?.client.whatsapp || invoice?.client.phone || null;
  }
  if (appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { client: { select: { whatsapp: true, phone: true } } },
    });
    return appointment?.client.whatsapp || appointment?.client.phone || null;
  }
  return null;
}

export const paymentsService = {
  createPayment,
  listPayments,
  refundPayment,
  getPaymentConfig,
};