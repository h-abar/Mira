import { type AppointmentStatus, type Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import {
  formatDateTime,
  reminderTemplate,
  sendWhatsApp,
  type Lang,
  type SendWhatsAppResult,
} from '../notifications/notifications.service';

export interface AppointmentListQuery {
  date?: string;
  employeeId?: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
}

export interface AppointmentCreateData {
  clientId: number;
  employeeId: number;
  serviceId: number;
  date: Date;
  startTime: string;
  endTime?: string;
  notes?: string;
}

export interface AppointmentUpdateData {
  clientId?: number;
  employeeId?: number;
  serviceId?: number;
  date?: Date;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

const appointmentInclude = {
  client: { select: { id: true, name: true, phone: true } },
  employee: { select: { id: true, nameAr: true, nameEn: true } },
  service: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      price: true,
      durationMinutes: true,
    },
  },
  payments: {
    select: { id: true, amount: true, method: true, status: true },
  },
} satisfies Prisma.AppointmentInclude;

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

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return time;
  }
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

async function assertNoConflict(
  employeeId: number,
  date: Date,
  startTime: string,
  endTime: string,
  excludeId?: number,
): Promise<void> {
  const conflicts = await prisma.appointment.findMany({
    where: {
      employeeId,
      date: { gte: startOfDay(date), lte: endOfDay(date) },
      status: { not: 'CANCELLED' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      NOT: {
        OR: [{ endTime: { lte: startTime } }, { startTime: { gte: endTime } }],
      },
    },
    select: { id: true },
  });

  if (conflicts.length > 0) {
    throw new ApiError(409, 'Employee already has an appointment at this time');
  }
}

const DAY_KEY_BY_GETDAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const DAY_SHORT_BY_GETDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Dynamic validation: the appointment (whose end time is derived from the
 * service duration) must fit inside the salon working hours configured in
 * Settings for that specific weekday. Silently skipped when no hours are
 * configured for the day.
 */
async function assertWithinWorkingHours(
  date: Date,
  startTime: string,
  endTime: string,
): Promise<void> {
  const idx = date.getDay();
  const keys = [
    `${DAY_KEY_BY_GETDAY[idx]}_OPENING`,
    `${DAY_KEY_BY_GETDAY[idx]}_CLOSING`,
    'CLOSED_DAYS',
  ];
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...keys, 'ENFORCE_WORKING_HOURS'] } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const closedDays = (map.get('CLOSED_DAYS') ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (closedDays.includes(DAY_SHORT_BY_GETDAY[idx].toLowerCase())) {
    throw new ApiError(400, `The salon is closed on ${DAY_SHORT_BY_GETDAY[idx]}.`);
  }

  // Time-of-day enforcement is opt-in: it only blocks bookings that fall
  // outside the configured working hours when ENFORCE_WORKING_HOURS is set to
  // a truthy value. By default it is OFF so receptionists can book appointments
  // at any time (e.g. early morning / late night) without being rejected.
  const enforce = (map.get('ENFORCE_WORKING_HOURS') ?? '').trim().toLowerCase();
  if (enforce !== '1' && enforce !== 'true' && enforce !== 'yes') return;

  const opening = map.get(`${DAY_KEY_BY_GETDAY[idx]}_OPENING`);
  const closing = map.get(`${DAY_KEY_BY_GETDAY[idx]}_CLOSING`);
  if (!opening || !closing) return; // no hours configured -> skip

  const startMin = toMinutes(startTime);
  const endMin = toMinutes(endTime);
  const openMin = toMinutes(opening);
  const closeMin = toMinutes(closing);

  if (startMin < openMin || endMin > closeMin) {
    throw new ApiError(
      400,
      `Appointment (${startTime}–${endTime}) is outside working hours ${opening}–${closing}.`,
    );
  }
}

