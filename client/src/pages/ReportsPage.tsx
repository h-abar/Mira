import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Dayjs } from 'dayjs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  salesReport,
  paymentMethods,
  topServices,
  topClients,
  employeePerformance,
  employeeShiftSales,
  expensesReport,
  summaryTotals,
  exportReport,
  type ReportRangeParams,
  type ReportType,
  type GroupedPoint,
  type PaymentMethodRow,
  type TopServiceRow,
  type TopClientRow,
  type EmployeePerformanceRow,
  type EmployeeShiftSalesRow,
  type ExpenseRow,
  type SummaryTotals,
  getProfitLoss,
  type ProfitLossResult,
} from '../api/reports';
import { useBranchStore } from '../stores/branchStore';
import { listEmployees, type Employee } from '../api/employees';
import { getSettings } from '../api/settings';
import { ZATCA_SELLER_NAME, ZATCA_VAT_NUMBER } from '../utils/zatcaQR';
import { buildInvoiceQrPayload, generateQrImageDataUrl } from '../utils/invoiceQr';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'التقارير',
    from: 'من',
    to: 'إلى',
    apply: 'تطبيق',
    salesSummary: 'ملخص المبيعات',
    revenue: 'الإيرادات',
    expenses: 'المصروفات',
    profit: 'الأرباح',
    salesByDay: 'المبيعات حسب اليوم',
    topServices: 'أفضل الخدمات',
    topClients: 'أفضل العملاء',
    employeePerformance: 'أداء الموظفات',
    employeeShiftSales: 'مبيعات الموظفات حسب فترة الدوام',
    paymentMethods: 'طرق الدفع',
    expensesByCategory: 'المصروفات حسب الفئة',
    rank: 'الترتيب',
    service: 'الخدمة',
    quantity: 'الكمية',
    revenueShort: 'الإيراد',
    client: 'العميل',
    total: 'الإجمالي',
    employee: 'الموظفة',
    allEmployees: 'كل الموظفات',
    invoices: 'الفواتير',
    commission: 'العمولة',
    category: 'الفئة',
    amount: 'المبلغ',
    exportExcel: 'تصدير Excel',
    exportPdf: 'تصدير PDF',
    print: 'طباعة',
    printingTitle: 'تقرير شامل — ',
    period: 'الفترة',
    shiftStatus: 'الحالة',
    shiftPeriod: 'فترة الدوام',
    branchShort: 'الفرع',
    cash: 'نقدي',
    card: 'بطاقة',
    expectedCash: 'النقد المتوقع',
    actualCash: 'النقد الفعلي',
    difference: 'الفرق',
    openShift: 'مفتوحة',
    closedShift: 'مغلقة',
    ordersCount: 'عدد الفواتير',
    avgOrder: 'متوسط الفاتورة',
    error: 'حدث خطأ',
    noData: 'لا توجد بيانات',
  },
  en: {
    title: 'Reports',
    from: 'From',
    to: 'To',
    apply: 'Apply',
    salesSummary: 'Sales Summary',
    revenue: 'Revenue',
    expenses: 'Expenses',
    profit: 'Profit',
    salesByDay: 'Sales by Day',
    topServices: 'Top Services',
    topClients: 'Top Clients',
    employeePerformance: 'Employee Performance',
    employeeShiftSales: 'Employee Sales by Shift',
    paymentMethods: 'Payment Methods',
    expensesByCategory: 'Expenses by Category',
    rank: 'Rank',
    service: 'Service',
    quantity: 'Quantity',
    revenueShort: 'Revenue',
    client: 'Client',
    total: 'Total',
    employee: 'Employee',
    allEmployees: 'All Employees',
    invoices: 'Invoices',
    commission: 'Commission',
    category: 'Category',
    amount: 'Amount',
    exportExcel: 'Export Excel',
    exportPdf: 'Export PDF',
    print: 'Print',
    printingTitle: 'Comprehensive Report — ',
    period: 'Period',
    shiftStatus: 'Status',
    shiftPeriod: 'Shift Period',
    branchShort: 'Branch',
    cash: 'Cash',
    card: 'Card',
    expectedCash: 'Expected Cash',
    actualCash: 'Actual Cash',
    difference: 'Difference',
    openShift: 'Open',
    closedShift: 'Closed',
    ordersCount: 'Orders',
    avgOrder: 'Avg Invoice',
    error: 'Something went wrong',
    noData: 'No data',
  },
} as const;

