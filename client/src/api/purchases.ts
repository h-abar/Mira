import { api } from './client';
import type { Supplier } from './suppliers';
import type { Product } from './inventory';

export type PurchaseStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';
export type PurchasePaymentMethod = 'CASH' | 'CARD' | 'WALLET';

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId?: number | null;
  product?: Pick<Product, 'id' | 'nameAr' | 'nameEn' | 'barcode'> | null;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: number;
  orderNo: string;
  supplierId?: number | null;
  supplier?: Pick<Supplier, 'id' | 'name' | 'phone'> | null;
  date: string;
  status: PurchaseStatus;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PurchasePaymentMethod;
  notes?: string | null;
  createdBy: number;
  createdAt: string;
  items?: PurchaseOrderItem[];
  _count?: { items: number };
}

export interface PurchaseInputItem {
  productId?: number;
  productName?: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseInput {
  supplierId?: number;
  items: PurchaseInputItem[];
  discount?: number;
  paymentMethod?: PurchasePaymentMethod;
  notes?: string;
}

export interface PurchaseListQuery {
  supplierId?: number;
  status?: PurchaseStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseListResponse {
  items: PurchaseOrder[];
  total: number;
  page: number;
  limit: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const createPurchaseOrder = (data: PurchaseInput) =>
  api.post<ApiResponse<PurchaseOrder>>('/purchases', data);

export const listPurchaseOrders = (params?: PurchaseListQuery) =>
  api.get<ApiResponse<PurchaseListResponse>>('/purchases', { params });

export const getPurchaseOrder = (id: number) =>
  api.get<ApiResponse<PurchaseOrder>>(`/purchases/${id}`);

export const receivePurchaseOrder = (id: number) =>
  api.post<ApiResponse<PurchaseOrder>>(`/purchases/${id}/receive`);

export const cancelPurchaseOrder = (id: number) =>
  api.post<ApiResponse<PurchaseOrder>>(`/purchases/${id}/cancel`);