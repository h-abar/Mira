import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExportButtons from '../components/ExportButtons';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { api, type ApiError } from '../api/client';
import {
  createExpense,
  createInvoiceFromAppointment,
  createInvoiceManual,
  deleteExpense,
  getSummary,
  listExpenses,
  listInvoices,
  updateExpense,
  type Expense,
  type ExpenseInput,
  type Invoice,
  type InvoiceItemInput,
  type ManualInvoiceInput,
  type PaymentMethod,
  type Summary,
} from '../api/accounting';
import { listEmployees, type Employee } from '../api/employees';
import { validateOfferCode } from '../api/offers';
import { createPayment } from '../api/payments';
import { getSettings } from '../api/settings';
import { useAuthStore } from '../stores/authStore';
import { useBranchStore } from '../stores/branchStore';
import { buildZatcaQrTLV, ZATCA_SELLER_NAME, ZATCA_VAT_NUMBER } from '../utils/zatcaQR';
import { buildInvoiceQrPayload, generateQrImageDataUrl, type QrDisplayMode } from '../utils/invoiceQr';
import { barcodeSvgDataUrl } from '../utils/barcode';
import PageHeader from '../components/PageHeader';

interface Labels {
  title: string;
  invoices: string;
  expenses: string;
  summary: string;
  invoiceFromAppointment: string;
  manualInvoice: string;
  invoiceNo: string;
  date: string;
  client: string;
  employee: string;
  total: string;
  paymentMethod: string;
  status: string;
  discount: string;
  tax: string;
  appointment: string;
  addService: string;
  addProduct: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  description: string;
  actions: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  deleteConfirm: string;
  category: string;
  amount: string;
  expenseDescription: string;
  addExpense: string;
  editExpense: string;
  revenue: string;
  profit: string;
  commissions: string;
  invoicesCount: string;
  doneAppointments: string;
  show: string;
  invoiceDetail: string;
  noItems: string;
  fillRequired: string;
  successInvoice: string;
  successCreated: string;
  successUpdated: string;
  successDeleted: string;
  selectAppointment: string;
  selectClient: string;
  selectEmployee: string;
  selectPaymentMethod: string;
  couponCode: string;
  redeemPoints: string;
  validate: string;
  offerApplied: string;
  tip: string;
  giftCardCode: string;
  print: string;
  qrCode: string;
  qrVatNumber: string;
  qrCopy: string;
  qrCopied: string;
  electronicPay: string;
  electronicPaySimulated: string;
}

const enLabels: Labels = {
  title: 'Accounting',
  invoices: 'Invoices',
  expenses: 'Expenses',
  summary: 'Summary',
  invoiceFromAppointment: 'Invoice from Appointment',
  manualInvoice: 'Manual Invoice',
  invoiceNo: 'Invoice No.',
  date: 'Date',
  client: 'Client',
  employee: 'Employee',
  total: 'Total',
  paymentMethod: 'Payment',
  status: 'Status',
  discount: 'Discount',
  tax: 'Tax',
  appointment: 'Appointment',
  addService: 'Add service',
  addProduct: 'Add product',
  quantity: 'Qty',
  unitPrice: 'Unit Price',
  lineTotal: 'Line Total',
  description: 'Description',
  actions: 'Actions',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  deleteConfirm: 'Delete this record?',
  category: 'Category',
  amount: 'Amount',
  expenseDescription: 'Description',
  addExpense: 'Add Expense',
  editExpense: 'Edit Expense',
  revenue: 'Revenue',
  profit: 'Profit',
  commissions: 'Commissions',
  invoicesCount: 'Invoices',
  doneAppointments: 'Done Appointments',
  show: 'Show',
  invoiceDetail: 'Invoice Detail',
  noItems: 'No items',
  fillRequired: 'Please fill all required fields',
  successInvoice: 'Invoice created successfully',
  successCreated: 'Expense created successfully',
  successUpdated: 'Expense updated successfully',
  successDeleted: 'Expense deleted successfully',
  selectAppointment: 'Select appointment',
  selectClient: 'Select client',
  selectEmployee: 'Select employee',
  selectPaymentMethod: 'Payment method',
  couponCode: 'Coupon code',
  redeemPoints: 'Redeem points',
  validate: 'Validate',
  offerApplied: 'Discount applied',
  tip: 'Tip',
  giftCardCode: 'Gift card code',
  print: 'Print',
  qrCode: 'ZATCA QR Code',
  qrVatNumber: 'Seller VAT No.',
  qrCopy: 'Copy QR',
  qrCopied: 'QR code copied to clipboard',
  electronicPay: 'Electronic',
  electronicPaySimulated: 'Electronic payment simulated',
};

