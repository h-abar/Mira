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
];

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

    // Fetch candidate employees
    const allEmployees = await prisma.employee.findMany({
      where: {
        isActive: true,
        ...(employeeId && employeeId > 0 ? { id: employeeId } : {}),
      },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        shiftStart: true,
        shiftEnd: true,
        workDays: true,
      },
    });

    // Filter employees working on this day of week
    const employees = allEmployees.filter((emp) => {
      if (!emp.workDays) return true;
      const days = emp.workDays.split(',').map((d) => d.trim());
      return days.includes(currentDayName);
    });

    if (employees.length === 0) {
      return [];
    }

    // Fetch existing appointments on that day
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: { not: 'CANCELLED' },
        employeeId: { in: employees.map((e) => e.id) },
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

    const slots: { time: string; availableEmployeeId?: number; availableEmployeeName?: string }[] = [];

    // Step every 30 minutes
    for (let current = openingMinutes; current + duration <= closingMinutes; current += 30) {
      const slotStartStr = minutesToTime(current);
      const slotEndStr = minutesToTime(current + duration);

      const slotStart = current;
      const slotEnd = current + duration;

      // Find employees free during this slot and within their shift hours
      const freeEmployees = employees.filter((emp) => {
        const empShiftStart = emp.shiftStart ? timeToMinutes(emp.shiftStart) : openingMinutes;
        const empShiftEnd = emp.shiftEnd ? timeToMinutes(emp.shiftEnd) : closingMinutes;

        // Check shift bounds
        if (slotStart < empShiftStart || slotEnd > empShiftEnd) {
          return false;
        }

        const empAppointments = existingAppointments.filter((a) => a.employeeId === emp.id);
        const hasConflict = empAppointments.some((app) => {
          const appStart = timeToMinutes(app.startTime);
          const appEnd = timeToMinutes(app.endTime);
          return Math.max(slotStart, appStart) < Math.min(slotEnd, appEnd);
        });
        return !hasConflict;
      });

      if (freeEmployees.length > 0) {
        slots.push({
          time: slotStartStr,
          availableEmployeeId: freeEmployees[0].id,
          availableEmployeeName: freeEmployees[0].nameAr,
        });
      }
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
      select: { id: true, shiftStart: true, shiftEnd: true, workDays: true },
    });
    const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayOfWeekNames[date.getDay()];
    for (const emp of employees) {
      if (emp.workDays) {
        const days = emp.workDays.split(',').map((d) => d.trim());
        if (!days.includes(currentDayName)) continue;
      }
      const empShiftStart = emp.shiftStart ? timeToMinutes(emp.shiftStart) : 0;
      const empShiftEnd = emp.shiftEnd ? timeToMinutes(emp.shiftEnd) : 1440;
      if (startMinutes < empShiftStart || endMinutes > empShiftEnd) continue;
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
    const parts = code.split('-');
    const id = Number(parts[1]);
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
      bookingCode: code,
    };
  },
};