export const appointmentsService = {
  async list(query: AppointmentListQuery) {
    let dateFilter: Prisma.DateTimeFilter | undefined;

    if (query.date) {
      const day = parseDateInput(query.date);
      dateFilter = { gte: startOfDay(day), lte: endOfDay(day) };
    } else if (query.from || query.to) {
      dateFilter = {};
      if (query.from) {
        dateFilter.gte = startOfDay(parseDateInput(query.from));
      }
      if (query.to) {
        dateFilter.lte = endOfDay(parseDateInput(query.to));
      }
    }

    const where: Prisma.AppointmentWhereInput = {};
    if (dateFilter) {
      where.date = dateFilter;
    }
    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }
    if (query.status) {
      where.status = query.status;
    }

    return prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  },

  async getById(id: number) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new ApiError(404, 'Appointment not found.');
    }
    return appointment;
  },

  async create(data: AppointmentCreateData) {
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
      select: { durationMinutes: true },
    });
    if (!service) {
      throw new ApiError(404, 'Service not found.');
    }

    const date = startOfDay(data.date);
    const endTime = data.endTime ?? addMinutes(data.startTime, service.durationMinutes);

    await assertNoConflict(data.employeeId, date, data.startTime, endTime);
    await assertWithinWorkingHours(date, data.startTime, endTime);

    return prisma.appointment.create({
      data: {
        clientId: data.clientId,
        employeeId: data.employeeId,
        serviceId: data.serviceId,
        date,
        startTime: data.startTime,
        endTime,
        notes: data.notes,
      },
      include: appointmentInclude,
    });
  },

  /**
   * Group booking: one client books several services for one or more employees.
   * - Same employee -> services are scheduled back-to-back sequentially.
   * - Different employees -> services run in parallel at the chosen start time.
   * Every item becomes its own Appointment row so the calendar shows each block.
   */
  async createGroup(data: {
    clientId: number;
    date: Date;
    startTime: string;
    notes?: string;
    items: Array<{ serviceId: number; employeeId: number }>;
  }) {
    const serviceIds = [...new Set(data.items.map((it) => it.serviceId))];
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, durationMinutes: true },
    });
    const durationOf = new Map(services.map((s) => [s.id, s.durationMinutes]));
    for (const sid of serviceIds) {
      if (!durationOf.has(sid)) {
        throw new ApiError(404, `Service ${sid} not found.`);
      }
    }

    // Sequential cursor per employee (different employees work in parallel).
    const cursors = new Map<number, string>();
    const planned: Array<{ employeeId: number; serviceId: number; startTime: string; endTime: string }> = [];

    for (const item of data.items) {
      const duration = durationOf.get(item.serviceId)!;
      const start = cursors.get(item.employeeId) ?? data.startTime;
      const end = addMinutes(start, duration);
      planned.push({ employeeId: item.employeeId, serviceId: item.serviceId, startTime: start, endTime: end });
      cursors.set(item.employeeId, end);
    }

    const date = startOfDay(data.date);

    // Conflict-check + working-hours validation for every planned slot
    // (each slot's length comes from its own service duration).
    for (const slot of planned) {
      await assertNoConflict(slot.employeeId, date, slot.startTime, slot.endTime);
      await assertWithinWorkingHours(date, slot.startTime, slot.endTime);
    }

    const created = await prisma.$transaction(
      planned.map((slot) =>
        prisma.appointment.create({
          data: {
            clientId: data.clientId,
            employeeId: slot.employeeId,
            serviceId: slot.serviceId,
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            notes: data.notes,
          },
          include: appointmentInclude,
        }),
      ),
    );

    return created;
  },

  async update(id: number, data: AppointmentUpdateData) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'Appointment not found.');
    }

    const next: {
      clientId: number;
      employeeId: number;
      serviceId: number;
      date: Date;
      startTime: string;
      endTime: string;
      notes: string | null | undefined;
    } = {
      clientId: data.clientId ?? existing.clientId,
      employeeId: data.employeeId ?? existing.employeeId,
      serviceId: data.serviceId ?? existing.serviceId,
      date: data.date ? startOfDay(data.date) : existing.date,
      startTime: data.startTime ?? existing.startTime,
      endTime: data.endTime ?? existing.endTime,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    };

    // Re-derive the end time from the service duration whenever the start time
    // or the service changes and no explicit endTime was sent. This keeps the
    // block length on the calendar exactly equal to the service duration.
    if (
      !data.endTime &&
      (data.startTime !== undefined || (data.serviceId !== undefined && data.serviceId !== existing.serviceId))
    ) {
      const service = await prisma.service.findUnique({
        where: { id: next.serviceId },
        select: { durationMinutes: true },
      });
      if (!service) {
        throw new ApiError(404, 'Service not found.');
      }
      next.endTime = addMinutes(next.startTime, service.durationMinutes);
    }

    const scheduleChanged =
      data.employeeId !== undefined ||
      data.date !== undefined ||
      data.startTime !== undefined ||
      data.endTime !== undefined;

    if (scheduleChanged) {
      await assertNoConflict(next.employeeId, next.date, next.startTime, next.endTime, id);
      await assertWithinWorkingHours(next.date, next.startTime, next.endTime);
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        clientId: next.clientId,
        employeeId: next.employeeId,
        serviceId: next.serviceId,
        date: next.date,
        startTime: next.startTime,
        endTime: next.endTime,
        notes: next.notes,
      },
      include: appointmentInclude,
    });
  },

  async changeStatus(id: number, status: AppointmentStatus, cancellationFee?: number) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'Appointment not found.');
    }

    const data: Prisma.AppointmentUpdateInput = { status };
    if (status === 'CANCELLED' && cancellationFee !== undefined) {
      data.cancellationFee = cancellationFee > 0 ? cancellationFee : null;
    }

    return prisma.appointment.update({
      where: { id },
      data,
      include: appointmentInclude,
    });
  },

  async remove(id: number) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'Appointment not found.');
    }

    await prisma.appointment.delete({ where: { id } });
    return { id };
  },

  async sendReminder(id: number, lang: Lang = 'ar'): Promise<SendWhatsAppResult> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, phone: true, whatsapp: true } },
        employee: { select: { id: true, nameAr: true, nameEn: true } },
        service: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    if (!appointment) {
      throw new ApiError(404, 'Appointment not found.');
    }

    const phone = appointment.client.whatsapp || appointment.client.phone;
    if (!phone) {
      throw new ApiError(400, 'العميلة ليس لديها رقم هاتف مسجل لإرسال التذكير');
    }

    const serviceName = lang === 'en' ? appointment.service.nameEn : appointment.service.nameAr;
    const message = reminderTemplate(
      appointment.client.name,
      serviceName,
      formatDateTime(appointment.date, appointment.startTime),
      undefined,
      lang,
    );

    return sendWhatsApp(phone, message, {
      referenceId: `APPT-${id}`,
      type: 'appointment-reminder',
      lang,
    });
  },
};