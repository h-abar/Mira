import { api } from './client';
import type { Employee } from './employees';

export type PaymentMethod = 'CASH' | 'CARD' | 'WALLET' | 'ELECTRONIC' | 'BANK_TRANSFER';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'CANCELLED';

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  serviceId: number | null;
  productId: number | null;
  description: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  service?: { id: number; nameAr: string; nameEn: string; price?: string | number } | null;
  product?: { id: number; nameAr: string; nameEn: string; quantity: number } | null;
}

export interface Invoice {
  id: number;
  invoiceNo: string;
  clientId: number;
  employeeId: number;
  date: string;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  tip?: string | number;
  giftCardAmount?: string | number;
  giftCardId?: number | null;
  total: string | number;
  offerCode?: string | null;
  pointsEarned?: number;
  pointsRedeemed?: number;
  paymentMethod: PaymentMethod;
  bankReference?: string | null;
  bankName?: string | null;
  membershipPlanId?: number | null;
  membershipDiscount?: string | number;
  membershipPlan?: { id: number; nameAr: string; nameEn: string } | null;
  status: InvoiceStatus;
  client?: { id: number; name: string; phone?: string | null } | null;
  employee?: Employee | null;
  items?: InvoiceItem[];
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  amount: string | number;
  description?: string | null;
  createdBy: number;
  createdAt: string;
  creator?: { id: number; username: string; name?: string } | null;
}

export interface Summary {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  invoicesCount: number;
  doneAppointments: number;
  commissions: number;
}

export interface InvoiceItemInput {
  serviceId?: number;
  productId?: number;
  description?: string;
  quantity: number;
  unitPrice?: number;
  employeeId?: number;
}

export interface ManualInvoiceInput {
  clientId: number;
  employeeId: number;
  discount: number;
  tax: number;
  tip?: number;
  paymentMethod: PaymentMethod;
  offerCode?: string;
  redeemPoints?: number;
  giftCardCode?: string;
  bankReference?: string;
  bankName?: string;
  branchId?: number;
  items: InvoiceItemInput[];
}

export interface AppointmentInvoiceInput {
  appointmentId: number;
  discount: number;
  tax: number;
  tip?: number;
  paymentMethod: PaymentMethod;
  offerCode?: string;
  redeemPoints?: number;
  giftCardCode?: string;
  bankReference?: string;
  bankName?: string;
  branchId?: number;
}

export interface ExpenseInput {
  date?: string;
  category: string;
  amount: number;
  description?: string;
}

export interface InvoiceListParams {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  clientId?: number;
  branchId?: number;
}

export interface InvoiceListResult {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const listInvoices = (params?: InvoiceListParams) =>
  api.get<{ success: boolean; data: InvoiceListResult }>('/accounting/invoices', { params }).then(unwrap);

export const getInvoice = (id: number) =>
  api.get<{ success: boolean; data: Invoice }>(`/accounting/invoices/${id}`).then(unwrap);

export const createInvoiceFromAppointment = (data: AppointmentInvoiceInput) =>
  api.post<{ success: boolean; data: Invoice }>('/accounting/invoices', data).then(unwrap);

export const createInvoiceManual = (data: ManualInvoiceInput) =>
  api.post<{ success: boolean; data: Invoice }>('/accounting/invoices', data).then(unwrap);

export const cancelInvoice = (id: number, reason?: string) =>
  api.post<{ success: boolean; data: Invoice }>(`/accounting/invoices/${id}/cancel`, { reason }).then(unwrap);

export const listExpenses = (params?: { from?: string; to?: string; category?: string }) =>
  api.get<{ success: boolean; data: Expense[] }>('/accounting/expenses', { params }).then(unwrap);

export const createExpense = (data: ExpenseInput) =>
  api.post<{ success: boolean; data: Expense }>('/accounting/expenses', data).then(unwrap);

export const updateExpense = (id: number, data: Partial<ExpenseInput>) =>
  api.put<{ success: boolean; data: Expense }>(`/accounting/expenses/${id}`, data).then(unwrap);

export const deleteExpense = (id: number) =>
  api.delete<{ success: boolean; data: { id: number } }>(`/accounting/expenses/${id}`).then(unwrap);

export const getSummary = (date: string) =>
  api.get<{ success: boolean; data: Summary }>('/accounting/summary', { params: { date } }).then(unwrap);