const arLabels: Labels = {
  title: 'المحاسبة',
  invoices: 'الفواتير',
  expenses: 'المصروفات',
  summary: 'الملخص',
  invoiceFromAppointment: 'فاتورة من موعد',
  manualInvoice: 'فاتورة يدوية',
  invoiceNo: 'رقم الفاتورة',
  date: 'التاريخ',
  client: 'العميلة',
  employee: 'الموظفة',
  total: 'الإجمالي',
  paymentMethod: 'الدفع',
  status: 'الحالة',
  discount: 'الخصم',
  tax: 'الضريبة',
  appointment: 'الموعد',
  addService: 'إضافة خدمة',
  addProduct: 'إضافة منتج',
  quantity: 'الكمية',
  unitPrice: 'سعر الوحدة',
  lineTotal: 'إجمالي السطر',
  description: 'الوصف',
  actions: 'إجراءات',
  save: 'حفظ',
  cancel: 'إلغاء',
  delete: 'حذف',
  edit: 'تعديل',
  deleteConfirm: 'حذف هذا السجل؟',
  category: 'التصنيف',
  amount: 'المبلغ',
  expenseDescription: 'الوصف',
  addExpense: 'إضافة مصروف',
  editExpense: 'تعديل مصروف',
  revenue: 'الإيرادات',
  profit: 'الربح',
  commissions: 'العمولات',
  invoicesCount: 'عدد الفواتير',
  doneAppointments: 'المواعيد المنجزة',
  show: 'عرض',
  invoiceDetail: 'تفاصيل الفاتورة',
  noItems: 'لا توجد بنود',
  fillRequired: 'يرجى تعبئة جميع الحقول المطلوبة',
  successInvoice: 'تم إنشاء الفاتورة بنجاح',
  successCreated: 'تم إنشاء المصروف بنجاح',
  successUpdated: 'تم تحديث المصروف بنجاح',
  successDeleted: 'تم حذف المصروف بنجاح',
  selectAppointment: 'اختر موعد',
  selectClient: 'اختر عميلة',
  selectEmployee: 'اختر موظفة',
  selectPaymentMethod: 'طريقة الدفع',
  couponCode: 'كود الخصم',
  redeemPoints: 'استبدال نقاط',
  validate: 'تحقق',
  offerApplied: 'الخصم المطبق',
  tip: 'الإكرامية',
  giftCardCode: 'كود بطاقة الهدايا',
  print: 'طباعة',
  qrCode: 'رمز QR للفاتورة الإلكترونية',
  qrVatNumber: 'الرقم الضريبي',
  qrCopy: 'نسخ رمز QR',
  qrCopied: 'تم نسخ رمز QR',
  electronicPay: 'دفع إلكتروني',
  electronicPaySimulated: 'تمت محاكاة الدفع الإلكتروني',
};

const paymentLabelsEn: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  WALLET: 'Wallet',
  ELECTRONIC: 'Electronic',
  BANK_TRANSFER: 'Bank Transfer',
};

const paymentLabelsAr: Record<PaymentMethod, string> = {
  CASH: 'نقدي',
  CARD: 'بطاقة',
  WALLET: 'محفظة',
  ELECTRONIC: 'دفع إلكتروني',
  BANK_TRANSFER: 'تحويل بنكي',
};

const statusLabelsEn: Record<Invoice['status'], string> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
};

const statusLabelsAr: Record<Invoice['status'], string> = {
  PAID: 'مدفوعة',
  PENDING: 'معلقة',
  CANCELLED: 'ملغاة',
};

interface ClientOption {
  id: number;
  name: string;
  phone?: string | null;
}

interface ServiceOption {
  id: number;
  nameAr: string;
  nameEn: string;
  price: string | number;
}

interface ProductOption {
  id: number;
  nameAr: string;
  nameEn: string;
  salePrice: string | number;
  quantity: number;
}

interface AppointmentOption {
  id: number;
  date: string;
  startTime?: string;
  status: string;
  client?: ClientOption | null;
  service?: ServiceOption | null;
  employee?: Employee | null;
}

interface ManualItem {
  key: number;
  serviceId?: number;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface ExpenseForm {
  category: string;
  amount: string;
  description: string;
  date: Dayjs | null;
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }} color={color}>
        {value}
      </Typography>
    </Card>
  );
}

