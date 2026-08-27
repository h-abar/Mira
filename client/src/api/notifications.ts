import { api } from './client';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface NotificationItem {
  id: number;
  type: string;
  target: string;
  message: string;
  status: NotificationStatus;
  referenceId?: string | null;
  createdAt: string;
}

export interface SendWhatsAppInput {
  phone: string;
  message: string;
  referenceId?: string;
  type?: string;
}

export interface SendWhatsAppResult {
  notification: NotificationItem;
  simulated?: boolean;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: string;
}

export interface NotificationListResult {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const sendWhatsApp = (data: SendWhatsAppInput) =>
  api
    .post<{ success: boolean; data: SendWhatsAppResult }>('/notifications/whatsapp', data)
    .then(unwrap);

export interface WhatsAppTestResult {
  simulated: boolean;
}

export const sendWhatsAppTest = (phone: string) =>
  api
    .post<{ success: boolean; data: WhatsAppTestResult }>('/notifications/test', { phone })
    .then(unwrap);

export const listNotifications = (params?: NotificationListQuery) =>
  api
    .get<{ success: boolean; data: NotificationListResult }>('/notifications', { params })
    .then(unwrap);

export interface CampaignInput {
  audience: 'birthday' | 'inactive' | 'ids';
  clientIds?: number[];
  inactiveDays?: number;
  message: string;
}

export interface CampaignResult {
  targetCount: number;
  withPhone: number;
  sentCount: number;
  results: { clientId: number; status: 'SENT' | 'FAILED' | 'NO_PHONE' }[];
}

export const sendCampaign = (data: CampaignInput) =>
  api.post<{ success: boolean; data: CampaignResult }>('/notifications/campaign', data).then(unwrap);

export interface RetryResult {
  notification: NotificationItem;
  simulated?: boolean;
}

export interface ReminderScheduleStatus {
  enabled: boolean;
  cronExpression: string;
  hoursBefore: number;
  lastRunAt: string | null;
  lastRunSent: number;
  lastRunFailed: number;
}

export const retryNotification = (id: number) =>
  api
    .post<{ success: boolean; data: RetryResult }>(`/notifications/${id}/retry`)
    .then(unwrap);

export const getNotificationSchedule = () =>
  api
    .get<{ success: boolean; data: ReminderScheduleStatus }>('/notifications/schedule')
    .then(unwrap);