import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export interface ReportRange {
  from?: Date;
  to?: Date;
  branchId?: number;
  employeeId?: number;
}

export type GroupBy = 'day' | 'week' | 'month';

export interface GroupedReport {
  label: string;
  total: number;
  count: number;
}

export type Lang = 'ar' | 'en';

interface ExportDataset {
  title: string;
  subtitle: string;
  generatedLabel: string;
  columns: string[];
  rows: (string | number)[][];
  lang: Lang;
  salonName: string;
}

const num = (value: unknown): number => (typeof value === 'number' ? value : Number(value ?? 0));

const EXPORT_LABELS: Record<Lang, Record<string, string>> = {
  ar: {
    salon: 'ميرا',
    sales: 'تقرير المبيعات',
    salesCols: 'التاريخ,الإجمالي,عدد الفواتير',
    paymentMethods: 'تقرير طرق الدفع',
    paymentMethodsCols: 'طريقة الدفع,عدد الفواتير,الإجمالي',
    topServices: 'تقرير أفضل الخدمات',
    topServicesCols: 'الخدمة,الكمية,الإيراد',
    topClients: 'تقرير أفضل العملاء',
    topClientsCols: 'العميل,الإجمالي',
    employeePerformance: 'تقرير أداء الموظفات',
    employeePerformanceCols: 'الموظفة,عدد الفواتير,الإيراد,العمولة',
    employeeShiftSales: 'تقرير مبيعات الموظفات حسب فترة الدوام',
    employeeShiftSalesCols:
      'الموظفة,بداية الدوام,نهاية الدوام,الحالة,عدد الفواتير,المبيعات,النقدي,البطاقة,النقد المتوقع,النقد الفعلي,الفرق',
    expenses: 'تقرير المصروفات',
    expensesCols: 'الفئة,المبلغ',
    period: 'الفترة',
    from: 'من',
    to: 'إلى',
    branch: 'الفرع',
    employee: 'الموظفة',
    allEmployees: 'كل الموظفات',
    allBranches: 'كل الفروع',
    open: 'مفتوحة',
    closed: 'مغلقة',
    cash: 'نقدي',
    card: 'بطاقة',
    wallet: 'محفظة',
    electronic: 'دفع إلكتروني',
    generatedOn: 'تاريخ الإنشاء',
    page: 'صفحة',
  },
  en: {
    salon: 'Mira',
    sales: 'Sales Report',
    salesCols: 'Date,Total,Invoices',
    paymentMethods: 'Payment Methods Report',
    paymentMethodsCols: 'Method,Invoices,Total',
    topServices: 'Top Services Report',
    topServicesCols: 'Service,Quantity,Revenue',
    topClients: 'Top Clients Report',
    topClientsCols: 'Client,Total',
    employeePerformance: 'Employee Performance Report',
    employeePerformanceCols: 'Employee,Invoices,Revenue,Commission',
    employeeShiftSales: 'Employee Shift Sales Report',
    employeeShiftSalesCols:
      'Employee,Shift Start,Shift End,Status,Invoices,Sales,Cash,Card,Expected Cash,Actual Cash,Difference',
    expenses: 'Expenses Report',
    expensesCols: 'Category,Amount',
    period: 'Period',
    from: 'From',
    to: 'To',
    branch: 'Branch',
    employee: 'Employee',
    allEmployees: 'All Employees',
    allBranches: 'All Branches',
    open: 'Open',
    closed: 'Closed',
    cash: 'Cash',
    card: 'Card',
    wallet: 'Wallet',
    electronic: 'Electronic',
    generatedOn: 'Generated on',
    page: 'Page',
  },
};

const LBL = (lang: Lang, key: string): string => EXPORT_LABELS[lang][key] ?? key;

