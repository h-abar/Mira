import { api } from './client';

export type MovementType = 'IN' | 'SALE' | 'USAGE' | 'LOSS';

export interface Product {
  id: number;
  nameAr: string;
  nameEn: string;
  barcode?: string | null;
  category: string;
  quantity: number;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  isActive?: boolean;
  supplier?: string | null;
  _count?: { movements: number };
}

export interface StockMovement {
  id: number;
  productId: number;
  type: MovementType;
  quantity: number;
  date: string;
  referenceId?: string | null;
  product?: Product;
}

export interface ListProductsParams {
  q?: string;
  lowStock?: boolean;
  category?: string;
  branchId?: number;
}

export interface ProductPayload {
  nameAr: string;
  nameEn: string;
  barcode?: string;
  category: string;
  quantity?: number;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  minStock?: number;
  supplier?: string;
  supplierId?: number;
  branchId?: number | null;
  isActive?: boolean;
}

export interface MovementPayload {
  productId: number;
  type: MovementType;
  quantity: number;
  referenceId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const unwrap = <T>(response: ApiResponse<T>): T => response.data;

export const listProducts = (params: ListProductsParams = {}) =>
  api.get<ApiResponse<Product[]>>('/inventory/products', { params }).then(unwrap);

export const createProduct = (data: ProductPayload) =>
  api.post<ApiResponse<Product>>('/inventory/products', data);

export const updateProduct = (id: number, data: Partial<ProductPayload>) =>
  api.put<ApiResponse<Product>>(`/inventory/products/${id}`, data);

export const deleteProduct = (id: number) =>
  api.delete<ApiResponse<Product>>(`/inventory/products/${id}`);

export const addMovement = (data: MovementPayload) =>
  api.post<ApiResponse<StockMovement>>('/inventory/movements', data);

export const listMovements = (productId?: number) =>
  api.get<ApiResponse<StockMovement[]>>(
    productId ? `/inventory/products/${productId}/movements` : '/inventory/movements',
  );