import { api } from './client';

export interface Service {
  id: number;
  nameAr: string;
  nameEn: string;
  category: string;
  price: string;
  durationMinutes: number;
  cost: string;
  isActive: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ServiceListParams {
  active?: boolean;
}

export interface ServiceInput {
  nameAr: string;
  nameEn: string;
  category: string;
  price: number;
  durationMinutes: number;
  cost: number;
  isActive: boolean;
}

export async function listServices(params: ServiceListParams = {}): Promise<Service[]> {
  const search = new URLSearchParams();
  if (typeof params.active === 'boolean') {
    search.set('active', String(params.active));
  }
  const qs = search.toString();
  const res = await api.get<ApiEnvelope<Service[]>>(`/services${qs ? `?${qs}` : ''}`);
  return res.data;
}

export async function getService(id: number): Promise<Service> {
  const res = await api.get<ApiEnvelope<Service>>(`/services/${id}`);
  return res.data;
}

export async function createService(data: ServiceInput): Promise<Service> {
  const res = await api.post<ApiEnvelope<Service>>('/services', data);
  return res.data;
}

export async function updateService(
  id: number,
  data: Partial<ServiceInput>,
): Promise<Service> {
  const res = await api.put<ApiEnvelope<Service>>(`/services/${id}`, data);
  return res.data;
}

export async function deleteService(id: number): Promise<Service> {
  const res = await api.delete<ApiEnvelope<Service>>(`/services/${id}`);
  return res.data;
}