function fmtDate(d: Date, lang: Lang): string {
  return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function fmtNumber(value: number, lang: Lang): string {
  return Number(value).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
}

const FONT_DIR = (() => {
  const candidates = [process.cwd(), path.join(__dirname, '..', '..')];
  for (const base of candidates) {
    const dir = path.join(base, 'assets', 'fonts');
    if (fs.existsSync(path.join(dir, 'Tajawal-Regular.ttf'))) return dir;
  }
  return path.join(process.cwd(), 'assets', 'fonts');
})();

function resolveRange(from?: Date, to?: Date): { from: Date; to: Date } {
  const now = new Date();
  const start = from ?? new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const end = to ?? now;
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { from: start, to: end };
}

function isoWeekLabel(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function dateLabel(d: Date, groupBy: GroupBy): string {
  if (groupBy === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  if (groupBy === 'week') {
    return isoWeekLabel(d);
  }
  return d.toISOString().slice(0, 10);
}

async function salesReport({
  from,
  to,
  groupBy = 'day',
  branchId,
}: ReportRange & { groupBy?: GroupBy } = {}): Promise<GroupedReport[]> {
  const range = resolveRange(from, to);

  const invoices = await prisma.invoice.findMany({
    where: {
      date: { gte: range.from, lte: range.to },
      status: { not: 'CANCELLED' },
      branchId,
    },
    select: { id: true, date: true, total: true },
  });

  const groups = new Map<string, { total: number; count: number }>();
  for (const invoice of invoices) {
    const label = dateLabel(invoice.date, groupBy);
    const entry = groups.get(label) ?? { total: 0, count: 0 };
    entry.total += num(invoice.total);
    entry.count += 1;
    groups.set(label, entry);
  }

  return Array.from(groups.entries())
    .map(([label, entry]) => ({ label, total: entry.total, count: entry.count }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));
}

async function paymentMethods({ from, to, branchId }: ReportRange = {}) {
  const range = resolveRange(from, to);

  const invoices = await prisma.invoice.findMany({
    where: {
      date: { gte: range.from, lte: range.to },
      status: { not: 'CANCELLED' },
      branchId,
    },
    select: { paymentMethod: true, total: true },
  });

  const groups = new Map<string, { count: number; total: number }>();
  for (const invoice of invoices) {
    const entry = groups.get(invoice.paymentMethod) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += num(invoice.total);
    groups.set(invoice.paymentMethod, entry);
  }

  return Array.from(groups.entries())
    .map(([method, entry]) => ({ method, ...entry }))
    .sort((a, b) => b.total - a.total);
}

async function topServices({ from, to, branchId }: ReportRange = {}) {
  const range = resolveRange(from, to);

  const items = await prisma.invoiceItem.findMany({
    where: {
      serviceId: { not: null },
      invoice: {
        date: { gte: range.from, lte: range.to },
        status: { not: 'CANCELLED' },
        branchId,
      },
    },
    include: {
      service: { select: { id: true, nameAr: true, nameEn: true } },
    },
  });

  const groups = new Map<
    number,
    { nameAr: string; nameEn: string; quantity: number; revenue: number }
  >();

  for (const item of items) {
    if (!item.serviceId || !item.service) continue;
    const entry = groups.get(item.serviceId) ?? {
      nameAr: item.service.nameAr,
      nameEn: item.service.nameEn,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += item.quantity;
    entry.revenue += num(item.lineTotal);
    groups.set(item.serviceId, entry);
  }

  return Array.from(groups.entries())
    .map(([serviceId, entry]) => ({ serviceId, ...entry }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

async function topClients({ from, to, branchId }: ReportRange = {}) {
  const range = resolveRange(from, to);

  const invoices = await prisma.invoice.findMany({
    where: {
      date: { gte: range.from, lte: range.to },
      status: { not: 'CANCELLED' },
      branchId,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  const groups = new Map<number, { name: string; total: number }>();

  for (const invoice of invoices) {
    const entry = groups.get(invoice.clientId) ?? { name: invoice.client.name, total: 0 };
    entry.total += num(invoice.total);
    groups.set(invoice.clientId, entry);
  }

  return Array.from(groups.entries())
    .map(([clientId, entry]) => ({ clientId, ...entry }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

async function employeePerformance({ from, to, branchId, employeeId }: ReportRange = {}) {
  const range = resolveRange(from, to);

  const invoices = await prisma.invoice.findMany({
    where: {
      date: { gte: range.from, lte: range.to },
      status: { not: 'CANCELLED' },
      branchId,
      employeeId,
    },
    include: {
      employee: {
        select: { id: true, nameAr: true, nameEn: true, commissionRate: true },
      },
    },
  });

  const groups = new Map<
    number,
    {
      nameAr: string;
      nameEn: string;
      invoiceCount: number;
      subtotal: number;
      total: number;
      commission: number;
    }
  >();

  for (const invoice of invoices) {
    const rate = num(invoice.employee.commissionRate);
    const entry = groups.get(invoice.employeeId) ?? {
      nameAr: invoice.employee.nameAr,
      nameEn: invoice.employee.nameEn,
      invoiceCount: 0,
      subtotal: 0,
      total: 0,
      commission: 0,
    };
    entry.invoiceCount += 1;
    entry.subtotal += num(invoice.subtotal);
    entry.total += num(invoice.total);
    entry.commission += num(invoice.subtotal) * (rate / 100);
    groups.set(invoice.employeeId, entry);
  }

  return Array.from(groups.entries())
    .map(([employeeId, entry]) => ({ employeeId, ...entry }))
    .sort((a, b) => b.total - a.total);
}

async function employeeShiftSales({ from, to, branchId, employeeId }: ReportRange = {}) {
  const range = resolveRange(from, to);
  const round = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

  const sessions = await prisma.shiftSession.findMany({
    where: {
      startTime: { gte: range.from, lte: range.to },
      branchId,
      employeeId,
    },
    include: {
      employee: { select: { nameAr: true, nameEn: true, commissionRate: true } },
      branch: { select: { nameAr: true, nameEn: true } },
    },
    orderBy: [{ startTime: 'asc' }],
  });

  const employeeIds = [...new Set(sessions.map((s) => s.employeeId).filter((id): id is number => id != null))];

  const allInvoices = await prisma.invoice.findMany({
    where: {
      status: { not: 'CANCELLED' },
      branchId,
      OR: [
        { shiftSessionId: { in: sessions.map((s) => s.id) } },
        { shiftSessionId: null, employeeId: { in: employeeIds }, date: { gte: range.from, lte: range.to } },
      ],
    },
    select: { id: true, shiftSessionId: true, employeeId: true, date: true, total: true, paymentMethod: true },
  });

  const byShift = new Map<number, typeof allInvoices>();
  for (const inv of allInvoices) {
    if (inv.shiftSessionId != null) {
      const arr = byShift.get(inv.shiftSessionId);
      if (arr) arr.push(inv);
      else byShift.set(inv.shiftSessionId, [inv]);
    }
  }
  const nullShiftInvoices = allInvoices.filter((inv) => inv.shiftSessionId == null);

  const rows = [];

  for (const session of sessions) {
    const windowEnd = session.endTime ?? range.to;
    const shiftInvoices = byShift.get(session.id) ?? [];
    const matched = [
      ...shiftInvoices,
      ...nullShiftInvoices.filter(
        (inv) => inv.employeeId === session.employeeId && inv.date >= session.startTime && inv.date <= windowEnd,
      ),
    ];

    let invoiceCount = 0;
    let totalSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    for (const invoice of matched) {
      invoiceCount += 1;
      const total = num(invoice.total);
      totalSales += total;
      if (invoice.paymentMethod === 'CASH') {
        cashSales += total;
      } else {
        cardSales += total;
      }
    }

    rows.push({
      shiftSessionId: session.id,
      employeeId: session.employeeId,
      employeeNameAr: session.employee.nameAr,
      employeeNameEn: session.employee.nameEn,
      commissionRate: num(session.employee.commissionRate),
      branchId: session.branchId,
      branchNameAr: session.branch?.nameAr ?? null,
      branchNameEn: session.branch?.nameEn ?? null,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      openingBalance: num(session.openingBalance),
      expectedCash: num(session.expectedCash),
      actualCash: session.actualCash == null ? null : num(session.actualCash),
      difference: session.difference == null ? null : num(session.difference),
      notes: session.notes,
      invoiceCount,
      totalSales: round(totalSales),
      cashSales: round(cashSales),
      cardSales: round(cardSales),
    });
  }

  return rows;
}

async function expensesReport({ from, to }: ReportRange = {}) {
  const range = resolveRange(from, to);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: range.from, lte: range.to } },
    select: { category: true, amount: true },
  });

  const groups = new Map<string, number>();
  for (const expense of expenses) {
    groups.set(expense.category, (groups.get(expense.category) ?? 0) + num(expense.amount));
  }

  return Array.from(groups.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

async function profitLoss({ from, to, branchId }: ReportRange = {}) {
  const range = resolveRange(from, to);

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        date: { gte: range.from, lte: range.to },
        status: 'PAID',
        branchId,
      },
      include: {
        items: { include: { service: true, product: true } },
        employee: { select: { commissionRate: true } },
      },
    }),
    prisma.expense.findMany({
      where: { date: { gte: range.from, lte: range.to } },
      select: { category: true, amount: true },
    }),
  ]);

  let revenue = 0;
  let cogs = 0;
  let commissions = 0;

  for (const invoice of invoices) {
    revenue += num(invoice.total);
    commissions += num(invoice.subtotal) * (num(invoice.employee.commissionRate) / 100);
    for (const item of invoice.items) {
      if (item.serviceId && item.service) {
        cogs += num(item.service.cost) * item.quantity;
      } else if (item.productId && item.product) {
        cogs += num(item.product.costPrice) * item.quantity;
      }
    }
  }

  const grossProfit = revenue - cogs;

  let expenseTotal = 0;
  const categoryGroups = new Map<string, number>();
  for (const expense of expenses) {
    expenseTotal += num(expense.amount);
    categoryGroups.set(
      expense.category,
      (categoryGroups.get(expense.category) ?? 0) + num(expense.amount),
    );
  }
  const expensesByCategory = Array.from(categoryGroups.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const ordersCount = invoices.length;
  const r = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

  return {
    revenue: r(revenue),
    cogs: r(cogs),
    grossProfit: r(grossProfit),
    commissions: r(commissions),
    expenses: r(expenseTotal),
    expensesByCategory,
    // netProfit = grossProfit - expenses - commissions (commissions treated as operating cost)
    netProfit: r(grossProfit - expenseTotal - commissions),
    ordersCount,
    avgOrder: ordersCount > 0 ? r(revenue / ordersCount) : 0,
  };
}

async function summaryTotals({ from, to, branchId }: ReportRange = {}) {
  const range = resolveRange(from, to);

  const [revenueAgg, expensesAgg] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: range.from, lte: range.to },
        status: { not: 'CANCELLED' },
        branchId,
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: range.from, lte: range.to } },
    }),
  ]);

  const revenue = num(revenueAgg._sum.total);
  const expenses = num(expensesAgg._sum.amount);

  return { revenue, expenses, profit: revenue - expenses };
}

