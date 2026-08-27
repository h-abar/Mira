import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

export interface OpenShiftInput {
  employeeId: number;
  openedByUserId: number;
  openingBalance?: number;
  notes?: string;
}

export interface CloseShiftInput {
  actualCash: number;
  notes?: string;
}

export interface ShiftListQuery {
  from?: Date;
  to?: Date;
  employeeId?: number;
  status?: 'OPEN' | 'CLOSED';
  branchId?: number;
  page?: number;
  limit?: number;
}

const shiftIncludes = {
  employee: true,
  openedByUser: {
    select: {
      id: true,
      username: true,
      role: true,
    },
  },
  _count: {
    select: {
      invoices: true,
      expenses: true,
    },
  },
} satisfies Prisma.ShiftSessionInclude;

export const shiftsService = {
  async openShift(input: OpenShiftInput) {
    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
    });
    if (!employee) {
      throw new ApiError(404, 'الموظفة غير موجودة');
    }

    // Check if employee already has an OPEN shift
    const existingOpenShift = await prisma.shiftSession.findFirst({
      where: {
        employeeId: input.employeeId,
        status: 'OPEN',
      },
    });

    if (existingOpenShift) {
      throw new ApiError(400, 'توجد وردية مفتوحة مسبقاً لهذه الموظفة، يرجى إغلاقها أولاً');
    }

    const openingBalance = round2(Number(input.openingBalance) || 0);

    return prisma.shiftSession.create({
      data: {
        employeeId: input.employeeId,
        openedByUserId: input.openedByUserId,
        openingBalance,
        expectedCash: openingBalance,
        totalSales: 0,
        totalCashSales: 0,
        totalCardSales: 0,
        totalExpenses: 0,
        status: 'OPEN',
        notes: input.notes,
      },
      include: shiftIncludes,
    });
  },

  async getActiveShift(employeeId?: number) {
    const where: Prisma.ShiftSessionWhereInput = {
      status: 'OPEN',
    };
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const activeShift = await prisma.shiftSession.findFirst({
      where,
      include: {
        ...shiftIncludes,
        invoices: {
          include: { client: true },
          orderBy: { date: 'desc' },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    if (!activeShift) {
      return null;
    }

    // Calculate live totals from connected invoices and expenses
    const invoices = activeShift.invoices;
    const expenses = activeShift.expenses;

    const totalSales = round2(
      invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
    );
    const totalCashSales = round2(
      invoices
        .filter((inv) => inv.paymentMethod === 'CASH')
        .reduce((sum, inv) => sum + Number(inv.total), 0),
    );
    const totalCardSales = round2(
      invoices
        .filter((inv) => inv.paymentMethod === 'CARD')
        .reduce((sum, inv) => sum + Number(inv.total), 0),
    );
    const totalExpenses = round2(
      expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
    );

    const openingBalance = Number(activeShift.openingBalance);
    const expectedCash = round2(openingBalance + totalCashSales - totalExpenses);

    return {
      ...activeShift,
      liveTotals: {
        totalSales,
        totalCashSales,
        totalCardSales,
        totalExpenses,
        expectedCash,
        invoicesCount: invoices.length,
        expensesCount: expenses.length,
      },
    };
  },

  async closeShift(id: number, input: CloseShiftInput) {
    const shift = await prisma.shiftSession.findUnique({
      where: { id },
      include: {
        invoices: true,
        expenses: true,
      },
    });

    if (!shift) {
      throw new ApiError(404, 'الوردية غير موجودة');
    }

    if (shift.status === 'CLOSED') {
      throw new ApiError(400, 'الوردية مغلقة بالفعل مسبقاً');
    }

    const totalSales = round2(
      shift.invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
    );
    const totalCashSales = round2(
      shift.invoices
        .filter((inv) => inv.paymentMethod === 'CASH')
        .reduce((sum, inv) => sum + Number(inv.total), 0),
    );
    const totalCardSales = round2(
      shift.invoices
        .filter((inv) => inv.paymentMethod === 'CARD')
        .reduce((sum, inv) => sum + Number(inv.total), 0),
    );
    const totalExpenses = round2(
      shift.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
    );

    const openingBalance = Number(shift.openingBalance);
    const expectedCash = round2(openingBalance + totalCashSales - totalExpenses);
    const actualCash = round2(Number(input.actualCash) || 0);
    const difference = round2(actualCash - expectedCash);

    return prisma.shiftSession.update({
      where: { id },
      data: {
        endTime: new Date(),
        status: 'CLOSED',
        totalSales,
        totalCashSales,
        totalCardSales,
        totalExpenses,
        expectedCash,
        actualCash,
        difference,
        notes: input.notes
          ? shift.notes
            ? `${shift.notes}\n[إغلاق]: ${input.notes}`
            : input.notes
          : shift.notes,
      },
      include: shiftIncludes,
    });
  },

  async listShifts(query: ShiftListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const where: Prisma.ShiftSessionWhereInput = {};

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.branchId) {
      where.branchId = query.branchId;
    }
    if (query.from || query.to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.from) {
        const d = new Date(query.from);
        d.setHours(0, 0, 0, 0);
        dateFilter.gte = d;
      }
      if (query.to) {
        const d = new Date(query.to);
        d.setHours(23, 59, 59, 999);
        dateFilter.lte = d;
      }
      where.startTime = dateFilter;
    }

    const [total, items] = await prisma.$transaction([
      prisma.shiftSession.count({ where }),
      prisma.shiftSession.findMany({
        where,
        include: shiftIncludes,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, total, page, limit };
  },

  async getShiftDetails(id: number) {
    const shift = await prisma.shiftSession.findUnique({
      where: { id },
      include: {
        ...shiftIncludes,
        invoices: {
          include: {
            client: true,
            employee: true,
            items: { include: { service: true, product: true } },
          },
          orderBy: { date: 'desc' },
        },
        expenses: {
          include: { creator: true },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!shift) {
      throw new ApiError(404, 'الوردية غير موجودة');
    }

    return shift;
  },
};
