import { api } from './client';

export type LoyaltyType = 'EARN' | 'REDEEM';

export interface LoyaltyTransaction {
  id: number;
  clientId: number;
  client?: { id: number; name: string } | null;
  points: number;
  type: LoyaltyType;
  balanceAfter: number;
  referenceId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface LoyaltyTransactionListParams {
  page?: number;
  limit?: number;
}

export interface LoyaltyTransactionListResult {
  items: LoyaltyTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface AdjustPointsInput {
  type: LoyaltyType;
  points: number;
  note?: string;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const listClientTransactions = (clientId: number, params?: LoyaltyTransactionListParams) =>
  api
    .get<{ success: boolean; data: LoyaltyTransactionListResult }>(
      `/loyalty/clients/${clientId}/transactions`,
      { params },
    )
    .then(unwrap);

export const adjustClientPoints = (clientId: number, data: AdjustPointsInput) =>
  api
    .post<{ success: boolean; data: LoyaltyTransaction }>(`/loyalty/clients/${clientId}/adjust`, data)
    .then(unwrap);