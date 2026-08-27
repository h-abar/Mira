import { api } from './client';
import type { Employee } from './employees';

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employee: Pick<Employee, 'id' | 'nameAr' | 'nameEn' | 'role'>;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: string | number | null;
  notes: string | null;
  createdAt: string;
}

export interface AttendanceSummaryRow {
  employeeId: number;
  employee: Pick<Employee, 'id' | 'nameAr' | 'nameEn' | 'role'>;
  days: number;
  totalHours: number;
  earliestCheckIn: string | null;
  latestCheckOut: string | null;
}

export interface AttendanceListParams {
  from?: string;
  to?: string;
  employeeId?: number;
  page?: number;
  limit?: number;
}

export interface AttendanceListResponse {
  items: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CheckInResult {
  record: AttendanceRecord;
  alreadyCheckedIn: boolean;
}

const unwrap = <T>(response: { success: boolean; data: T }): T => response.data;

export const checkIn = (employeeId?: number) =>
  api
    .post<{ success: boolean; data: CheckInResult }>(
      '/attendance/check-in',
      employeeId ? { employeeId } : undefined,
    )
    .then(unwrap);

export const checkOut = (employeeId?: number) =>
  api
    .post<{ success: boolean; data: AttendanceRecord }>(
      '/attendance/check-out',
      employeeId ? { employeeId } : undefined,
    )
    .then(unwrap);

export const listAttendance = (params?: AttendanceListParams) =>
  api
    .get<{ success: boolean; data: AttendanceListResponse }>('/attendance', { params })
    .then(unwrap);

export const attendanceSummary = (params?: AttendanceListParams) =>
  api
    .get<{ success: boolean; data: AttendanceSummaryRow[] }>('/attendance/summary', { params })
    .then(unwrap);