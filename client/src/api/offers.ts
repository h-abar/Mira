import { api } from './client';

export type DiscountType = 'PERCENT' | 'FIXED';

export interface Offer {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  discountType: DiscountType;
  value: string | number;
  validFrom?: string | null;
  validTo?: string | null;
  minTotal: string | number;
  isActive: boolean;
  isValid?: boolean;
  createdAt?: string;
}

export interface OfferInput {
  code: string;
  nameAr: string;
  nameEn: string;
  discountType: DiscountType;
  value: number;
  validFrom?: string;
  validTo?: string;
  minTotal?: number;
  isActive?: boolean;
}

export interface OfferListParams {
  active?: 'true' | 'false';
}

export interface OfferValidateResult {
  valid: boolean;
  offer?: Offer;
  discount?: number;
  message?: string;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const listOffers = (params?: OfferListParams) =>
  api.get<{ success: boolean; data: Offer[] }>('/offers', { params }).then(unwrap);

export const createOffer = (data: OfferInput) =>
  api.post<{ success: boolean; data: Offer }>('/offers', data).then(unwrap);

export const updateOffer = (id: number, data: Partial<OfferInput>) =>
  api.put<{ success: boolean; data: Offer }>(`/offers/${id}`, data).then(unwrap);

export const deleteOffer = (id: number) =>
  api.delete<{ success: boolean; data: { id: number } }>(`/offers/${id}`).then(unwrap);

export const validateOfferCode = (code: string, subtotal: number) =>
  api
    .post<{ success: boolean; data: OfferValidateResult }>('/offers/validate', { code, subtotal })
    .then(unwrap);