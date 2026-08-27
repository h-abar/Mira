import { api } from './client';

export interface ClientAppointment {
  id: number;
  date: string;
  status: string;
  notes?: string | null;
  service?: { id: number; nameAr: string; nameEn: string } | null;
}

export interface ClientInvoice {
  id: number;
  invoiceNo: string;
  date: string;
  total: string;
  status: string;
}

export interface Client {
  id: number;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  birthdate?: string | null;
  notes?: string | null;
  totalSpent: string;
  loyaltyPoints?: number;
  visitCount?: number;
  lastVisitAt?: string | null;
  favoriteService?: { id: number; nameAr: string; nameEn: string } | null;
  createdAt?: string;
  appointments?: ClientAppointment[];
  invoices?: ClientInvoice[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface ClientListData {
  items: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export interface ClientInput {
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  birthdate?: string;
  notes?: string;
}

export async function listClients(params: ClientListParams = {}): Promise<ClientListData> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const res = await api.get<ApiEnvelope<ClientListData>>(`/clients${qs ? `?${qs}` : ''}`);
  return res.data;
}

export async function getClient(id: number): Promise<Client> {
  const res = await api.get<ApiEnvelope<Client>>(`/clients/${id}`);
  return res.data;
}

export async function createClient(data: ClientInput): Promise<Client> {
  const res = await api.post<ApiEnvelope<Client>>('/clients', data);
  return res.data;
}

export async function updateClient(id: number, data: ClientInput): Promise<Client> {
  const res = await api.put<ApiEnvelope<Client>>(`/clients/${id}`, data);
  return res.data;
}

export async function deleteClient(id: number): Promise<Client> {
  const res = await api.delete<ApiEnvelope<Client>>(`/clients/${id}`);
  return res.data;
}