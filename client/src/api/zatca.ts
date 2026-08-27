import { api } from './client';

export interface ZatcaStatus {
  configured: boolean;
  env: string;
  vatNumber: string;
  sellerName: string;
  certificateValid: boolean;
  certificateNotAfter: string | null;
}

export interface ZatcaTestResult {
  qrBase64: string;
  signatureB64: string;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const getZatcaStatus = () =>
  api.get<{ success: boolean; data: ZatcaStatus }>('/zatca/status').then(unwrap);

export const zatcaSetup = () =>
  api.post<{ success: boolean; data: ZatcaStatus }>('/zatca/setup').then(unwrap);

export const zatcaTest = () =>
  api.get<{ success: boolean; data: ZatcaTestResult }>('/zatca/test').then(unwrap);
