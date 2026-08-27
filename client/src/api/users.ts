import { api } from './client';
import type { Employee } from './employees';

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'STYLIST';

export interface UserAccount {
  id: number;
  username: string;
  role: UserRole;
  permissions: string[];
  employeeId: number | null;
  isActive: boolean;
  createdAt: string;
  employee: Pick<Employee, 'id' | 'nameAr' | 'nameEn'> | null;
}

export interface UserCreateInput {
  username: string;
  password: string;
  role: UserRole;
  employeeId?: number | null;
  permissions?: string[];
  isActive?: boolean;
}

export interface UserUpdateInput {
  username?: string;
  password?: string;
  role?: UserRole;
  employeeId?: number | null;
  permissions?: string[];
  isActive?: boolean;
}

export interface PermissionDef {
  key: string;
  ar: string;
  en: string;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const listUsers = () =>
  api.get<{ success: boolean; data: UserAccount[] }>('/users').then(unwrap);

export const createUser = (data: UserCreateInput) =>
  api.post<{ success: boolean; data: UserAccount }>('/users', data).then(unwrap);

export const updateUser = (id: number, data: UserUpdateInput) =>
  api.put<{ success: boolean; data: UserAccount }>(`/users/${id}`, data).then(unwrap);

export const getPermissionDefs = () =>
  api.get<{ success: boolean; data: PermissionDef[] }>('/users/permissions').then(unwrap);