async function buildDataset(
  report: string,
  range: { from: Date; to: Date; branchId?: number; employeeId?: number },
  groupBy: GroupBy = 'day',
  lang: Lang = 'en',
): Promise<ExportDataset> {
  const l = EXPORT_LABELS[lang];

  const [employee, branch, nameArRow, nameEnRow] = await Promise.all([
    range.employeeId
      ? prisma.employee.findUnique({
          where: { id: range.employeeId },
          select: { nameAr: true, nameEn: true },
        })
      : null,
    range.branchId
      ? prisma.branch.findUnique({
          where: { id: range.branchId },
          select: { nameAr: true, nameEn: true },
        })
      : null,
    prisma.setting.findUnique({ where: { key: 'SALON_NAME_AR' } }),
    prisma.setting.findUnique({ where: { key: 'SALON_NAME_EN' } }),
  ]);

  const subtitleParts: string[] = [
    `${l.period}: ${fmtDate(range.from, lang)} ${l.to} ${fmtDate(range.to, lang)}`,
    `${l.branch}: ${branch ? `${branch.nameAr} / ${branch.nameEn}` : l.allBranches}`,
    `${l.employee}: ${employee ? `${employee.nameAr} / ${employee.nameEn}` : l.allEmployees}`,
  ];
  const subtitle = subtitleParts.join('  •  ');
  const salonName =
    lang === 'ar' ? nameArRow?.value?.trim() || l.salon : nameEnRow?.value?.trim() || l.salon;
  const base = { subtitle, generatedLabel: l.generatedOn, lang, salonName };

  switch (report) {
    case 'sales': {
      const data = await salesReport({ ...range, groupBy });
      return {
        ...base,
        title: l.sales,
        columns: l.salesCols.split(','),
        rows: data.map((row) => [row.label, row.total, row.count]),
      };
    }
    case 'paymentMethods': {
      const data = await paymentMethods(range);
      const methodMap: Record<string, string> = {
        CASH: l.cash,
        CARD: l.card,
        WALLET: l.wallet,
        ELECTRONIC: l.electronic,
      };
      return {
        ...base,
        title: l.paymentMethods,
        columns: l.paymentMethodsCols.split(','),
        rows: data.map((row) => [methodMap[row.method] ?? row.method, row.count, row.total]),
      };
    }
    case 'topServices': {
      const data = await topServices(range);
      return {
        ...base,
        title: l.topServices,
        columns: l.topServicesCols.split(','),
        rows: data.map((row) => [`${row.nameAr} / ${row.nameEn}`, row.quantity, row.revenue]),
      };
    }
    case 'topClients': {
      const data = await topClients(range);
      return {
        ...base,
        title: l.topClients,
        columns: l.topClientsCols.split(','),
        rows: data.map((row) => [row.name, row.total]),
      };
    }
    case 'employeePerformance': {
      const data = await employeePerformance(range);
      return {
        ...base,
        title: l.employeePerformance,
        columns: l.employeePerformanceCols.split(','),
        rows: data.map((row) => [
          `${row.nameAr} / ${row.nameEn}`,
          row.invoiceCount,
          row.total,
          row.commission,
        ]),
      };
    }
    case 'employeeShiftSales': {
      const data = await employeeShiftSales(range);
      return {
        ...base,
        title: l.employeeShiftSales,
        columns: l.employeeShiftSalesCols.split(','),
        rows: data.map((row) => [
          `${row.employeeNameAr} / ${row.employeeNameEn}`,
          fmtDate(row.startTime, lang),
          row.endTime ? fmtDate(row.endTime, lang) : '—',
          row.status === 'OPEN' ? l.open : l.closed,
          row.invoiceCount,
          row.totalSales,
          row.cashSales,
          row.cardSales,
          row.expectedCash,
          row.actualCash ?? '—',
          row.difference ?? '—',
        ]),
      };
    }
    case 'expenses': {
      const data = await expensesReport(range);
      return {
        ...base,
        title: l.expenses,
        columns: l.expensesCols.split(','),
        rows: data.map((row) => [row.category, row.amount]),
      };
    }
    default:
      throw new ApiError(400, `Unknown report type: ${report}`);
  }
}

