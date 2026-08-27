import { api } from './client';
import type { Employee } from './employees';
import type { Invoice, Expense } from './accounting';

export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface ShiftSession {
  id: number;
  employeeId: number;
  employee: Pick<Employee, 'id' | 'nameAr' | 'nameEn' | 'role'>;
  openedByUserId: number;
  openedByUser: {
    id: number;
    username: string;
    role: string;
  };
  startTime: string;
  endTime: string | null;
  openingBalance: string | number;
  expectedCash: string | number;
  actualCash: string | number | null;
  difference: string | number | null;
  totalSales: string | number;
  totalCashSales: string | number;
  totalCardSales: string | number;
  totalExpenses: string | number;
  status: ShiftStatus;
  notes: string | null;
  createdAt: string;
  liveTotals?: {
    totalSales: number;
    totalCashSales: number;
    totalCardSales: number;
    totalExpenses: number;
    expectedCash: number;
    invoicesCount: number;
    expensesCount: number;
  };
  invoices?: Invoice[];
  expenses?: Expense[];
  _count?: {
    invoices: number;
    expenses: number;
  };
}

export interface OpenShiftInput {
  employeeId: number;
  openingBalance?: number;
  notes?: string;
}

export interface CloseShiftInput {
  actualCash: number;
  notes?: string;
}

export interface ShiftListQuery {
  from?: string;
  to?: string;
  employeeId?: number;
  status?: ShiftStatus;
  page?: number;
  limit?: number;
}

export interface ShiftListResponse {
  items: ShiftSession[];
  total: number;
  page: number;
  limit: number;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const openShift = (data: OpenShiftInput) =>
  api.post<{ success: boolean; data: ShiftSession }>('/shifts/open', data).then(unwrap);

export const getActiveShift = (employeeId?: number) =>
  api
    .get<{ success: boolean; data: ShiftSession | null }>('/shifts/active', {
      params: employeeId ? { employeeId } : undefined,
    })
    .then(unwrap);

export const closeShift = (id: number, data: CloseShiftInput) =>
  api.post<{ success: boolean; data: ShiftSession }>(`/shifts/${id}/close`, data).then(unwrap);

export const listShifts = (params?: ShiftListQuery) =>
  api
    .get<{ success: boolean; data: ShiftListResponse }>('/shifts', { params })
    .then(unwrap);

export const getShiftDetails = (id: number) =>
  api.get<{ success: boolean; data: ShiftSession }>(`/shifts/${id}`).then(unwrap);
