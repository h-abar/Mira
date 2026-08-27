import client, { api } from './client';

export interface ReportRangeParams {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
  branchId?: number;
  employeeId?: number;
}

export interface GroupedPoint {
  label: string;
  total: number;
  count: number;
}

export interface PaymentMethodRow {
  method: string;
  count: number;
  total: number;
}

export interface TopServiceRow {
  serviceId: number;
  nameAr: string;
  nameEn: string;
  quantity: number;
  revenue: number;
}

export interface TopClientRow {
  clientId: number;
  name: string;
  total: number;
}

export interface EmployeePerformanceRow {
  employeeId: number;
  nameAr: string;
  nameEn: string;
  invoiceCount: number;
  subtotal: number;
  total: number;
  commission: number;
}

export interface EmployeeShiftSalesRow {
  shiftSessionId: number;
  employeeId: number;
  employeeNameAr: string;
  employeeNameEn: string;
  commissionRate: number;
  branchId: number | null;
  branchNameAr: string | null;
  branchNameEn: string | null;
  startTime: string;
  endTime: string | null;
  status: string;
  openingBalance: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
  notes: string | null;
  invoiceCount: number;
  totalSales: number;
  cashSales: number;
  cardSales: number;
}

export interface ExpenseRow {
  category: string;
  amount: number;
}

export interface SummaryTotals {
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProfitLossCategory {
  category: string;
  amount: number;
}

export interface ProfitLossResult {
  revenue: number;
  cogs: number;
  grossProfit: number;
  commissions: number;
  expenses: number;
  expensesByCategory: ProfitLossCategory[];
  netProfit: number;
  ordersCount: number;
  avgOrder: number;
}

export type ReportType =
  | 'sales'
  | 'paymentMethods'
  | 'topServices'
  | 'topClients'
  | 'employeePerformance'
  | 'employeeShiftSales'
  | 'expenses';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const withParams = (params: ReportRangeParams) => ({ params });

export const salesReport = (params: ReportRangeParams) =>
  api.get<ApiResponse<GroupedPoint[]>>('/reports/sales', withParams(params));

export const paymentMethods = (params: ReportRangeParams) =>
  api.get<ApiResponse<PaymentMethodRow[]>>('/reports/payment-methods', withParams(params));

export const topServices = (params: ReportRangeParams) =>
  api.get<ApiResponse<TopServiceRow[]>>('/reports/top-services', withParams(params));

export const topClients = (params: ReportRangeParams) =>
  api.get<ApiResponse<TopClientRow[]>>('/reports/top-clients', withParams(params));

export const employeePerformance = (params: ReportRangeParams) =>
  api.get<ApiResponse<EmployeePerformanceRow[]>>('/reports/employee-performance', withParams(params));

export const employeeShiftSales = (params: ReportRangeParams) =>
  api.get<ApiResponse<EmployeeShiftSalesRow[]>>('/reports/employee-shift-sales', withParams(params));

export const expensesReport = (params: ReportRangeParams) =>
  api.get<ApiResponse<ExpenseRow[]>>('/reports/expenses', withParams(params));

export const summaryTotals = (params: ReportRangeParams) =>
  api.get<ApiResponse<SummaryTotals>>('/reports/summary', withParams(params));

export const getProfitLoss = (params: ReportRangeParams) =>
  api.get<ApiResponse<ProfitLossResult>>('/reports/profit-loss', withParams(params));

export interface DashboardAnalytics {
  revenueByDay: { date: string; revenue: number }[];
  topServices: TopServiceRow[];
  lowStock: {
    id: number;
    nameAr: string;
    nameEn: string;
    quantity: number;
    minStock: number;
  }[];
  todayAppointments: number;
  upcomingAppointments: {
    id: number;
    startTime: string;
    endTime: string;
    client: { name: string };
    employee: { nameAr: string; nameEn: string };
    service: { nameAr: string; nameEn: string };
  }[];
  todayRevenue: number;
  todayExpenses: number;
  activeMemberships: number;
  clientsCount: number;
}

export const getDashboardAnalytics = () =>
  api.get<ApiResponse<DashboardAnalytics>>('/reports/dashboard-analytics').then((r) => r.data);

export async function exportReport(
  report: ReportType,
  params: ReportRangeParams & { format: 'excel' | 'pdf'; lang?: 'ar' | 'en' },
): Promise<void> {
  const response = await client.get<Blob>('/reports/export', {
    params: { ...params, report },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report}.${params.format === 'pdf' ? 'pdf' : 'xlsx'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}