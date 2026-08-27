import { api } from './client';

export type EmployeeRole = 'STYLIST' | 'BEAUTICIAN' | 'RECEPTIONIST';

export interface Employee {
  id: number;
  nameAr: string;
  nameEn: string;
  phone: string | null;
  role: EmployeeRole;
  commissionRate: string | number;
  hireDate: string;
  isActive: boolean;
  shiftName?: string | null;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  workDays?: string | null;
  morningStart?: string | null;
  morningEnd?: string | null;
  eveningStart?: string | null;
  eveningEnd?: string | null;
  _count?: { appointments: number; invoices?: number };
}

export interface EmployeeInput {
  nameAr: string;
  nameEn: string;
  phone?: string;
  role: EmployeeRole;
  commissionRate: number;
  hireDate: string;
  isActive?: boolean;
  shiftName?: string;
  shiftStart?: string;
  shiftEnd?: string;
  workDays?: string;
  morningStart?: string;
  morningEnd?: string;
  eveningStart?: string;
  eveningEnd?: string;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const listEmployees = () =>
  api.get<{ success: boolean; data: Employee[] }>('/employees').then(unwrap);

export const getEmployee = (id: number) =>
  api.get<{ success: boolean; data: Employee }>(`/employees/${id}`).then(unwrap);

export const createEmployee = (data: EmployeeInput) =>
  api.post<{ success: boolean; data: Employee }>('/employees', data).then(unwrap);

export const updateEmployee = (id: number, data: Partial<EmployeeInput>) =>
  api.put<{ success: boolean; data: Employee }>(`/employees/${id}`, data).then(unwrap);

export const deleteEmployee = (id: number) =>
  api.delete<{ success: boolean; data: { id: number } }>(`/employees/${id}`).then(unwrap);