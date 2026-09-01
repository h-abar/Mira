import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function parseDateInput(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DEFAULT_OPENING = '10:00';
const DEFAULT_CLOSING = '21:00';

const ALL_HOURS_KEYS = [
  'SALON_NAME_AR',
  'SALON_NAME_EN',
  'CLOSED_DAYS',
  ...DAYS.flatMap((d) => [`${d.toUpperCase()}_OPENING`, `${d.toUpperCase()}_CLOSING`]),
  'OPENING_TIME',
  'CLOSING_TIME',
  'SOCIAL_INSTAGRAM',
  'SOCIAL_FACEBOOK',
  'SOCIAL_WHATSAPP',
  'SOCIAL_SNAPCHAT',
  'SOCIAL_TIKTOK',
  'WHATSAPP_PUBLIC_PHONE',
];

function normalizeSocialUrl(
  kind: 'instagram' | 'facebook' | 'whatsapp' | 'snapchat' | 'tiktok',
  raw: string | undefined,
): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  if (kind === 'whatsapp') {
    const digits = v.replace(/[^\d]/g, '');
    if (digits.length < 8) return null;
    return `https://wa.me/${digits}`;
  }
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/^\/+/, '');
  if (!handle) return null;
  switch (kind) {
    case 'instagram':
      return `https://www.instagram.com/${handle}`;
    case 'facebook':
      return `https://www.facebook.com/${handle}`;
    case 'snapchat':
      return `https://www.snapchat.com/add/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    default:
      return null;
  }
}

function parseClosedDays(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
}

function buildSchedule(map: Map<string, string>) {
  const fallbackOpening = map.get('OPENING_TIME') || DEFAULT_OPENING;
  const fallbackClosing = map.get('CLOSING_TIME') || DEFAULT_CLOSING;
  return DAYS.map((day) => ({
    day,
    opening: map.get(`${day.toUpperCase()}_OPENING`) || fallbackOpening,
    closing: map.get(`${day.toUpperCase()}_CLOSING`) || fallbackClosing,
  }));
}

export interface PublicBookingItemInput {
  serviceId: number;
  employeeId?: number;
}

export interface PublicBookingInput {
  name: string;
  phone: string;
  serviceId?: number;
  items?: PublicBookingItemInput[];
  employeeId?: number;
  date: string;
  startTime: string;
  notes?: string;
}

export const publicService = {
  async getServices() {
    return prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { nameAr: 'asc' }],
    });
  },

  async getEmployees() {
    return prisma.employee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        role: true,
      },
      orderBy: { nameAr: 'asc' },
    });
  },

  async getSalonInfo() {
    const rows = await prisma.setting.findMany({ where: { key: { in: ALL_HOURS_KEYS } } });
    const map = new Map(rows.map((r) => [r.key, r.value?.trim() || '']));
    return {
      nameAr: map.get('SALON_NAME_AR') || 'ميرا',
      nameEn: map.get('SALON_NAME_EN') || 'Mira',
      hours: buildSchedule(map),
      closedDays: parseClosedDays(map.get('CLOSED_DAYS')),
      social: {
        instagram: normalizeSocialUrl('instagram', map.get('SOCIAL_INSTAGRAM')),
        facebook: normalizeSocialUrl('facebook', map.get('SOCIAL_FACEBOOK')),
        whatsapp: normalizeSocialUrl('whatsapp', map.get('SOCIAL_WHATSAPP') || map.get('WHATSAPP_PUBLIC_PHONE')),
        snapchat: normalizeSocialUrl('snapchat', map.get('SOCIAL_SNAPCHAT')),
        tiktok: normalizeSocialUrl('tiktok', map.get('SOCIAL_TIKTOK')),
      },
    };
  },

  async getAvailableSlots(dateStr: string, serviceIds: number[], employeeId?: number) {
    if (!serviceIds || serviceIds.length === 0) {
      throw new ApiError(400, 'Service required');
    }
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });
    if (services.length !== serviceIds.length) {
      throw new ApiError(404, 'Service not found');
    }
    const duration = services.reduce((total, svc) => total + svc.durationMinutes, 0);

    const date = parseDateInput(dateStr);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayOfWeekNames[date.getDay()];

    const allEmployees = await prisma.employee.findMany({
      where: {
        isActive: true,
        ...(employeeId && employeeId > 0 ? { id: employeeId } : {}),
      },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
      },
    });

    const employees = allEmployees;

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: { not: 'CANCELLED' },
        ...(employees.length > 0 ? { employeeId: { in: employees.map((e) => e.id) } } : {}),
      },
      select: {
        employeeId: true,
        startTime: true,
        endTime: true,
      },
    });

    // Use this day's business hours from settings (weekly schedule) — single query
    const dayKey = currentDayName.toUpperCase();
    const hoursRows = await prisma.setting.findMany({
      where: { key: { in: [`${dayKey}_OPENING`, `${dayKey}_CLOSING`, 'OPENING_TIME', 'CLOSING_TIME', 'CLOSED_DAYS'] } },
    });
    const hMap = new Map(hoursRows.map((r) => [r.key, r.value?.trim() || '']));
    const closedDays = parseClosedDays(hMap.get('CLOSED_DAYS'));
    let openingMinutes = timeToMinutes(hMap.get(`${dayKey}_OPENING`) || hMap.get('OPENING_TIME') || DEFAULT_OPENING);
    let closingMinutes = timeToMinutes(hMap.get(`${dayKey}_CLOSING`) || hMap.get('CLOSING_TIME') || DEFAULT_CLOSING);
    if (closedDays.includes(currentDayName) || closingMinutes <= openingMinutes) {
      return [];
    }

    const slots: {
      time: string;
      available: boolean;
      availableEmployeeId?: number;
      availableEmployeeName?: string;
    }[] = [];

    for (let current = openingMinutes; current + duration <= closingMinutes; current += 30) {
      const slotStartStr = minutesToTime(current);
      const slotStart = current;
      const slotEnd = current + duration;

      const freeEmployees = employees.filter((emp) => {
        const empAppointments = existingAppointments.filter((a) => a.employeeId === emp.id);
        const hasConflict = empAppointments.some((app) => {
          const appStart = timeToMinutes(app.startTime);
          const appEnd = timeToMinutes(app.endTime);
          return Math.max(slotStart, appStart) < Math.min(slotEnd, appEnd);
        });
        return !hasConflict;
      });

      slots.push({
        time: slotStartStr,
        available: freeEmployees.length > 0,
        availableEmployeeId: freeEmployees[0]?.id,
        availableEmployeeName: freeEmployees[0]?.nameAr,
      });
    }

    return slots;
  },

  async createBooking(data: PublicBookingInput) {
    // Normalize to a list of service/employee items
    const items: PublicBookingItemInput[] =
      data.items && data.items.length > 0
        ? data.items
        : data.serviceId
          ? [{ serviceId: data.serviceId, employeeId: data.employeeId }]
          : [];

    if (items.length === 0) {
      throw new ApiError(400, 'يرجى اختيار خدمة واحدة على الأقل');
    }

    const serviceIds = [...new Set(items.map((i) => i.serviceId))];
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });
    const durationOf = new Map<number, number>(services.map((s) => [s.id, s.durationMinutes]));
    for (const sid of serviceIds) {
      if (!durationOf.has(sid)) throw new ApiError(404, 'الخدمة غير موجودة');
    }

    const date = startOfDay(parseDateInput(data.date));
    const startMinutes = timeToMinutes(data.startTime);

    // Assign employees per item. A global employeeId (when provided) applies to all
    // items; otherwise auto-assign one free employee for the whole sequential block.
    const planned = items.map((it) => ({
      serviceId: it.serviceId,
      employeeId: it.employeeId ?? data.employeeId,
    }));

    const needsAuto = planned.some((p) => !p.employeeId || p.employeeId <= 0);
    if (needsAuto) {
      const totalDuration = items.reduce((sum, it) => sum + (durationOf.get(it.serviceId) ?? 0), 0);
      const freeEmp = await this.findFreeEmployeeForBlock(date, startMinutes, startMinutes + totalDuration);
      if (!freeEmp) {
        throw new ApiError(400, 'عذراً، لا يوجد خبيرة متاحة في هذا الموعد');
      }
      planned.forEach((p) => {
        if (!p.employeeId || p.employeeId <= 0) p.employeeId = freeEmp;
      });
    }

    // Schedule services sequentially per employee
    const cursors = new Map<number, number>();
    const slots = planned.map((p) => {
      const empId = p.employeeId as number;
      const duration = durationOf.get(p.serviceId) ?? 0;
      const start = cursors.get(empId) ?? startMinutes;
      const end = start + duration;
      cursors.set(empId, end);
      return {
        employeeId: empId,
        serviceId: p.serviceId,
        startMin: start,
        endMin: end,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      };
    });

    // Conflict check for each scheduled slot
    for (const slot of slots) {
      const conflict = await prisma.appointment.findFirst({
        where: {
          employeeId: slot.employeeId,
          date: { gte: date, lte: endOfDay(date) },
          status: { not: 'CANCELLED' },
          NOT: {
            OR: [{ endTime: { lte: slot.startTime } }, { startTime: { gte: slot.endTime } }],
          },
        },
      });
      if (conflict) {
        throw new ApiError(409, 'الموعد المختار محجوز سابقاً، يرجى اختيار موعد آخر');
      }
    }

    // Find or create client by phone
    const cleanPhone = data.phone.trim();
    let client = await prisma.client.findFirst({
      where: { phone: cleanPhone },
    });
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: data.name.trim(),
          phone: cleanPhone,
          whatsapp: cleanPhone,
        },
      });
    }

    const appointments = await prisma.$transaction(
      slots.map((slot) =>
        prisma.appointment.create({
          data: {
            clientId: client.id,
            employeeId: slot.employeeId,
            serviceId: slot.serviceId,
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            notes: data.notes ? `[حجز أونلاين] ${data.notes}` : '[حجز أونلاين]',
            status: 'BOOKED',
          },
          include: {
            client: true,
            service: true,
            employee: true,
          },
        }),
      ),
    );

    const bookingCode = `SLN-${appointments[0].id}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      appointments,
      bookingCode,
    };
  },

  async findFreeEmployeeForBlock(date: Date, startMinutes: number, endMinutes: number): Promise<number | null> {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    for (const emp of employees) {
      const conflicts = await prisma.appointment.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: dayStart, lte: dayEnd },
          status: { not: 'CANCELLED' },
          NOT: {
            OR: [{ endTime: { lte: minutesToTime(startMinutes) } }, { startTime: { gte: minutesToTime(endMinutes) } }],
          },
        },
      });
      if (conflicts.length === 0) return emp.id;
    }
    return null;
  },

  async getBookingByCode(code: string) {
    const raw = code.trim();
    const parts = raw.split('-');
    const id = Number(parts.length >= 2 ? parts[1] : parts[0]);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'رمز الحجز غير صحيح');
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        service: true,
        employee: true,
      },
    });

    if (!appointment) {
      throw new ApiError(404, 'لم يتم العثور على الحجز');
    }

    return {
      appointment,
      bookingCode: code.startsWith('SLN-') ? code : `SLN-${appointment.id}`,
    };
  },

  async searchBookings(query: { code?: string; phone?: string; name?: string }) {
    const code = query.code?.trim();
    const phone = query.phone?.trim();
    const name = query.name?.trim();

    if (code) {
      const found = await this.getBookingByCode(code);
      return {
        bookings: [
          {
            bookingCode: found.bookingCode,
            appointment: found.appointment,
          },
        ],
      };
    }

    if (!phone && !name) {
      throw new ApiError(400, 'يرجى إدخال رمز الحجز أو رقم الجوال أو الاسم');
    }

    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
    const clientFilter: Prisma.ClientWhereInput = {};
    if (name) {
      clientFilter.name = { contains: name, mode: 'insensitive' };
    }
    if (phoneDigits) {
      const lastNine = phoneDigits.length >= 9 ? phoneDigits.slice(-9) : phoneDigits;
      clientFilter.OR = [
        { phone: { contains: lastNine } },
        { whatsapp: { contains: lastNine } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where: { client: clientFilter },
      include: {
        client: true,
        service: true,
        employee: true,
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
      take: 20,
    });

    if (appointments.length === 0) {
      throw new ApiError(404, 'لم يتم العثور على الحجز');
    }

    return {
      bookings: appointments.map((appointment) => ({
        bookingCode: `SLN-${appointment.id}`,
        appointment,
      })),
    };
  },
};
