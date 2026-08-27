import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

const attendanceInclude = {
  employee: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      role: true,
    },
  },
} satisfies Prisma.AttendanceInclude;

const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export interface AttendanceListQuery {
  from?: Date;
  to?: Date;
  employeeId?: number;
  page?: number;
  limit?: number;
}

export interface AttendanceSummaryQuery {
  from?: Date;
  to?: Date;
  employeeId?: number;
}

async function checkIn(employeeId: number) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new ApiError(404, 'الموظفة غير موجودة');
  }

  const today = startOfDay(new Date());

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
    include: attendanceInclude,
  });

  if (existing) {
    if (existing.checkIn) {
      return { record: existing, alreadyCheckedIn: true };
    }
    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: { checkIn: new Date() },
      include: attendanceInclude,
    });
    return { record: updated, alreadyCheckedIn: false };
  }

  const record = await prisma.attendance.create({
    data: {
      employeeId,
      date: today,
      checkIn: new Date(),
    },
    include: attendanceInclude,
  });

  return { record, alreadyCheckedIn: false };
}

async function checkOut(employeeId: number) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new ApiError(404, 'الموظفة غير موجودة');
  }

  const today = startOfDay(new Date());

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!existing) {
    throw new ApiError(400, 'لا يوجد تسجيل حضور اليوم، يرجى تسجيل الدخول أولاً');
  }
  if (existing.checkOut) {
    throw new ApiError(400, 'تم تسجيل الخروج مسبقاً اليوم');
  }

  const checkOutTime = new Date();
  const checkInTime = existing.checkIn ?? checkOutTime;
  const hoursWorked = round2((checkOutTime.getTime() - checkInTime.getTime()) / 3600000);

  return prisma.attendance.update({
    where: { id: existing.id },
    data: { checkOut: checkOutTime, hoursWorked },
    include: attendanceInclude,
  });
}

async function list(query: AttendanceListQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

  const where: Prisma.AttendanceWhereInput = {};
  if (query.employeeId) {
    where.employeeId = query.employeeId;
  }
  if (query.from || query.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.from) {
      dateFilter.gte = startOfDay(query.from);
    }
    if (query.to) {
      dateFilter.lte = endOfDay(query.to);
    }
    where.date = dateFilter;
  }

  const [total, items] = await prisma.$transaction([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: attendanceInclude,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit };
}

async function summary(query: AttendanceSummaryQuery) {
  const where: Prisma.AttendanceWhereInput = {};
  if (query.employeeId) {
    where.employeeId = query.employeeId;
  }
  if (query.from || query.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.from) {
      dateFilter.gte = startOfDay(query.from);
    }
    if (query.to) {
      dateFilter.lte = endOfDay(query.to);
    }
    where.date = dateFilter;
  }

  const records = await prisma.attendance.findMany({
    where,
    include: attendanceInclude,
    orderBy: { date: 'asc' },
  });

  type Entry = {
    employee: (typeof records)[number]['employee'];
    days: number;
    totalHours: number;
    firstCheckIn: Date | null;
    lastCheckOut: Date | null;
  };

  const map = new Map<number, Entry>();

  for (const record of records) {
    let entry = map.get(record.employeeId);
    if (!entry) {
      entry = {
        employee: record.employee,
        days: 0,
        totalHours: 0,
        firstCheckIn: null,
        lastCheckOut: null,
      };
      map.set(record.employeeId, entry);
    }
    entry.days += 1;
    entry.totalHours += record.hoursWorked ? Number(record.hoursWorked) : 0;
    if (record.checkIn && (!entry.firstCheckIn || record.checkIn < entry.firstCheckIn)) {
      entry.firstCheckIn = record.checkIn;
    }
    if (record.checkOut && (!entry.lastCheckOut || record.checkOut > entry.lastCheckOut)) {
      entry.lastCheckOut = record.checkOut;
    }
  }

  const rows = Array.from(map.values()).map((entry) => ({
    employeeId: entry.employee.id,
    employee: entry.employee,
    days: entry.days,
    totalHours: round2(entry.totalHours),
    earliestCheckIn: entry.firstCheckIn,
    latestCheckOut: entry.lastCheckOut,
  }));

  rows.sort((a, b) => b.totalHours - a.totalHours);

  return rows;
}

export const attendanceService = { checkIn, checkOut, list, summary };