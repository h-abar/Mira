import { api } from './client';

export interface MembershipPlan {
  id: number;
  nameAr: string;
  nameEn: string;
  price: string | number;
  durationDays: number;
  serviceIds: number[];
  isActive: boolean;
  createdAt: string;
  membersCount?: number;
}

export interface ClientMembership {
  id: number;
  clientId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  remainingDays?: number;
  client?: { id: number; name: string } | null;
  plan?: MembershipPlan | null;
}

export interface PlanInput {
  nameAr: string;
  nameEn: string;
  price: number;
  durationDays: number;
  serviceIds?: number[];
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const listPlans = () =>
  api.get<{ success: boolean; data: MembershipPlan[] }>('/memberships/plans').then(unwrap);

export const createPlan = (data: PlanInput) =>
  api.post<{ success: boolean; data: MembershipPlan }>('/memberships/plans', data).then(unwrap);

export const updatePlan = (id: number, data: Partial<PlanInput>) =>
  api.put<{ success: boolean; data: MembershipPlan }>(`/memberships/plans/${id}`, data).then(unwrap);

export const deletePlan = (id: number) =>
  api.delete<{ success: boolean; data: { id: number } }>(`/memberships/plans/${id}`).then(unwrap);

export const listMemberships = () =>
  api.get<{ success: boolean; data: ClientMembership[] }>('/memberships').then(unwrap);

export const assignMembership = (clientId: number, planId: number) =>
  api
    .post<{ success: boolean; data: ClientMembership }>('/memberships/assign', { clientId, planId })
    .then(unwrap);

export const cancelMembership = (id: number) =>
  api
    .post<{ success: boolean; data: ClientMembership }>(`/memberships/${id}/cancel`)
    .then(unwrap);