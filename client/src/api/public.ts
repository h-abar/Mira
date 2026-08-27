import { api } from './client';

export interface ServiceItem {
  id: number;
  nameAr: string;
  nameEn: string;
  category: string;
  price: string | number;
  durationMinutes: number;
  isActive: boolean;
}

export interface EmployeeItem {
  id: number;
  nameAr: string;
  nameEn: string;
  role: string;
}

export interface DayHours {
  day: string;
  opening: string;
  closing: string;
}

export interface SalonInfo {
  nameAr: string;
  nameEn: string;
  hours: DayHours[];
  closedDays: string[];
}

export interface TimeSlot {
  time: string;
  availableEmployeeId?: number;
  availableEmployeeName?: string;
}

export interface PublicBookingItem {
  serviceId: number;
  employeeId?: number;
}

export interface PublicBookingPayload {
  name: string;
  phone: string;
  serviceId?: number;
  items?: PublicBookingItem[];
  employeeId?: number;
  date: string;
  startTime: string;
  notes?: string;
}

export interface BookingAppointment {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  client: {
    name: string;
    phone: string;
  };
  service: {
    nameAr: string;
    nameEn: string;
    price: string | number;
    durationMinutes: number;
  };
  employee: {
    nameAr: string;
    nameEn: string;
  };
}

export interface BookingResponseData {
  bookingCode: string;
  appointments: BookingAppointment[];
  appointment?: BookingAppointment;
}

export const publicApi = {
  getServices: () => api.get<{ success: boolean; data: ServiceItem[] }>('/public/services'),

  getEmployees: () => api.get<{ success: boolean; data: EmployeeItem[] }>('/public/employees'),

  getInfo: () => api.get<{ success: boolean; data: SalonInfo }>('/public/info'),

  getAvailableSlots: (date: string, serviceIds: number[], employeeId?: number) =>
    api.get<{ success: boolean; data: TimeSlot[] }>('/public/available-slots', {
      params: { date, serviceIds: serviceIds.join(','), employeeId },
    }),

  createBooking: (payload: PublicBookingPayload) =>
    api.post<{ success: boolean; data: BookingResponseData }>('/public/book', payload),

  getBookingByCode: (code: string) =>
    api.get<{ success: boolean; data: BookingResponseData }>(`/public/booking/${code}`),
};
