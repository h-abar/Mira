import { api } from './client';

export interface Supplier {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number; purchaseOrders: number };
}

export interface SupplierPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SupplierListQuery {
  q?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface SupplierListResponse {
  items: Supplier[];
  total: number;
  page: number;
  limit: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const listSuppliers = (params?: SupplierListQuery) =>
  api.get<ApiResponse<SupplierListResponse>>('/suppliers', { params });

export const getSupplier = (id: number) => api.get<ApiResponse<Supplier>>(`/suppliers/${id}`);

export const createSupplier = (data: SupplierPayload) =>
  api.post<ApiResponse<Supplier>>('/suppliers', data);

export const updateSupplier = (id: number, data: Partial<SupplierPayload>) =>
  api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);

export const deleteSupplier = (id: number) =>
  api.delete<ApiResponse<{ id: number; isActive: boolean; message: string }>>(`/suppliers/${id}`);