const CHART_COLORS = ['#c2185b', '#f48fb1', '#7b1fa2', '#f9a825', '#2e7d32', '#1565c0', '#d84315'];

const money = (value: number) => {
  if (typeof value !== 'number' || isNaN(value)) return '0.00';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function SimpleTable({
  headers,
  rows,
  emptyText,
}: {
  headers: string[];
  rows: (string | number)[][];
  emptyText: string;
}) {
  return (
    <TableContainer>
      <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2, py: 1.25, whiteSpace: 'nowrap' } }}>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header} sx={{ fontWeight: 700 }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} align="center">
                <Typography color="text.secondary">{emptyText}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <TableCell key={cellIdx}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ExportButtons({
  report,
  params,
}: {
  report: ReportType;
  params: ReportRangeParams;
}) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];

  const handleExport = (format: 'excel' | 'pdf') => {
    void exportReport(report, { ...params, format, lang });
  };

  return (
    <Stack direction="row" spacing={1}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<TableChartIcon />}
        onClick={() => handleExport('excel')}
      >
        {l.exportExcel}
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<PictureAsPdfIcon />}
        onClick={() => handleExport('pdf')}
      >
        {l.exportPdf}
      </Button>
    </Stack>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, borderLeft: `6px solid ${color}` }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}22`,
            color,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {label}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function ReportsPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];

  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [applied, setApplied] = useState<ReportRangeParams>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryTotals | null>(null);
  const [sales, setSales] = useState<GroupedPoint[]>([]);
  const [payments, setPayments] = useState<PaymentMethodRow[]>([]);
  const [services, setServices] = useState<TopServiceRow[]>([]);
  const [clients, setClients] = useState<TopClientRow[]>([]);
  const [employees, setEmployees] = useState<EmployeePerformanceRow[]>([]);
  const [shifts, setShifts] = useState<EmployeeShiftSalesRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [pnl, setPnl] = useState<ProfitLossResult | null>(null);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const [salonName, setSalonName] = useState(t('general.appName') || ZATCA_SELLER_NAME);
  const [vatNumber, setVatNumber] = useState(ZATCA_VAT_NUMBER);
  const [vatRate, setVatRate] = useState(15);
  const [qrMode, setQrMode] = useState<'square' | 'text'>('square');

  useEffect(() => {
    let active = true;
    getSettings()
      .then((res) => {
        const map: Record<string, string> = {};
        for (const it of res.items) map[it.key] = it.value;
        const name = (lang === 'ar' ? map['SALON_NAME_AR'] : map['SALON_NAME_EN'])?.trim();
        if (active && name) setSalonName(name);
        const vat = map['ZATCA_VAT_NUMBER']?.trim();
        if (active && vat) setVatNumber(vat);
        const rate = Number(map['VAT_RATE']);
        if (active && rate > 0) setVatRate(rate);
        const mode = map['QR_DISPLAY_MODE'] as 'square' | 'text' | undefined;
        if (active && (mode === 'square' || mode === 'text')) setQrMode(mode);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listEmployees()
      .then((data) => setEmployeeOptions(data))
      .catch(() => setEmployeeOptions([]));
  }, []);

  const handleApply = () => {
    const params: ReportRangeParams = {};
    if (from) params.from = from.format('YYYY-MM-DD');
    if (to) params.to = to.format('YYYY-MM-DD');
    if (selectedBranchId) params.branchId = selectedBranchId;
    if (employeeId) params.employeeId = Number(employeeId);
    setApplied({ ...params });
  };

  const handleEmployeeChange = (event: SelectChangeEvent) => {
    setEmployeeId(event.target.value);
  };

  const methodLabel = (method: string): string => {
    const map: Record<string, string> = {
      CASH: lang === 'ar' ? 'نقدي' : 'Cash',
      CARD: lang === 'ar' ? 'بطاقة' : 'Card',
      WALLET: lang === 'ar' ? 'محفظة' : 'Wallet',
      ELECTRONIC: lang === 'ar' ? 'دفع إلكتروني' : 'Electronic',
    };
    return map[method] ?? method;
  };

  const handlePrint = async () => {
    const win = window.open('', '_blank', 'width=960,height=720');
    if (!win) return;

    const fmt = (value: number) => {
      if (typeof value !== 'number' || isNaN(value)) return '0.00';
      return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const tableHtml = (
      title: string,
      headers: string[],
      rows: (string | number)[][],
      empty: string,
    ): string => {
      const head = `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`;
      const body =
        rows.length === 0
          ? `<tr><td colspan="${headers.length}" style="text-align:center;color:#888">${empty}</td></tr>`
          : rows
              .map(
                (row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`,
              )
              .join('');
      return `<h3>${title}</h3><table><thead>${head}</thead><tbody>${body}</tbody></table>`;
    };

    const selectedEmployee = employeeOptions.find((e) => e.id === Number(employeeId));
    const rangeLabel =
      applied.from || applied.to
        ? `${l.period}: ${applied.from ?? '—'} ${lang === 'ar' ? 'إلى' : 'to'} ${applied.to ?? '—'}`
        : '';

    const shiftRows = shifts.map((row) => {
      const start = new Date(row.startTime).toLocaleString('en-GB', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const end = row.endTime
        ? new Date(row.endTime).toLocaleString('en-GB', {
            dateStyle: 'short',
            timeStyle: 'short',
          })
        : '—';
      return [
        `${row.employeeNameAr} / ${row.employeeNameEn}`,
        `${start} ← ${end}`,
        row.status === 'OPEN' ? l.openShift : l.closedShift,
        row.branchNameAr ? `${row.branchNameAr} / ${row.branchNameEn}` : '—',
        row.invoiceCount,
        fmt(row.totalSales),
        fmt(row.cashSales),
        fmt(row.cardSales),
        fmt(row.expectedCash),
        row.actualCash == null ? '—' : fmt(row.actualCash),
        row.difference == null ? '—' : fmt(row.difference),
      ];
    });

    const reportTotal = summary?.revenue ?? 0;
    const reportVat = (reportTotal * vatRate) / 100;
    const qrPayload = buildInvoiceQrPayload({
      sellerName: salonName || t('general.appName') || ZATCA_SELLER_NAME,
      vatNumber: vatNumber || ZATCA_VAT_NUMBER,
      timestamp: new Date().toISOString(),
      invoiceTotal: Number(reportTotal.toFixed(2)),
      vatAmount: Number(reportVat.toFixed(2)),
    });
    const qrImgUrl = qrMode === 'square' ? await generateQrImageDataUrl(qrPayload).catch(() => '') : '';
    const qrHtml =
      qrMode === 'square'
        ? `<img src="${qrImgUrl}" alt="QR" style="width:140px;height:140px;display:block;margin:12px auto" />`
        : `<div class="qr-block">${qrPayload}</div>`;
    const vatLabel = vatNumber || ZATCA_VAT_NUMBER;

    const curr = lang === 'ar' ? 'ر.س' : 'SAR';

    const content = `
  <div class="header">
    <div class="salon">${salonName || t('general.appName')}</div>
    <div class="subtitle">${l.printingTitle}${l.title}</div>
    ${rangeLabel ? `<div class="subtitle">${rangeLabel}</div>` : ''}
    ${selectedEmployee ? `<div class="subtitle">${l.employee}: ${selectedEmployee.nameAr} / ${selectedEmployee.nameEn}</div>` : ''}
    <div class="subtitle">${lang === 'ar' ? 'الرقم الضريبي' : 'VAT No.'}: ${vatLabel}</div>
  </div>
  ${
    summary
      ? `<table class="kpi"><tr><th>${l.revenue} (${curr})</th><th>${l.expenses} (${curr})</th><th>${l.profit} (${curr})</th></tr><tr><td>${fmt(summary.revenue)}</td><td>${fmt(summary.expenses)}</td><td>${fmt(summary.profit)}</td></tr></table>`
      : ''
  }
  ${tableHtml(
    l.salesByDay,
    [lang === 'ar' ? 'التاريخ' : 'Date', `${l.revenueShort} (${curr})`, l.invoices],
    sales.map((point) => [point.label, fmt(point.total), point.count]),
    l.noData,
  )}
  ${tableHtml(
    l.paymentMethods,
    [lang === 'ar' ? 'الطريقة' : 'Method', l.invoices, `${l.total} (${curr})`],
    payments.map((row) => [methodLabel(row.method), row.count, fmt(row.total)]),
    l.noData,
  )}
  ${tableHtml(
    l.topServices,
    [l.rank, l.service, l.quantity, `${l.revenueShort} (${curr})`],
    services.map((row, idx) => [idx + 1, `${row.nameAr} / ${row.nameEn}`, row.quantity, fmt(row.revenue)]),
    l.noData,
  )}
  ${tableHtml(
    l.topClients,
    [l.rank, l.client, `${l.total} (${curr})`],
    clients.map((row, idx) => [idx + 1, row.name, fmt(row.total)]),
    l.noData,
  )}
  ${tableHtml(
    l.employeePerformance,
    [l.employee, l.invoices, `${l.revenueShort} (${curr})`, `${l.commission} (${curr})`],
    employees.map((row) => [`${row.nameAr} / ${row.nameEn}`, row.invoiceCount, fmt(row.total), fmt(row.commission)]),
    l.noData,
  )}
  ${tableHtml(
    l.employeeShiftSales,
    [
      l.employee,
      l.shiftPeriod,
      l.shiftStatus,
      l.branchShort,
      l.invoices,
      `${l.revenueShort} (${curr})`,
      `${l.cash} (${curr})`,
      `${l.card} (${curr})`,
      `${l.expectedCash} (${curr})`,
      `${l.actualCash} (${curr})`,
      `${l.difference} (${curr})`,
    ],
    shiftRows,
    l.noData,
  )}
  ${tableHtml(
    l.expensesByCategory,
    [l.category, `${l.amount} (${curr})`],
    expenses.map((row) => [row.category, fmt(row.amount)]),
    l.noData,
  )}
  <div class="qr-footer">
    ${qrHtml}
    <div class="qr-meta">${lang === 'ar' ? 'رمز QR متوافق مع ZATCA' : 'ZATCA-compliant QR'}</div>
  </div>
`;

    win.document.write(`<!doctype html>
<html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8" /><title>${t('general.appName')} — ${l.title}</title>
<style>
  body { font-family: 'Cairo','Segoe UI',Arial,sans-serif; margin: 24px; color: #222; font-size: 12px; }
  .header { text-align: center; margin-bottom: 16px; }
  .salon { font-size: 22px; font-weight: 800; color: #c2185b; }
  .subtitle { color: #666; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.kpi { width: auto; margin: 0 auto 8px; }
  th, td { border: 1px solid #bbb; padding: 5px 8px; }
  th { background: #c2185b; color: #fff; font-weight: 700; }
  td { text-align: ${lang === 'ar' ? 'right' : 'left'}; }
  h3 { margin: 18px 0 4px; color: #c2185b; }
  .qr-footer { margin-top: 20px; padding-top: 10px; border-top: 2px solid #c2185b; text-align: center; }
  .qr-meta { margin-top: 6px; color: #666; font-size: 11px; }
  .qr-block { margin-top: 8px; padding: 8px; background: #f7f7f7; border: 1px dashed #ccc; font-family: 'Courier New', monospace; font-size: 9px; word-break: break-all; text-align: left; }
  .no-print { margin-top: 16px; text-align: center; }
  @media print { .no-print { display: none; } }
</style></head>
<body>
  ${content}
  <div class="no-print"><button onclick="window.print()" style="padding:8px 24px;font-size:14px">${l.print}</button></div>
</body></html>`);
    win.document.close();
    win.focus();
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          salesRes,
          paymentsRes,
          servicesRes,
          clientsRes,
          employeesRes,
          shiftsRes,
          expensesRes,
          summaryRes,
          pnlRes,
        ] = await Promise.all([
          salesReport(applied),
          paymentMethods(applied),
          topServices(applied),
          topClients(applied),
          employeePerformance(applied),
          employeeShiftSales(applied),
          expensesReport({ from: applied.from, to: applied.to }),
          summaryTotals(applied),
          getProfitLoss(applied),
        ]);
        if (!active) return;
        setSales(salesRes.data);
        setPayments(paymentsRes.data);
        setServices(servicesRes.data);
        setClients(clientsRes.data);
        setEmployees(employeesRes.data);
        setShifts(shiftsRes.data);
        setExpenses(expensesRes.data);
        setSummary(summaryRes.data);
        setPnl(pnlRes.data);
      } catch (err) {
        if (active) setError((err as { message?: string }).message ?? l.error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const serviceChartData = services.slice(0, 8).map((row) => ({
    name: lang === 'ar' ? row.nameAr : row.nameEn,
    revenue: Number(row.revenue),
  }));
  const employeeChartData = employees.map((row) => ({
    name: lang === 'ar' ? row.nameAr : row.nameEn,
    total: Number(row.total),
  }));

  return (
    <Box>
      <PageHeader title={l.title} />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ mb: 3, flexWrap: 'wrap' }}
        >
          <DatePicker
            label={l.from}
            value={from}
            onChange={(value) => setFrom(value)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label={l.to}
            value={to}
            onChange={(value) => setTo(value)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel id="report-employee-label">{l.employee}</InputLabel>
            <Select
              labelId="report-employee-label"
              value={employeeId}
              label={l.employee}
              onChange={handleEmployeeChange}
            >
              <MenuItem value="">
                <em>{l.allEmployees}</em>
              </MenuItem>
              {employeeOptions.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.nameAr} / {emp.nameEn}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleApply}>
            {l.apply}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            {l.print}
          </Button>
        </Stack>
      </LocalizationProvider>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Stack spacing={4}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KpiCard
              icon={<AttachMoneyIcon />}
              label={l.revenue}
              value={summary ? money(summary.revenue) : '—'}
              color="#c2185b"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KpiCard
              icon={<MoneyOffIcon />}
              label={l.expenses}
              value={summary ? money(summary.expenses) : '—'}
              color="#d32f2f"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KpiCard
              icon={<TrendingUpIcon />}
              label={l.profit}
              value={summary ? money(summary.profit) : '—'}
              color="#2e7d32"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KpiCard
              icon={<ReceiptLongIcon />}
              label={l.ordersCount}
              value={pnl ? String(pnl.ordersCount) : '—'}
              color="#1565c0"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KpiCard
              icon={<ShoppingCartCheckoutIcon />}
              label={l.avgOrder}
              value={pnl ? money(pnl.avgOrder) : '—'}
              color="#f9a825"
            />
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}
              >
                <Typography variant="h6">{l.salesByDay}</Typography>
                <ExportButtons report="sales" params={applied} />
              </Stack>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={sales} margin={{ top: 12, right: 18, left: 8, bottom: 6 }}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c2185b" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#c2185b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name={l.revenueShort}
                    stroke="#c2185b"
                    strokeWidth={2.5}
                    fill="url(#gradRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 3 }}>
                <SimpleTable
                  headers={[lang === 'ar' ? 'التاريخ' : 'Date', l.invoices, l.revenueShort]}
                  rows={sales.map((point) => [point.label, point.count, money(point.total)])}
                  emptyText={l.noData}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}
              >
                <Typography variant="h6">{l.paymentMethods}</Typography>
                <ExportButtons report="paymentMethods" params={applied} />
              </Stack>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <Pie
                    data={payments}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {payments.map((row, idx) => (
                      <Cell key={row.method} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [money(Number(value)), methodLabel(String(name))]} contentStyle={{ borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <SimpleTable
                  headers={[lang === 'ar' ? 'الطريقة' : 'Method', l.invoices, l.total]}
                  rows={payments.map((row) => [methodLabel(row.method), row.count, money(row.total)])}
                  emptyText={l.noData}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}
              >
                <Typography variant="h6">{l.topServices}</Typography>
                <ExportButtons report="topServices" params={applied} />
              </Stack>
              {serviceChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={serviceChartData}
                    layout="vertical"
                    margin={{ top: 12, right: 24, left: 16, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10 }} />
                    <Bar dataKey="revenue" name={l.revenueShort} fill="#c2185b" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <Box sx={{ mt: 2 }}>
                <SimpleTable
                  headers={[l.rank, l.service, l.quantity, l.revenueShort]}
                  rows={services.map((row, idx) => [
                    idx + 1,
                    `${row.nameAr} / ${row.nameEn}`,
                    row.quantity,
                    money(row.revenue),
                  ])}
                  emptyText={l.noData}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}
              >
                <Typography variant="h6">{l.topClients}</Typography>
                <ExportButtons report="topClients" params={applied} />
              </Stack>
              <SimpleTable
                headers={[l.rank, l.client, l.total]}
                rows={clients.map((row, idx) => [idx + 1, row.name, money(row.total)])}
                emptyText={l.noData}
              />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}
              >
                <Typography variant="h6">{l.employeePerformance}</Typography>
                <ExportButtons report="employeePerformance" params={applied} />
              </Stack>
              {employeeChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={employeeChartData}
                    layout="vertical"
                    margin={{ top: 12, right: 24, left: 16, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10 }} />
                    <Bar dataKey="total" name={l.revenueShort} fill="#7b1fa2" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <Box sx={{ mt: 2 }}>
                <SimpleTable
                  headers={[l.employee, l.invoices, l.revenueShort, l.commission]}
                  rows={employees.map((row) => [
                    `${row.nameAr} / ${row.nameEn}`,
                    row.invoiceCount,
                    money(row.total),
                    money(row.commission),
                  ])}
                  emptyText={l.noData}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}
              >
                <Typography variant="h6">{l.expensesByCategory}</Typography>
                <ExportButtons report="expenses" params={applied} />
              </Stack>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <Pie
                    data={expenses}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {expenses.map((row, idx) => (
                      <Cell key={row.category} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <SimpleTable
                  headers={[l.category, l.amount]}
                  rows={expenses.map((row) => [row.category, money(row.amount)])}
                  emptyText={l.noData}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}
          >
            <Typography variant="h6">{l.employeeShiftSales}</Typography>
            <ExportButtons report="employeeShiftSales" params={applied} />
          </Stack>
          <SimpleTable
            headers={[
              l.employee,
              l.shiftPeriod,
              l.shiftStatus,
              l.branchShort,
              l.invoices,
              l.revenueShort,
              l.cash,
              l.card,
              l.expectedCash,
              l.actualCash,
              l.difference,
            ]}
            rows={shifts.map((row) => {
              const start = new Date(row.startTime).toLocaleString('en-GB', {
                dateStyle: 'short',
                timeStyle: 'short',
              });
              const end = row.endTime
                ? new Date(row.endTime).toLocaleString('en-GB', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })
                : '—';
              return [
                `${row.employeeNameAr} / ${row.employeeNameEn}`,
                `${start} ← ${end}`,
                row.status === 'OPEN' ? l.openShift : l.closedShift,
                row.branchNameAr ? `${row.branchNameAr} / ${row.branchNameEn}` : '—',
                row.invoiceCount,
                money(row.totalSales),
                money(row.cashSales),
                money(row.cardSales),
                money(row.expectedCash),
                row.actualCash == null ? '—' : money(row.actualCash),
                row.difference == null ? '—' : money(row.difference),
              ];
            })}
            emptyText={l.noData}
          />
        </Paper>
      </Stack>
    </Box>
  );
}