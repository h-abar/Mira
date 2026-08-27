import { api } from './client';

export interface SettingItem {
  key: string;
  value: string;
  labelAr?: string;
  labelEn?: string;
}

export interface SettingsResult {
  items: SettingItem[];
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const getSettings = () =>
  api.get<{ success: boolean; data: SettingsResult }>('/settings').then(unwrap);

export const updateSettings = (values: Record<string, string>) =>
  api.put<{ success: boolean; data: SettingsResult }>('/settings', { values }).then(unwrap);
