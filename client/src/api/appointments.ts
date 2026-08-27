import { api } from './client';
import type { SendWhatsAppResult } from './notifications';

export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'ARRIVED' | 'DONE' | 'CANCELLED';

export interface AppointmentClientRef {
  id: number;
  name: string;
  phone?: string | null;
}

export interface AppointmentEmployeeRef {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface AppointmentServiceRef {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number | string;
  durationMinutes: number;
}

export interface AppointmentPaymentRef {
  id: number;
  amount: number | string;
  method: string;
  status: string;
}

export interface Appointment {
  id: number;
  clientId: number;
  employeeId: number;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string | null;
  client?: AppointmentClientRef;
  employee?: AppointmentEmployeeRef;
  service?: AppointmentServiceRef;
  payments?: AppointmentPaymentRef[];
}

export interface AppointmentInput {
  clientId: number;
  employeeId: number;
  serviceId: number;
  date: string;
  startTime: string;
  endTime?: string;
  notes?: string;
}

export interface AppointmentListParams {
  date?: string;
  employeeId?: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function listAppointments(params: AppointmentListParams = {}): Promise<Appointment[]> {
  const res = await api.get<ApiEnvelope<Appointment[]>>('/appointments', { params });
  return res.data;
}

export async function getAppointment(id: number): Promise<Appointment> {
  const res = await api.get<ApiEnvelope<Appointment>>(`/appointments/${id}`);
  return res.data;
}

export async function createAppointment(data: AppointmentInput): Promise<Appointment> {
  const res = await api.post<ApiEnvelope<Appointment>>('/appointments', data);
  return res.data;
}

export interface AppointmentGroupInput {
  clientId: number;
  date: string;
  startTime: string;
  notes?: string;
  items: Array<{ serviceId: number; employeeId: number }>;
}

export async function createAppointmentGroup(data: AppointmentGroupInput): Promise<Appointment[]> {
  const res = await api.post<ApiEnvelope<Appointment[]>>('/appointments/group', data);
  return res.data;
}

export async function updateAppointment(
  id: number,
  data: Partial<AppointmentInput>,
): Promise<Appointment> {
  const res = await api.put<ApiEnvelope<Appointment>>(`/appointments/${id}`, data);
  return res.data;
}

export async function changeAppointmentStatus(
  id: number,
  status: AppointmentStatus,
  cancellationFee?: number,
): Promise<Appointment> {
  const res = await api.patch<ApiEnvelope<Appointment>>(`/appointments/${id}/status`, {
    status,
    ...(cancellationFee !== undefined ? { cancellationFee } : {}),
  });
  return res.data;
}

export async function deleteAppointment(id: number): Promise<void> {
  await api.delete<ApiEnvelope<{ id: number }>>(`/appointments/${id}`);
}

export async function sendAppointmentReminder(
  appointmentId: number,
): Promise<SendWhatsAppResult> {
  const res = await api.post<ApiEnvelope<SendWhatsAppResult>>(
    `/appointments/${appointmentId}/remind`,
  );
  return res.data;
}