async function buildExcel(dataset: ExportDataset): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = dataset.salonName;
  const sheet = workbook.addWorksheet(dataset.title, {
    views: [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: 4,
        topLeftCell: 'A5',
        rightToLeft: dataset.lang === 'ar',
      },
    ],
  });

  const colCount = dataset.columns.length;
  const mainAlign = dataset.lang === 'ar' ? 'right' : 'left';
  const align = (horizontal: 'left' | 'right' | 'center') => ({
    horizontal,
    vertical: 'middle' as const,
  });

  // Row 1 — title band
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${dataset.salonName} — ${dataset.title}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC2185B' } };
  titleCell.alignment = align('center');
  sheet.getRow(1).height = 32;

  // Row 2 — subtitle
  sheet.mergeCells(2, 1, 2, colCount);
  const subCell = sheet.getCell(2, 1);
  subCell.value = dataset.subtitle;
  subCell.font = { size: 11, color: { argb: 'FF666666' } };
  subCell.alignment = align('center');
  sheet.getRow(2).height = 20;

  // Row 3 — spacer
  sheet.getRow(3).height = 8;

  // Row 4 — header
  const headerRow = sheet.getRow(4);
  headerRow.height = 22;
  dataset.columns.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF880E4F' } };
    cell.alignment = align(dataset.lang === 'ar' ? 'right' : 'center');
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFC2185B' } },
      bottom: { style: 'thin', color: { argb: 'FFC2185B' } },
    };
  });

  // Data rows
  dataset.rows.forEach((row, rIdx) => {
    const excelRow = sheet.getRow(5 + rIdx);
    excelRow.height = 20;
    row.forEach((value, cIdx) => {
      const cell = excelRow.getCell(cIdx + 1);
      cell.value = value;
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFE0D5DB' } },
        left: { style: 'thin', color: { argb: 'FFE0D5DB' } },
        right: { style: 'thin', color: { argb: 'FFE0D5DB' } },
      };
      if (typeof value === 'number') {
        cell.numFmt = '#,##0.00';
        cell.alignment = align('right');
      } else {
        cell.alignment = align(mainAlign);
      }
      if (rIdx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6E7EE' } };
      }
    });
  });

  // Column widths (adaptive)
  for (let c = 1; c <= colCount; c++) {
    let len = dataset.columns[c - 1].length + 4;
    for (let r = 5; r < 5 + dataset.rows.length; r++) {
      const value = sheet.getRow(r).getCell(c).value;
      const strLen =
        typeof value === 'number'
          ? value.toLocaleString('en-US').length
          : String(value ?? '').length;
      len = Math.max(len, strLen + 4);
    }
    sheet.getColumn(c).width = Math.min(32, Math.max(14, len));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

function buildPdf(dataset: ExportDataset): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const arRegular = path.join(FONT_DIR, 'Tajawal-Regular.ttf');
    const arBold = path.join(FONT_DIR, 'Tajawal-Bold.ttf');
    let useArabicFont = fs.existsSync(arRegular) && fs.existsSync(arBold);
    if (useArabicFont) {
      try {
        doc.registerFont('ar', arRegular);
        doc.registerFont('ar-bold', arBold);
      } catch {
        useArabicFont = false;
      }
    }

    const isAr = dataset.lang === 'ar';
    const rtl = isAr ? { features: ['rtla'] } : {};
    const margin = 40;
    const pageWidth = doc.page.width - margin * 2;

    const setFont = (bold: boolean): void => {
      if (useArabicFont) doc.font(bold ? 'ar-bold' : 'ar');
      else doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
    };

    // Header band
    const bandH = 62;
    doc.save();
    doc.roundedRect(margin, margin, pageWidth, bandH, 8).fill('#c2185b');
    setFont(true);
    doc.fillColor('#ffffff').fontSize(20).text(dataset.salonName, margin + 16, margin + 8, {
      width: pageWidth - 32,
      align: 'center',
      ...rtl,
    });
    doc.fillColor('#ffffff').fontSize(12).text(dataset.title, margin + 16, margin + 34, {
      width: pageWidth - 32,
      align: 'center',
      ...rtl,
    });
    doc.restore();

    // Subtitle
    setFont(false);
    doc.fontSize(9);
    const subH = doc.heightOfString(dataset.subtitle, { width: pageWidth - 16, ...rtl });
    doc.fillColor('#777777').text(dataset.subtitle, margin + 8, margin + bandH + 10, {
      width: pageWidth - 16,
      align: 'center',
      ...rtl,
    });

    // Footer (page numbers + generation date)
    let pageNo = 0;
    const drawFooter = (): void => {
      setFont(false);
      doc.fillColor('#aaaaaa').fontSize(8);
      doc.text(
        `${dataset.generatedLabel}: ${fmtDate(new Date(), dataset.lang)}`,
        margin,
        doc.page.height - doc.page.margins.bottom - 12,
        { width: pageWidth / 2, align: 'left', ...rtl },
      );
      doc.text(
        `${LBL(dataset.lang, 'page')} ${pageNo}`,
        margin + pageWidth / 2,
        doc.page.height - doc.page.margins.bottom - 12,
        { width: pageWidth / 2, align: 'right', ...rtl },
      );
    };
    doc.on('pageAdded', () => {
      pageNo += 1;
      drawFooter();
    });

    // Table
    const colWidth = pageWidth / dataset.columns.length;
    const pad = 5;
    const minRowH = 20;
    const cellText = (cell: string | number): string =>
      typeof cell === 'number' ? fmtNumber(cell, dataset.lang) : String(cell);

    const measure = (cells: (string | number)[], bold: boolean): number => {
      setFont(bold);
      doc.fontSize(bold ? 9 : 8.5);
      let h = minRowH;
      cells.forEach((cell) => {
        const cellH = doc.heightOfString(cellText(cell), { width: colWidth - pad * 2, ...rtl });
        h = Math.max(h, cellH + 7);
      });
      return h;
    };

    const drawRow = (
      cells: (string | number)[],
      bold: boolean,
      rowY: number,
      rowH: number,
      bg: string | null,
    ): void => {
      if (bg) doc.rect(margin, rowY, pageWidth, rowH).fill(bg);
      setFont(bold);
      doc.fontSize(bold ? 9 : 8.5);
      doc.fillColor(bold ? '#ffffff' : '#222222');
      cells.forEach((cell, c) => {
        const x = isAr ? margin + pageWidth - (c + 1) * colWidth : margin + c * colWidth;
        const text = cellText(cell);
        const cellH = doc.heightOfString(text, { width: colWidth - pad * 2, ...rtl });
        doc.text(text, x + pad, rowY + (rowH - cellH) / 2, {
          width: colWidth - pad * 2,
          ...rtl,
        });
      });
    };

    const headerH = measure(dataset.columns, true);
    const drawHeader = (): void => {
      drawRow(dataset.columns, true, y, headerH, '#880e4f');
      y += headerH;
    };

    let y = margin + bandH + 12 + subH + 10;
    drawHeader();

    dataset.rows.forEach((row, idx) => {
      const rh = measure(row, false);
      if (y + rh > doc.page.height - doc.page.margins.bottom - 18) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }
      drawRow(row, false, y, rh, idx % 2 === 1 ? '#f6e7ee' : null);
      y += rh;
    });

    drawFooter();
    doc.end();
  });
}

