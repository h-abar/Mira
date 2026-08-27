import { api } from './client';

export type GiftCardStatus = 'ACTIVE' | 'REDEEMED' | 'CANCELLED';

export interface GiftCard {
  id: number;
  code: string;
  clientId: number | null;
  balance: string | number;
  initialValue: string | number;
  status: GiftCardStatus;
  expiresAt: string | null;
  createdAt: string;
  client?: { id: number; name: string } | null;
}

export interface GiftCardInput {
  initialValue: number;
  clientId?: number;
  expiresAt?: string;
}

export interface GiftCardListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export interface GiftCardListResult {
  items: GiftCard[];
  total: number;
  page: number;
  limit: number;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const listGiftCards = (params?: GiftCardListParams) =>
  api.get<{ success: boolean; data: GiftCardListResult }>('/giftcards', { params }).then(unwrap);

export const createGiftCard = (data: GiftCardInput) =>
  api.post<{ success: boolean; data: GiftCard }>('/giftcards', data).then(unwrap);

export const updateGiftCard = (
  id: number,
  data: { balance?: number; status?: GiftCardStatus },
) => api.put<{ success: boolean; data: GiftCard }>(`/giftcards/${id}`, data).then(unwrap);

export const deleteGiftCard = (id: number) =>
  api.delete<{ success: boolean; data: { id: number } }>(`/giftcards/${id}`).then(unwrap);

export const lookupGiftCard = (code: string) =>
  api.get<{ success: boolean; data: GiftCard }>(`/giftcards/lookup/${encodeURIComponent(code)}`).then(unwrap);