import { api } from './client';

export interface Branch {
  id: number;
  nameAr: string;
  nameEn: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number; invoices: number; shiftSessions: number; users: number };
}

export interface BranchPayload {
  nameAr: string;
  nameEn: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export interface BranchListQuery {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface BranchListResponse {
  items: Branch[];
  total: number;
  page: number;
  limit: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const listBranches = (params?: BranchListQuery) =>
  api.get<ApiResponse<BranchListResponse>>('/branches', { params });

export const getBranch = (id: number) => api.get<ApiResponse<Branch>>(`/branches/${id}`);

export const createBranch = (data: BranchPayload) =>
  api.post<ApiResponse<Branch>>('/branches', data);

export const updateBranch = (id: number, data: Partial<BranchPayload>) =>
  api.put<ApiResponse<Branch>>(`/branches/${id}`, data);

export const deleteBranch = (id: number) =>
  api.delete<ApiResponse<{ id: number; isActive: boolean; message: string }>>(`/branches/${id}`);