export default function AccountingPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const L = lang === 'ar' ? arLabels : enLabels;
  const paymentLabels = lang === 'ar' ? paymentLabelsAr : paymentLabelsEn;
  const statusLabels = lang === 'ar' ? statusLabelsAr : statusLabelsEn;

  const isAdmin = useAuthStore((s) => s.hasPermission('accounting.write'));
  const canManageInvoices = useAuthStore((s) => s.hasPermission('accounting.write'));
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [sellerName, setSellerName] = useState(t('general.appName') || ZATCA_SELLER_NAME);
  const [qrMode, setQrMode] = useState<QrDisplayMode>('square');
  const [vatNumber, setVatNumber] = useState(ZATCA_VAT_NUMBER);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [salonPolicy, setSalonPolicy] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    let active = true;
    getSettings()
      .then((res) => {
        const map: Record<string, string> = {};
        for (const it of res.items) map[it.key] = it.value;
        const name = (lang === 'ar' ? map['SALON_NAME_AR'] : map['SALON_NAME_EN'])?.trim();
        if (active && name) setSellerName(name);
        const vat = map['ZATCA_VAT_NUMBER']?.trim();
        if (active && vat) setVatNumber(vat);
        const mode = map['QR_DISPLAY_MODE'] as QrDisplayMode | undefined;
        if (active && (mode === 'square' || mode === 'text')) setQrMode(mode);
        if (active) {
          setWelcomeMessage(map['WELCOME_MESSAGE']?.trim() ?? '');
          setSalonPolicy(map['SALON_POLICY']?.trim() ?? '');
          setLogoUrl(map['SALON_LOGO_URL']?.trim() ?? '');
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    { open: false, message: '', severity: 'success' },
  );

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  const nameOf = (entity: { nameAr: string; nameEn: string }): string =>
    lang === 'ar' ? entity.nameAr : entity.nameEn;

  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB');
  };

  const formatMoney = (value: string | number): string =>
    Number(value).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const toIsoTimestamp = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  };

  const buildQrTlv = (invoice: Invoice): string =>
    buildZatcaQrTLV({
      sellerName: sellerName || t('general.appName') || ZATCA_SELLER_NAME,
      vatNumber: vatNumber || ZATCA_VAT_NUMBER,
      timestamp: toIsoTimestamp(invoice.date),
      invoiceTotal: Number(invoice.total),
      vatAmount: Number(invoice.tax),
    });

  const buildQrPayload = (invoice: Invoice): string =>
    buildInvoiceQrPayload({
      sellerName: sellerName || t('general.appName') || ZATCA_SELLER_NAME,
      vatNumber: vatNumber || ZATCA_VAT_NUMBER,
      timestamp: toIsoTimestamp(invoice.date),
      invoiceTotal: Number(invoice.total),
      vatAmount: Number(invoice.tax),
    });

  const copyToClipboard = (text: string): void => {
    const fallback = () => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showSnackbar(L.qrCopied, 'success');
      } finally {
        document.body.removeChild(textarea);
      }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => showSnackbar(L.qrCopied, 'success'),
        () => fallback(),
      );
    } else {
      fallback();
    }
  };

  const normalizeList = (data: unknown): unknown[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)) {
      return (data as { items: unknown[] }).items;
    }
    return [];
  };

  const openPrintWindow = async (invoice: Invoice): Promise<void> => {
    const win = window.open('', '_blank', 'width=340,height=620');
    if (!win) return;
    const rows = (invoice.items ?? [])
      .map(
        (item) =>
          `<tr><td colspan="2" style="padding:2px 0">${item.description}</td></tr><tr><td style="padding:0 0 3px;color:#555">${item.quantity} × ${formatMoney(item.unitPrice)}</td><td style="text-align:right;padding:0 0 3px">${formatMoney(item.lineTotal)}</td></tr>`,
      )
      .join('');
    const tipLine =
      Number(invoice.tip) > 0
        ? `<div class="row"><span>${L.tip}</span><span>+${formatMoney(invoice.tip ?? 0)}</span></div>`
        : '';
    const giftLine =
      Number(invoice.giftCardAmount) > 0
        ? `<div class="row"><span>${L.giftCardCode}</span><span style="color:#2e7d32">-${formatMoney(invoice.giftCardAmount ?? 0)}</span></div>`
        : '';
    const barcode = barcodeSvgDataUrl(invoice.invoiceNo);
    const qrImgUrl = qrMode === 'square' ? await generateQrImageDataUrl(buildQrPayload(invoice)).catch(() => '') : '';
    const vatLabel = vatNumber || ZATCA_VAT_NUMBER;
    const qrHtml =
      qrMode === 'square'
        ? `<img src="${qrImgUrl}" alt="${L.qrCode}" style="width:100px;height:100px;display:block;margin:4px auto" />`
        : `<div class="qr-block">${buildQrTlv(invoice)}</div>`;
    const taxable = Number(invoice.subtotal) - Number(invoice.discount);
    const vatRate = taxable > 0 ? (Number(invoice.tax) / taxable) * 100 : 15;
    win.document.write(`<!doctype html>
<html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8" />
<title>${invoice.invoiceNo}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { width: 80mm; margin: 0; padding: 3mm 4mm; font-family: 'Courier New', 'Tahoma', monospace; font-size: 11px; color: #000; background: #fff; }
  .center { text-align: center; }
  .brand { font-size: 16px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
  .badge { display: inline-block; border: 1px solid #000; padding: 1px 8px; font-size: 9px; font-weight: bold; margin-top: 2px; }
  .muted { color: #333; font-size: 10px; }
  .dash { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  .solid { border: none; border-top: 1px solid #000; margin: 5px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
  .barcode { max-width: 90%; height: auto; }
  table { width: 100%; border-collapse: collapse; }
  tbody tr { vertical-align: top; }
  .totals { margin-top: 4px; }
  .grand { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 3px double #000; border-bottom: 3px double #000; padding: 4px 0; margin: 4px 0; }
  .qr-block { margin-top: 4px; padding: 4px; border: 1px dashed #000; font-family: 'Courier New', monospace; font-size: 7px; word-break: break-all; text-align: left; }
  .welcome { text-align: center; font-size: 11px; font-weight: bold; padding: 4px 0; }
  .policy { text-align: center; font-size: 8px; color: #333; white-space: pre-line; padding: 2px 4mm; }
  .footer { text-align: center; font-size: 10px; margin-top: 6px; letter-spacing: 2px; }
  .no-print-btn { display: block; margin: 12px auto; padding: 6px 24px; font-family: inherit; font-size: 13px; }
  @media print {
    body { width: 80mm; padding: 2mm 3mm; }
    .no-print-btn { display: none; }
  }
</style></head>
<body>
  <div class="center">
    ${logoUrl ? `<img src="${logoUrl}" alt="logo" style="max-width:38mm;max-height:20mm;object-fit:contain;display:block;margin:0 auto 2mm" />` : ''}
    <div class="brand">${sellerName || ZATCA_SELLER_NAME}</div>
    <span class="badge">${lang === 'ar' ? 'فاتورة ضريبية مبسطة' : 'SIMPLIFIED TAX INVOICE'}</span>
    <div class="muted" style="margin-top:3px">${lang === 'ar' ? 'الرقم الضريبي' : 'VAT No.'}: ${vatLabel}</div>
  </div>
  <hr class="solid" />
  <div class="row"><span>${L.invoiceNo}:</span><span>${invoice.invoiceNo}</span></div>
  <div class="row"><span>${lang === 'ar' ? 'التاريخ' : 'Date'}:</span><span>${formatDate(invoice.date)}</span></div>
  <div class="row"><span>${L.client}:</span><span>${invoice.client?.name ?? '—'}</span></div>
  <div class="row"><span>${L.employee}:</span><span>${invoice.employee ? nameOf(invoice.employee) : '—'}</span></div>
  <div class="center" style="margin:4px 0"><img class="barcode" src="${barcode}" alt="${invoice.invoiceNo}" /></div>
  <hr class="dash" />
  <table><tbody>${rows}</tbody></table>
  <hr class="dash" />
  <div class="totals">
    <div class="row"><span>${L.amount}:</span><span>${formatMoney(invoice.subtotal)}</span></div>
    <div class="row"><span>${L.discount}:</span><span>${formatMoney(invoice.discount)}</span></div>
    <div class="row"><span>${lang === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} (${vatRate.toFixed(2)}%):</span><span>${formatMoney(invoice.tax)}</span></div>
    ${tipLine}
    ${giftLine}
    <div class="grand"><span>${L.total}:</span><span>${formatMoney(invoice.total)}</span></div>
  </div>
  <div class="center">
    <strong style="font-size:10px">${L.qrCode}</strong>
    ${qrHtml}
  </div>
  ${welcomeMessage ? `<hr class="dash" /><div class="welcome">${welcomeMessage}</div>` : ''}
  ${salonPolicy ? `<div class="policy">${salonPolicy}</div>` : ''}
  <div class="footer">*** ${lang === 'ar' ? 'شكراً لثقتكم' : 'THANK YOU'} ***</div>
  <button class="no-print-btn" onclick="window.print()">${L.print}</button>
</body></html>`);
    win.document.close();
  };

  // ---- Reference data (clients / services / products / employees) ----
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<AppointmentOption[]>([]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: unknown }>('/clients');
      setClients(normalizeList(res.data) as ClientOption[]);
    } catch {
      setClients([]);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: unknown }>('/services');
      setServices(normalizeList(res.data) as ServiceOption[]);
    } catch {
      setServices([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: unknown }>('/inventory/products');
      setProducts(normalizeList(res.data) as ProductOption[]);
    } catch {
      setProducts([]);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setEmployees((await listEmployees()).filter((employee) => employee.isActive));
    } catch {
      setEmployees([]);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: unknown }>('/appointments', {
        params: {
          from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
          to: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        },
      });
      const list = normalizeList(res.data) as AppointmentOption[];
      setAppointments(
        list.filter((appointment) => appointment && appointment.status !== 'CANCELLED' && appointment.status !== 'DONE'),
      );
    } catch {
      setAppointments([]);
    }
  }, []);

  // ---- Invoices ----
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicePage, setInvoicePage] = useState(0);
  const [invoicePageSize, setInvoicePageSize] = useState(20);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [qrImg, setQrImg] = useState<string>('');
  useEffect(() => {
    let active = true;
    if (!detail) {
      setQrImg('');
      return;
    }
    if (qrMode === 'square') {
      generateQrImageDataUrl(buildQrPayload(detail))
        .then((url) => {
          if (active) setQrImg(url);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, qrMode, sellerName, vatNumber]);

  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const result = await listInvoices({
        page: invoicePage + 1,
        limit: invoicePageSize,
        branchId: selectedBranchId ?? undefined,
      });
      setInvoices(result.items);
      setInvoiceTotal(result.total);
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoicePage, invoicePageSize, selectedBranchId, showSnackbar]);

  // ---- Expenses ----
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({ category: '', amount: '', description: '', date: dayjs() });

  const loadExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      setExpenses(await listExpenses());
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    } finally {
      setExpensesLoading(false);
    }
  }, [showSnackbar]);

  // ---- Summary ----
  const [summaryDate, setSummaryDate] = useState<Dayjs | null>(dayjs());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!summaryDate) return;
    setSummaryLoading(true);
    try {
      setSummary(await getSummary(summaryDate.format('YYYY-MM-DD')));
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryDate, showSnackbar]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void fetchClients();
    void fetchServices();
    void fetchProducts();
    void fetchEmployees();
  }, [fetchClients, fetchServices, fetchProducts, fetchEmployees]);

  // ---- Invoice creation dialogs ----
  const [invoiceDialog, setInvoiceDialog] = useState<null | 'appointment' | 'manual'>(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | ''>('');
  const [manualClientId, setManualClientId] = useState<number | ''>('');
  const [manualEmployeeId, setManualEmployeeId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [invoiceDiscount, setInvoiceDiscount] = useState('0');
  const [invoiceTax, setInvoiceTax] = useState('0');
  const [invoiceOfferCode, setInvoiceOfferCode] = useState('');
  const [invoiceRedeemPoints, setInvoiceRedeemPoints] = useState('');
  const [invoiceTip, setInvoiceTip] = useState('0');
  const [invoiceGiftCardCode, setInvoiceGiftCardCode] = useState('');
  const [offerFeedback, setOfferFeedback] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [newServiceId, setNewServiceId] = useState<number | ''>('');
  const [newProductId, setNewProductId] = useState<number | ''>('');
  const nextItemKey = useRef(1);

  const openAppointmentDialog = () => {
    setInvoiceDialog('appointment');
    setSelectedAppointmentId('');
    setInvoiceOfferCode('');
    setInvoiceRedeemPoints('');
    setOfferFeedback(null);
    void fetchAppointments();
  };

  const openManualDialog = () => {
    setInvoiceDialog('manual');
    setManualClientId('');
    setManualEmployeeId('');
    setManualItems([]);
    setInvoiceOfferCode('');
    setInvoiceRedeemPoints('');
    setOfferFeedback(null);
  };

  const closeInvoiceDialogs = () => {
    setInvoiceDialog(null);
    setInvoiceSaving(false);
  };

  const handleValidateOffer = async (subtotal: number) => {
    const code = invoiceOfferCode.trim();
    if (!code) {
      setOfferFeedback(null);
      return;
    }
    try {
      const result = await validateOfferCode(code, subtotal);
      if (result.valid) {
        setOfferFeedback({
          message: `${L.offerApplied}: ${formatMoney(result.discount ?? 0)}`,
          severity: 'success',
        });
      } else {
        setOfferFeedback({
          message: result.message ?? 'Offer is not valid',
          severity: 'error',
        });
      }
    } catch (err) {
      setOfferFeedback({ message: (err as ApiError).message, severity: 'error' });
    }
  };

  const addServiceItem = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;
    setManualItems((prev) => [
      ...prev,
      {
        key: nextItemKey.current++,
        serviceId: service.id,
        description: nameOf(service),
        quantity: 1,
        unitPrice: Number(service.price),
      },
    ]);
  };

  const addProductItem = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setManualItems((prev) => [
      ...prev,
      {
        key: nextItemKey.current++,
        productId: product.id,
        description: nameOf(product),
        quantity: 1,
        unitPrice: Number(product.salePrice),
      },
    ]);
  };

  const updateItem = (key: number, patch: Partial<ManualItem>) => {
    setManualItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const removeItem = (key: number) => {
    setManualItems((prev) => prev.filter((item) => item.key !== key));
  };

  const submitAppointmentInvoice = async () => {
    if (!selectedAppointmentId) {
      showSnackbar(L.selectAppointment, 'error');
      return;
    }
    setInvoiceSaving(true);
    try {
      const invoice = await createInvoiceFromAppointment({
        appointmentId: Number(selectedAppointmentId),
        discount: Number(invoiceDiscount) || 0,
        tax: Number(invoiceTax) || 0,
        tip: Number(invoiceTip) > 0 ? Number(invoiceTip) : undefined,
        paymentMethod,
        offerCode: invoiceOfferCode.trim() || undefined,
        redeemPoints: Number(invoiceRedeemPoints) > 0 ? Number(invoiceRedeemPoints) : undefined,
        giftCardCode: invoiceGiftCardCode.trim() || undefined,
      });
      if (paymentMethod === 'ELECTRONIC') {
        try {
          await createPayment({
            invoiceId: invoice.id,
            amount: Number(invoice.total) || 0,
            method: 'SIMULATED',
          });
          showSnackbar(`${L.successInvoice} — ${L.electronicPaySimulated}`, 'success');
        } catch {
          showSnackbar(L.successInvoice, 'success');
        }
      } else {
        showSnackbar(L.successInvoice, 'success');
      }
      closeInvoiceDialogs();
      await loadInvoices();
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    } finally {
      setInvoiceSaving(false);
    }
  };

  const submitManualInvoice = async () => {
    if (!manualClientId || !manualEmployeeId) {
      showSnackbar(L.fillRequired, 'error');
      return;
    }
    if (manualItems.length === 0) {
      showSnackbar(L.noItems, 'error');
      return;
    }
    setInvoiceSaving(true);
    const payload: ManualInvoiceInput = {
      clientId: Number(manualClientId),
      employeeId: Number(manualEmployeeId),
      discount: Number(invoiceDiscount) || 0,
      tax: Number(invoiceTax) || 0,
      tip: Number(invoiceTip) > 0 ? Number(invoiceTip) : undefined,
      paymentMethod,
      offerCode: invoiceOfferCode.trim() || undefined,
      redeemPoints: Number(invoiceRedeemPoints) > 0 ? Number(invoiceRedeemPoints) : undefined,
      giftCardCode: invoiceGiftCardCode.trim() || undefined,
      items: manualItems.map((item): InvoiceItemInput => ({
        serviceId: item.serviceId,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
    try {
      const invoice = await createInvoiceManual(payload);
      if (paymentMethod === 'ELECTRONIC') {
        try {
          await createPayment({
            invoiceId: invoice.id,
            amount: Number(invoice.total) || 0,
            method: 'SIMULATED',
          });
          showSnackbar(`${L.successInvoice} — ${L.electronicPaySimulated}`, 'success');
        } catch {
          showSnackbar(L.successInvoice, 'success');
        }
      } else {
        showSnackbar(L.successInvoice, 'success');
      }
      closeInvoiceDialogs();
      await loadInvoices();
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    } finally {
      setInvoiceSaving(false);
    }
  };

  // ---- Expense handlers ----
  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({ category: '', amount: '', description: '', date: dayjs() });
    setExpenseDialog(true);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: expense.category,
      amount: String(Number(expense.amount)),
      description: expense.description ?? '',
      date: dayjs(expense.date),
    });
    setExpenseDialog(true);
  };

  const submitExpense = async () => {
    if (!expenseForm.category.trim() || !expenseForm.amount) {
      showSnackbar(L.fillRequired, 'error');
      return;
    }
    const payload: ExpenseInput = {
      category: expenseForm.category.trim(),
      amount: Number(expenseForm.amount) || 0,
      description: expenseForm.description.trim() || undefined,
      date: expenseForm.date ? expenseForm.date.format('YYYY-MM-DD') : undefined,
    };
    setExpenseDialog(false);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
        showSnackbar(L.successUpdated, 'success');
      } else {
        await createExpense(payload);
        showSnackbar(L.successCreated, 'success');
      }
      await loadExpenses();
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpenseTarget) return;
    try {
      await deleteExpense(deleteExpenseTarget.id);
      showSnackbar(L.successDeleted, 'success');
      setDeleteExpenseTarget(null);
      await loadExpenses();
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    }
  };

  // ---- Columns ----
  const invoiceColumns: GridColDef<Invoice>[] = [
    { field: 'invoiceNo', headerName: L.invoiceNo, width: 180 },
    { field: 'date', headerName: L.date, width: 120, valueGetter: (_value, row) => formatDate(row.date) },
    { field: 'client', headerName: L.client, flex: 1, minWidth: 140, valueGetter: (_value, row) => row.client?.name ?? '—' },
    { field: 'employee', headerName: L.employee, width: 150, valueGetter: (_value, row) => (row.employee ? nameOf(row.employee) : '—') },
    { field: 'total', headerName: L.total, width: 110, valueGetter: (_value, row) => formatMoney(row.total) },
    {
      field: 'paymentMethod',
      headerName: L.paymentMethod,
      width: 120,
      renderCell: ({ row }) => <Chip label={paymentLabels[row.paymentMethod]} size="small" />,
    },
    {
      field: 'status',
      headerName: L.status,
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          label={statusLabels[row.status]}
          size="small"
          variant="outlined"
          color={row.status === 'PAID' ? 'success' : row.status === 'PENDING' ? 'warning' : 'error'}
        />
      ),
    },
  ];

  const expenseColumns: GridColDef<Expense>[] = [
    { field: 'date', headerName: L.date, width: 130, valueGetter: (_value, row) => formatDate(row.date) },
    { field: 'category', headerName: L.category, flex: 1, minWidth: 150 },
    { field: 'amount', headerName: L.amount, width: 120, valueGetter: (_value, row) => formatMoney(row.amount) },
    { field: 'description', headerName: L.expenseDescription, flex: 1, minWidth: 200, valueGetter: (_value, row) => row.description ?? '—' },
    {
      field: 'actions',
      headerName: L.actions,
      width: 120,
      sortable: false,
      renderCell: ({ row }) =>
        isAdmin ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" aria-label={L.edit} onClick={() => openEditExpense(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" aria-label={L.delete} onClick={() => setDeleteExpenseTarget(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        ),
    },
  ];

  const summaryCards: Array<{
    key: string;
    label: string;
    value: string;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  }> = summary
    ? [
        { key: 'revenue', label: L.revenue, value: formatMoney(summary.revenue), color: 'primary' },
        { key: 'expenses', label: L.expenses, value: formatMoney(summary.expenses), color: 'error' },
        { key: 'profit', label: L.profit, value: formatMoney(summary.profit), color: 'success' },
        { key: 'commissions', label: L.commissions, value: formatMoney(summary.commissions), color: 'secondary' },
        { key: 'invoicesCount', label: L.invoicesCount, value: String(summary.invoicesCount) },
        { key: 'doneAppointments', label: L.doneAppointments, value: String(summary.doneAppointments) },
      ]
    : [];

  return (
    <Box>
      <PageHeader title={L.title} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_event, value: number) => setTab(value)}>
          <Tab label={L.invoices} />
          <Tab label={L.expenses} />
          <Tab label={L.summary} />
        </Tabs>
        <ExportButtons
          endpoint={tab === 1 ? '/accounting/expenses/export' : '/accounting/invoices/export'}
        />
      </Stack>

      {tab === 0 && (
        <Box>
          {canManageInvoices && (
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAppointmentDialog}>
                {L.invoiceFromAppointment}
              </Button>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={openManualDialog}>
                {L.manualInvoice}
              </Button>
            </Stack>
          )}
          <Box sx={{ height: 'calc(100vh - 280px)', width: '100%' }}>
            <DataGrid
              rows={invoices}
              columns={invoiceColumns}
              loading={invoicesLoading}
              getRowId={(row) => row.id}
              rowCount={invoiceTotal}
              paginationMode="server"
              paginationModel={{ page: invoicePage, pageSize: invoicePageSize }}
              onPaginationModelChange={(model) => {
                setInvoicePage(model.page);
                setInvoicePageSize(model.pageSize);
              }}
              pageSizeOptions={[10, 20, 50]}
              onRowClick={({ row }) => setDetail(row)}
              sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
            />
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAddExpense} sx={{ mb: 2 }}>
              {L.addExpense}
            </Button>
          )}
          <Box sx={{ height: 'calc(100vh - 280px)', width: '100%' }}>
            <DataGrid
              rows={expenses}
              columns={expenseColumns}
              loading={expensesLoading}
              getRowId={(row) => row.id}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
              pageSizeOptions={[10, 25, 50]}
            />
          </Box>
        </Box>
      )}

      {tab === 2 && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <DatePicker label={L.date} value={summaryDate} onChange={(value: Dayjs | null) => setSummaryDate(value)} />
            <Button
              variant="contained"
              onClick={loadSummary}
              disabled={summaryLoading || !summaryDate}
              startIcon={summaryLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {L.show}
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {summaryCards.map((card) => (
              <Grid key={card.key} size={{ xs: 12, sm: 6, md: 4 }}>
                <SummaryCard label={card.label} value={card.value} color={card.color} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}

      {/* Invoice from appointment dialog */}
      <Dialog open={invoiceDialog === 'appointment'} onClose={closeInvoiceDialogs} fullWidth maxWidth="sm">
        <DialogTitle>{L.invoiceFromAppointment}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label={L.appointment}
              value={selectedAppointmentId}
              onChange={(e) => setSelectedAppointmentId(e.target.value ? Number(e.target.value) : '')}
              fullWidth
            >
              {appointments.map((appointment) => (
                <MenuItem key={appointment.id} value={appointment.id}>
                  {`#${appointment.id} — ${formatDate(appointment.date)}${appointment.startTime ? ` ${appointment.startTime}` : ''}`}
                  {appointment.client ? ` — ${appointment.client.name}` : ''}
                  {appointment.service ? ` — ${nameOf(appointment.service)}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={L.discount}
              type="number"
              value={invoiceDiscount}
              onChange={(e) => setInvoiceDiscount(e.target.value)}
              fullWidth
            />
            <TextField
              label={L.tax}
              type="number"
              value={invoiceTax}
              onChange={(e) => setInvoiceTax(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                label={L.couponCode}
                value={invoiceOfferCode}
                onChange={(e) => {
                  setInvoiceOfferCode(e.target.value);
                  setOfferFeedback(null);
                }}
                fullWidth
                size="small"
              />
              <Button
                variant="outlined"
                onClick={() =>
                  void handleValidateOffer(
                    appointments.find((a) => a.id === Number(selectedAppointmentId))?.service
                      ? Number(
                          appointments.find((a) => a.id === Number(selectedAppointmentId))?.service
                            ?.price,
                        )
                      : 0,
                  )
                }
                sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
              >
                {L.validate}
              </Button>
            </Stack>
            {offerFeedback && (
              <Alert severity={offerFeedback.severity}>{offerFeedback.message}</Alert>
            )}
            <TextField
              label={L.redeemPoints}
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={invoiceRedeemPoints}
              onChange={(e) => setInvoiceRedeemPoints(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={L.tip}
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={invoiceTip}
                onChange={(e) => setInvoiceTip(e.target.value)}
                fullWidth
              />
              <TextField
                label={L.giftCardCode}
                value={invoiceGiftCardCode}
                onChange={(e) => setInvoiceGiftCardCode(e.target.value.toUpperCase())}
                fullWidth
              />
            </Stack>
            <TextField
              select
              label={L.selectPaymentMethod}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              fullWidth
            >
              {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                <MenuItem key={method} value={method}>
                  {paymentLabels[method]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInvoiceDialogs}>{L.cancel}</Button>
          <Button
            variant="contained"
            onClick={submitAppointmentInvoice}
            disabled={invoiceSaving}
            startIcon={invoiceSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {L.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual invoice dialog */}
      <Dialog open={invoiceDialog === 'manual'} onClose={closeInvoiceDialogs} fullWidth maxWidth="md">
        <DialogTitle>{L.manualInvoice}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label={L.selectClient}
              value={manualClientId}
              onChange={(e) => setManualClientId(e.target.value ? Number(e.target.value) : '')}
              fullWidth
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={L.selectEmployee}
              value={manualEmployeeId}
              onChange={(e) => setManualEmployeeId(e.target.value ? Number(e.target.value) : '')}
              fullWidth
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {nameOf(employee)}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>{L.addService}</InputLabel>
                <Select
                  label={L.addService}
                  value={newServiceId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) addServiceItem(id);
                    setNewServiceId('');
                  }}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      {`${nameOf(service)} — ${formatMoney(service.price)}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>{L.addProduct}</InputLabel>
                <Select
                  label={L.addProduct}
                  value={newProductId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) addProductItem(id);
                    setNewProductId('');
                  }}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {`${nameOf(product)} — ${formatMoney(product.salePrice)} (${product.quantity})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {manualItems.length > 0 ? (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{L.description}</TableCell>
                      <TableCell align="center" width={90}>
                        {L.quantity}
                      </TableCell>
                      <TableCell align="center" width={130}>
                        {L.unitPrice}
                      </TableCell>
                      <TableCell align="right" width={120}>
                        {L.lineTotal}
                      </TableCell>
                      <TableCell width={50} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manualItems.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell align="right">{formatMoney(item.quantity * item.unitPrice)}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => removeItem(item.key)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {L.noItems}
              </Typography>
            )}

            <Divider />
            <Stack direction="row" spacing={2}>
              <TextField
                label={L.discount}
                type="number"
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(e.target.value)}
                fullWidth
              />
              <TextField
                label={L.tax}
                type="number"
                value={invoiceTax}
                onChange={(e) => setInvoiceTax(e.target.value)}
                fullWidth
              />
              <TextField
                select
                label={L.selectPaymentMethod}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                fullWidth
              >
                {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                  <MenuItem key={method} value={method}>
                    {paymentLabels[method]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                label={L.couponCode}
                value={invoiceOfferCode}
                onChange={(e) => {
                  setInvoiceOfferCode(e.target.value);
                  setOfferFeedback(null);
                }}
                fullWidth
                size="small"
              />
              <Button
                variant="outlined"
                onClick={() =>
                  void handleValidateOffer(
                    manualItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
                  )
                }
                sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
              >
                {L.validate}
              </Button>
            </Stack>
            {offerFeedback && (
              <Alert severity={offerFeedback.severity}>{offerFeedback.message}</Alert>
            )}
            <TextField
              label={L.redeemPoints}
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={invoiceRedeemPoints}
              onChange={(e) => setInvoiceRedeemPoints(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={L.tip}
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={invoiceTip}
                onChange={(e) => setInvoiceTip(e.target.value)}
                fullWidth
              />
              <TextField
                label={L.giftCardCode}
                value={invoiceGiftCardCode}
                onChange={(e) => setInvoiceGiftCardCode(e.target.value.toUpperCase())}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInvoiceDialogs}>{L.cancel}</Button>
          <Button
            variant="contained"
            onClick={submitManualInvoice}
            disabled={invoiceSaving}
            startIcon={invoiceSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {L.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice detail dialog */}
      <Dialog open={detail !== null} onClose={() => setDetail(null)} fullWidth maxWidth="md">
        <DialogTitle>{L.invoiceDetail}</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {L.invoiceNo}
                  </Typography>
                  <Typography variant="body1">{detail.invoiceNo}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {L.date}
                  </Typography>
                  <Typography variant="body1">{formatDate(detail.date)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {L.client}
                  </Typography>
                  <Typography variant="body1">{detail.client?.name ?? '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {L.employee}
                  </Typography>
                  <Typography variant="body1">{detail.employee ? nameOf(detail.employee) : '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {L.paymentMethod}
                  </Typography>
                  <Typography variant="body1">{paymentLabels[detail.paymentMethod]}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {L.status}
                  </Typography>
                  <Typography variant="body1">{statusLabels[detail.status]}</Typography>
                </Box>
                {detail.paymentMethod === 'ELECTRONIC' && (
                  <Box>
                    <Typography variant="body2" color="success.main">
                      {L.electronicPaySimulated}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Divider />
              {detail.items && detail.items.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{L.description}</TableCell>
                        <TableCell align="center">{L.quantity}</TableCell>
                        <TableCell align="center">{L.unitPrice}</TableCell>
                        <TableCell align="right">{L.lineTotal}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detail.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="center">{formatMoney(item.unitPrice)}</TableCell>
                          <TableCell align="right">{formatMoney(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {L.noItems}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Stack spacing={0.5} alignItems="flex-end">
                  <Typography variant="body2">
                    {L.amount}: {formatMoney(detail.subtotal)}
                  </Typography>
                  <Typography variant="body2">
                    {L.discount}: {formatMoney(detail.discount)}
                  </Typography>
                  <Typography variant="body2">
                    {L.tax}: {formatMoney(detail.tax)}
                  </Typography>
                  {Number(detail.tip) > 0 && (
                    <Typography variant="body2">
                      {L.tip}: +{formatMoney(detail.tip ?? 0)}
                    </Typography>
                  )}
                  {Number(detail.giftCardAmount) > 0 && (
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      {L.giftCardCode}: -{formatMoney(detail.giftCardAmount ?? 0)}
                    </Typography>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {L.total}: {formatMoney(detail.total)}
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {L.qrCode}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyIcon fontSize="small" />}
                    onClick={() => copyToClipboard(buildQrTlv(detail))}
                  >
                    {L.qrCopy}
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {L.qrVatNumber}: {vatNumber || ZATCA_VAT_NUMBER}
                </Typography>
                {qrMode === 'square' ? (
                  qrImg ? (
                    <Box component="img" src={qrImg} alt={L.qrCode} sx={{ width: 160, height: 160, mt: 1 }} />
                  ) : null
                ) : (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      display: 'block',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap',
                      bgcolor: 'action.hover',
                      p: 1,
                      borderRadius: 1,
                      mt: 0.5,
                      fontSize: '0.65rem',
                    }}
                  >
                    {buildQrTlv(detail)}
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            disabled={!detail}
            onClick={() => {
              if (detail) openPrintWindow(detail);
            }}
          >
            {L.print}
          </Button>
          <Button onClick={() => setDetail(null)}>{L.cancel}</Button>
        </DialogActions>
      </Dialog>

      {/* Expense dialog */}
      <Dialog open={expenseDialog} onClose={() => setExpenseDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingExpense ? L.editExpense : L.addExpense}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={L.category}
              value={expenseForm.category}
              onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label={L.amount}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label={L.expenseDescription}
              value={expenseForm.description}
              onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
              multiline
              minRows={2}
              fullWidth
            />
            <DatePicker
              label={L.date}
              value={expenseForm.date}
              onChange={(value: Dayjs | null) => setExpenseForm((f) => ({ ...f, date: value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialog(false)}>{L.cancel}</Button>
          <Button variant="contained" onClick={submitExpense}>
            {L.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteExpenseTarget}
        onClose={() => setDeleteExpenseTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{L.delete}</DialogTitle>
        <DialogContent>
          <Alert severity="warning">{L.deleteConfirm}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteExpenseTarget(null)}>{L.cancel}</Button>
          <Button color="error" variant="contained" onClick={() => void handleDeleteExpense()}>
            {L.delete}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}