async function exportData(params: {
  report: string;
  from?: Date;
  to?: Date;
  groupBy?: GroupBy;
  format?: 'excel' | 'pdf';
  branchId?: number;
  employeeId?: number;
  lang?: Lang;
}): Promise<{ buffer: Buffer; mime: string; extension: string }> {
  const lang: Lang = params.lang === 'ar' ? 'ar' : 'en';
  const range = resolveRange(params.from, params.to);
  const dataset = await buildDataset(
    params.report,
    { ...range, branchId: params.branchId, employeeId: params.employeeId },
    params.groupBy ?? 'day',
    lang,
  );

  if (params.format === 'pdf') {
    const buffer = await buildPdf(dataset);
    return { buffer, mime: 'application/pdf', extension: 'pdf' };
  }

  const buffer = await buildExcel(dataset);
  return {
    buffer,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
  };
}

async function dashboardAnalytics(branchId?: number) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const last7Start = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [last7Invoices, todayRevenueAgg, todayExpensesAgg, todayInvoices, lowStock, activeMemberships, clientsCount, topServicesData, todayAppointments, upcoming] =
    await Promise.all([
      prisma.invoice.findMany({
        where: { date: { gte: last7Start, lte: todayEnd }, status: { not: 'CANCELLED' }, branchId },
        select: { date: true, total: true },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { date: { gte: todayStart, lte: todayEnd }, status: 'PAID', branchId },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.invoice.count({ where: { date: { gte: todayStart, lte: todayEnd }, branchId } }),
      prisma.product.findMany({
        where: { quantity: { lte: prisma.product.fields.minStock } },
        orderBy: { quantity: 'asc' },
        take: 10,
      }),
      prisma.clientMembership.count({ where: { status: 'ACTIVE' } }),
      prisma.client.count(),
      topServices({ from: last7Start, to: todayEnd, branchId }),
      prisma.appointment.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: { in: ['BOOKED', 'ARRIVED'] } },
      }),
      prisma.appointment.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, status: { in: ['BOOKED', 'ARRIVED'] } },
        orderBy: [{ startTime: 'asc' }],
        take: 5,
        include: {
          client: { select: { name: true } },
          employee: { select: { nameAr: true, nameEn: true } },
          service: { select: { nameAr: true, nameEn: true } },
        },
      }),
    ]);

  const byDay = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const invoice of last7Invoices) {
    const key = invoice.date.toISOString().slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, byDay.get(key)! + num(invoice.total));
    }
  }
  const revenueByDay = Array.from(byDay.entries()).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));

  return {
    revenueByDay,
    topServices: topServicesData.slice(0, 5),
    lowStock,
    todayAppointments: todayInvoices,
    upcomingAppointments: upcoming,
    todayRevenue: num(todayRevenueAgg._sum.total),
    todayExpenses: num(todayExpensesAgg._sum.amount),
    activeMemberships,
    clientsCount,
  };
}

export const reportsService = {
  salesReport,
  paymentMethods,
  topServices,
  topClients,
  employeePerformance,
  employeeShiftSales,
  expensesReport,
  profitLoss,
  summaryTotals,
  dashboardAnalytics,
  exportData,
};
