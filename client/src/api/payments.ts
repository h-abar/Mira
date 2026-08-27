import { api } from './client';

export interface PaymentItem {
  id: number;
  invoiceId?: number | null;
  appointmentId?: number | null;
  clientId?: number | null;
  amount: number;
  method: string;
  status?: string;
  createdAt?: string;
}

export interface PaymentListQuery {
  page?: number;
  limit?: number;
}

export interface PaymentListResult {
  items: PaymentItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePaymentInput {
  invoiceId?: number;
  appointmentId?: number;
  amount: number;
  method: string;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const listPayments = (params?: PaymentListQuery) =>
  api
    .get<{ success: boolean; data: PaymentListResult }>('/payments', { params })
    .then(unwrap);

export const createPayment = (input: CreatePaymentInput) =>
  api.post<{ success: boolean; data: PaymentItem }>('/payments', input).then(unwrap);

export const refundPayment = (id: number) =>
  api.post<{ success: boolean; data: PaymentItem }>(`/payments/${id}/refund`).then(unwrap);
