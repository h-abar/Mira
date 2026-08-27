import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableRowsIcon from '@mui/icons-material/TableRows';
import PrintIcon from '@mui/icons-material/Print';
import PaidIcon from '@mui/icons-material/Paid';
import StarIcon from '@mui/icons-material/Star';
import { type ApiError } from '../api/client';
import { createInvoiceFromAppointment, type Invoice } from '../api/accounting';
import { createPayment } from '../api/payments';
import { buildInvoiceQrPayload, generateQrImageDataUrl, type QrDisplayMode } from '../utils/invoiceQr';
import { barcodeSvgDataUrl } from '../utils/barcode';
import { ZATCA_VAT_NUMBER } from '../utils/zatcaQR';
import {
  changeAppointmentStatus,
  createAppointment,
  createAppointmentGroup,
  deleteAppointment,
  listAppointments,
  sendAppointmentReminder,
  updateAppointment,
  type Appointment,
  type AppointmentInput,
  type AppointmentListParams,
  type AppointmentStatus,
} from '../api/appointments';
import { listEmployees, type Employee } from '../api/employees';
import { listClients, type Client } from '../api/clients';
import { getSettings } from '../api/settings';
import { listServices, type Service } from '../api/services';
import { useAuthStore } from '../stores/authStore';
import { toHijri } from '../utils/hijri';
import PageHeader from '../components/PageHeader';

const labels = {
  ar: {
    pageTitle: 'المواعيد',
    newAppointment: 'موعد جديد',
    date: 'التاريخ',
    employee: 'الموظفة',
    allEmployees: 'جميع الموظفات',
    client: 'العميلة',
    service: 'الخدمة',
    price: 'السعر',
    status: 'الحالة',
    notes: 'ملاحظات',
    time: 'الوقت',
    actions: 'إجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    startTime: 'وقت البداية',
    endTime: 'وقت النهاية',
    selectClient: 'اختر العميلة',
    selectEmployee: 'اختر الموظفة',
    selectService: 'اختر الخدمة',
    searchClientHint: 'ابحث بالاسم أو رقم الجوال',
    bookingItems: 'الخدمات المحجوزة',
    addItemRow: 'إضافة خدمة أخرى',
    removeItemRow: 'حذف',
    itemsHint: 'نفس الموظفة: تُجدول الخدمات تباعًا — موظفات مختلفات: بالتوازي',
    fillAllItems: 'اختر الخدمة والموظفة لكل صف',
    calendarView: 'التقويم',
    tableView: 'الجدول',
    dragHint: 'اسحب الموعد إلى عمود موظفة أخرى أو وقت آخر',
    invoicePrint: 'فاتورة وطباعة',
    payConfirm: 'تأكيد الموعد بالسداد',
    payAmount: 'المبلغ المدفوع',
    payMethod: 'طريقة السداد',
    transfer: 'تحويل بنكي',
    networkPay: 'الدفع بالشبكة',
    confirmedPaid: 'مؤكد بالسداد',
    paid: 'مدفوع',
    searchClients: 'ابحث عن عميلة (اسم أو جوال)',
    invoiceFor: 'فاتورة الموعد',
    redeemNow: 'استبدال النقاط',
    noRedeem: 'طباعة دون استبدال',
    createPrint: 'إنشاء وطباعة',
    loyaltyBalance: 'رصيد نقاط الولاء',
    worthValue: 'بقيمة',
    usePoints: 'استخدام',
    useAllPoints: 'استخدام الكل',
    pointsUnit: 'نقطة',
    redeemValueHint: 'خصم',
    statuses: {
      BOOKED: 'محجوز',
      CONFIRMED: 'مؤكد',
      ARRIVED: 'وصلت',
      DONE: 'تم',
      CANCELLED: 'ملغي',
    } as Record<AppointmentStatus, string>,
    created: 'تم إنشاء الموعد بنجاح',
    updated: 'تم تحديث الموعد بنجاح',
    deleted: 'تم حذف الموعد بنجاح',
    deleteConfirm: 'هل أنت متأكد من حذف هذا الموعد؟',
    noAppointments: 'لا توجد مواعيد في هذا اليوم',
    loading: 'جاري التحميل...',
    loadFailed: 'تعذر تحميل المواعيد',
    saveFailed: 'تعذر حفظ الموعد',
    deleteFailed: 'تعذر حذف الموعد',
    remind: 'إرسال تذكير واتساب',
    reminderSent: 'تم إرسال تذكير واتساب بنجاح',
    reminderSimulated: 'تمت المحاكاة — الإرسال الفعلي يتطلب إعداد توكن واتساب',
    reminderFailed: 'تعذر إرسال التذكير',
    fillRequired: 'يرجى إكمال جميع الحقول المطلوبة',
    refsLoadFailed: 'تعذر تحميل البيانات',
    cancelTitle: 'إلغاء الموعد',
    cancelFee: 'رسوم الإلغاء (اختياري)',
    cancelConfirm: 'تأكيد الإلغاء',
  },
  en: {
    pageTitle: 'Appointments',
    newAppointment: 'New Appointment',
    date: 'Date',
    employee: 'Employee',
    allEmployees: 'All employees',
    client: 'Client',
    service: 'Service',
    price: 'Price',
    status: 'Status',
    notes: 'Notes',
    time: 'Time',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    startTime: 'Start time',
    endTime: 'End time',
    selectClient: 'Select client',
    selectEmployee: 'Select employee',
    selectService: 'Select service',
    searchClientHint: 'Search by name or phone number',
    bookingItems: 'Booked services',
    addItemRow: 'Add another service',
    removeItemRow: 'Remove',
    itemsHint: 'Same employee: services run back-to-back — different employees: in parallel',
    fillAllItems: 'Select a service and employee for each row',
    calendarView: 'Calendar',
    tableView: 'Table',
    dragHint: 'Drag an appointment to another employee column or time slot',
    invoicePrint: 'Invoice & print',
    payConfirm: 'Confirm appointment with payment',
    payAmount: 'Amount paid',
    payMethod: 'Payment method',
    transfer: 'Bank transfer',
    networkPay: 'Card (network)',
    confirmedPaid: 'Paid & confirmed',
    paid: 'Paid',
    searchClients: 'Search client (name or phone)',
    invoiceFor: 'Appointment Invoice',
    redeemNow: 'Redeem points',
    noRedeem: 'Print without redemption',
    createPrint: 'Create & print',
    loyaltyBalance: 'Loyalty points balance',
    worthValue: 'worth',
    usePoints: 'Use',
    useAllPoints: 'Use all',
    pointsUnit: 'pts',
    redeemValueHint: 'discount',
    statuses: {
      BOOKED: 'Booked',
      ARRIVED: 'Arrived',
      DONE: 'Done',
      CANCELLED: 'Cancelled',
    } as Record<AppointmentStatus, string>,
    created: 'Appointment created successfully',
    updated: 'Appointment updated successfully',
    deleted: 'Appointment deleted successfully',
    deleteConfirm: 'Are you sure you want to delete this appointment?',
    noAppointments: 'No appointments for this day',
    loading: 'Loading...',
    loadFailed: 'Failed to load appointments',
    saveFailed: 'Failed to save appointment',
    deleteFailed: 'Failed to delete appointment',
    remind: 'Send WhatsApp reminder',
    reminderSent: 'WhatsApp reminder sent successfully',
    reminderSimulated: 'Simulated — real sending requires configuring the WhatsApp token',
    reminderFailed: 'Failed to send reminder',
    fillRequired: 'Please fill in all required fields',
    refsLoadFailed: 'Failed to load data',
    cancelTitle: 'Cancel Appointment',
    cancelFee: 'Cancellation fee (optional)',
    cancelConfirm: 'Confirm Cancellation',
  },
} as const;

type Lang = keyof typeof labels;
type Labels = (typeof labels)[Lang];

const ALL_STATUSES: AppointmentStatus[] = [
  'BOOKED',
  'CONFIRMED',
  'ARRIVED',
  'DONE',
  'CANCELLED',
];

const statusColor: Record<
  AppointmentStatus,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  BOOKED: 'info',
  CONFIRMED: 'secondary',
  ARRIVED: 'warning',
  DONE: 'success',
  CANCELLED: 'error',
};

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

interface FormState {
  clientId: number | '';
  employeeId: number | '';
  serviceId: number | '';
  date: Dayjs;
  startTime: string;
  endTime: string;
  notes: string;
}

interface SnackState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

interface AppointmentDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  appointment: Appointment | null;
  defaultDate: Dayjs;
  clients: Client[];
  employees: Employee[];
  services: Service[];
  lang: Lang;
  L: Labels;
  pointValue: number;
  onClose: () => void;
  onSaved: (message: string) => void;
  onItemSaved?: (message: string) => void;
}

function AppointmentDialog({
  open,
  mode,
  appointment,
  defaultDate,
  clients,
  employees,
  services,
  lang,
  L,
  pointValue,
  onClose,
  onSaved,
  onItemSaved,
}: AppointmentDialogProps) {
  const [form, setForm] = useState<FormState>({
    clientId: '',
    employeeId: '',
    serviceId: '',
    date: defaultDate,
    startTime: '10:00',
    endTime: '',
    notes: '',
  });
  const [items, setItems] = useState<
    Array<{ serviceId: number | ''; employeeId: number | ''; startTime: string }>
  >([{ serviceId: '', employeeId: '', startTime: '10:00' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    if (mode === 'edit' && appointment) {
      setItems([
        { serviceId: appointment.serviceId, employeeId: appointment.employeeId, startTime: appointment.startTime },
      ]);
      setForm({
        clientId: appointment.clientId,
        employeeId: appointment.employeeId,
        serviceId: appointment.serviceId,
        date: dayjs(appointment.date),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        notes: appointment.notes ?? '',
      });
    } else {
      setItems([{ serviceId: '', employeeId: '', startTime: '10:00' }]);
      setForm({
        clientId: '',
        employeeId: '',
        serviceId: '',
        date: defaultDate,
        startTime: '10:00',
        endTime: '',
        notes: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const nameOf = (obj?: { nameAr?: string; nameEn?: string } | null): string => {
    if (!obj) {
      return '';
    }
    return lang === 'ar' ? obj.nameAr || obj.nameEn || '' : obj.nameEn || obj.nameAr || '';
  };

  const handleServiceChange = (value: number | '') => {
    setForm((f) => {
      const next = { ...f, serviceId: value };
      if (typeof value === 'number') {
        const service = services.find((s) => s.id === value);
        if (service && next.startTime) {
          next.endTime = addMinutes(next.startTime, service.durationMinutes);
        }
      }
      return next;
    });
  };

  // Auto-computed schedule for the multi-service booking: end time of every
  // row is derived from its service duration. Same employee -> back-to-back
  // starting at form.startTime; different employees run in parallel.
  const itemSchedule = useMemo(() => {
    const cursors = new Map<number, string>();
    return items.map((it) => {
      if (it.serviceId === '' || it.employeeId === '') return null;
      const service = services.find((s) => s.id === it.serviceId);
      if (!service || !it.startTime) return null;
      const start = cursors.get(it.employeeId) ?? it.startTime;
      const end = addMinutes(start, service.durationMinutes);
      cursors.set(it.employeeId, end);
      const employee = employees.find((e) => e.id === it.employeeId);
      return {
        key: `${it.serviceId}-${it.employeeId}`,
        serviceName: nameOf(service),
        employeeName: employee ? nameOf(employee) : '',
        start,
        end,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, services, employees, lang]);

  // Save a single service immediately as its own appointment ("each service
  // saves by itself"). The dialog stays open so more services can be added to
  // the same booking (same client + date) one by one.
  const saveItem = async (index: number) => {
    const it = items[index];
    if (!form.clientId) {
      setError(L.fillRequired);
      return;
    }
    if (it.serviceId === '' || it.employeeId === '' || !it.startTime) {
      setError(L.fillAllItems);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createAppointment({
        clientId: Number(form.clientId),
        employeeId: Number(it.employeeId),
        serviceId: Number(it.serviceId),
        date: form.date.format('YYYY-MM-DD'),
        startTime: it.startTime,
        notes: form.notes.trim() || undefined,
      });
      if (onItemSaved) onItemSaved(L.created);
      // Clear the saved row (keep its time) so the next service can be entered quickly.
      setItems((prev) =>
        prev.map((p, i) =>
          i === index ? { serviceId: '', employeeId: '', startTime: it.startTime } : p,
        ),
      );
    } catch (err) {
      setError((err as ApiError).message || L.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.clientId || !form.startTime) {
      setError(L.fillRequired);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'create') {
        const filled = items.filter((it) => it.serviceId !== '' && it.employeeId !== '');
        if (filled.length === 0 || filled.length !== items.length) {
          setError(L.fillAllItems);
          setSubmitting(false);
          return;
        }
        await createAppointmentGroup({
          clientId: Number(form.clientId),
          date: form.date.format('YYYY-MM-DD'),
          startTime: form.startTime,
          notes: form.notes.trim() || undefined,
          items: filled.map((it) => ({
            serviceId: Number(it.serviceId),
            employeeId: Number(it.employeeId),
          })),
        });
        onSaved(L.created);
      } else if (appointment) {
        if (!form.employeeId || !form.serviceId) {
          setError(L.fillRequired);
          setSubmitting(false);
          return;
        }
        const payload: AppointmentInput = {
          clientId: Number(form.clientId),
          employeeId: Number(form.employeeId),
          serviceId: Number(form.serviceId),
          date: form.date.format('YYYY-MM-DD'),
          startTime: form.startTime,
          endTime: form.endTime || undefined,
          notes: form.notes.trim() || undefined,
        };
        await updateAppointment(appointment.id, payload);
        onSaved(L.updated);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || L.saveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? L.newAppointment : L.edit}</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '58vh', overflowY: 'auto' }}>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Autocomplete<Client>
            fullWidth
            size="small"
            options={clients}
            getOptionLabel={(c) => c.name}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            value={clients.find((c) => c.id === form.clientId) ?? null}
            onChange={(_e, value) =>
              setForm((f) => ({ ...f, clientId: value ? value.id : '' }))
            }
            filterOptions={(options, state) => {
              const q = state.inputValue.trim().toLowerCase();
              if (q === '') return options;
              return options.filter(
                (c) =>
                  c.name.toLowerCase().includes(q) ||
                  (c.phone ?? '').toLowerCase().includes(q) ||
                  (c.whatsapp ?? '').toLowerCase().includes(q),
              );
            }}
            renderOption={(props, c) => {
              const { key, ...rest } = props as { key?: string };
              const phone = c.phone || c.whatsapp;
              return (
                <Box component="li" key={key ?? c.id} {...rest}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {c.name}
                      {phone && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {phone}
                        </Typography>
                      )}
                    </Typography>
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      icon={<StarIcon />}
                      label={`${c.loyaltyPoints ?? 0}`}
                    />
                  </Box>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label={L.client} placeholder={L.searchClientHint} />
            )}
          />
          {(() => {
            const selected = clients.find((c) => c.id === form.clientId);
            const pts = selected?.loyaltyPoints ?? 0;
            if (!selected) return null;
            return (
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  border: 1.5,
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                }}
              >
                <StarIcon color="primary" fontSize="small" />
                <Typography variant="body2" fontWeight={800} color="primary.main">
                  {pts} {L.pointsUnit}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {L.loyaltyBalance} — {L.worthValue} {(pts * pointValue).toFixed(2)}
                </Typography>
              </Box>
            );
          })()}
          {mode === 'edit' ? (
            <>
              <FormControl fullWidth size="small">
                <InputLabel id="dialog-employee-label">{L.employee}</InputLabel>
                <Select<number | ''>
                  labelId="dialog-employee-label"
                  label={L.employee}
                  value={form.employeeId}
                  onChange={(e: SelectChangeEvent<number | ''>) =>
                    setForm((f) => ({ ...f, employeeId: e.target.value as number | '' }))
                  }
                >
                  <MenuItem value="" disabled>
                    {L.selectEmployee}
                  </MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {nameOf(emp)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="dialog-service-label">{L.service}</InputLabel>
                <Select<number | ''>
                  labelId="dialog-service-label"
                  label={L.service}
                  value={form.serviceId}
                  onChange={(e: SelectChangeEvent<number | ''>) =>
                    handleServiceChange(e.target.value as number | '')
                  }
                >
                  <MenuItem value="" disabled>
                    {L.selectService}
                  </MenuItem>
                  {services.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {nameOf(s)} — {Number(s.price).toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <Typography variant="subtitle2" color="text.secondary">
                {L.bookingItems}
              </Typography>
              {items.map((item, index) => (
                <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`item-service-${index}`}>{L.service}</InputLabel>
                    <Select<number | ''>
                      labelId={`item-service-${index}`}
                      label={L.service}
                      value={item.serviceId}
                      onChange={(e: SelectChangeEvent<number | ''>) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === index ? { ...it, serviceId: e.target.value as number | '' } : it,
                          ),
                        )
                      }
                    >
                      <MenuItem value="" disabled>
                        {L.selectService}
                      </MenuItem>
                      {services.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {nameOf(s)} — {Number(s.price).toFixed(2)} ({s.durationMinutes} {lang === 'ar' ? 'د' : 'min'})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`item-employee-${index}`}>{L.employee}</InputLabel>
                    <Select<number | ''>
                      labelId={`item-employee-${index}`}
                      label={L.employee}
                      value={item.employeeId}
                      onChange={(e: SelectChangeEvent<number | ''>) =>
                        setItems((prev) =>
                          prev.map((it, i) =>
                            i === index ? { ...it, employeeId: e.target.value as number | '' } : it,
                          ),
                        )
                      }
                    >
                      <MenuItem value="" disabled>
                        {L.selectEmployee}
                      </MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {nameOf(emp)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    type="time"
                    label={L.startTime}
                    size="small"
                    value={item.startTime}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, i) =>
                          i === index ? { ...it, startTime: e.target.value } : it,
                        ),
                      )
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => void saveItem(index)}
                    disabled={
                      submitting ||
                      !form.clientId ||
                      item.serviceId === '' ||
                      item.employeeId === '' ||
                      !item.startTime
                    }
                    title={lang === 'ar' ? 'حفظ هذه الخدمة' : 'Save this service'}
                  >
                    <SaveIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    disabled={items.length === 1}
                    title={L.removeItemRow}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              {itemSchedule.some(Boolean) && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    border: 1.5,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom={false}>
                    {lang === 'ar' ? 'الجدول المحسوب تلقائيًا' : 'Auto-computed schedule'}
                  </Typography>
                  {itemSchedule.map((slot, i) =>
                    slot ? (
                      <Typography key={i} variant="caption" display="block">
                        🕒 {slot.start} – {slot.end} — {slot.serviceName}
                        {slot.employeeName ? ` (${slot.employeeName})` : ''}
                      </Typography>
                    ) : null,
                  )}
                </Box>
              )}
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setItems((prev) => [...prev, { serviceId: '', employeeId: '', startTime: form.startTime || '10:00' }])}
                >
                  {L.addItemRow}
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }} color="text.secondary">
                  {L.itemsHint}
                </Typography>
              </Box>
            </>
          )}
          <DatePicker
            label={L.date}
            value={form.date}
            onChange={(value: Dayjs | null) => {
              if (value) {
                setForm((f) => ({ ...f, date: value }));
              }
            }}
            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="time"
              label={L.startTime}
              size="small"
              value={form.startTime}
              onChange={(e) =>
                setForm((f) => {
                  const next = { ...f, startTime: e.target.value };
                  // End time always follows the service duration.
                  const service =
                    typeof f.serviceId === 'number'
                      ? services.find((s) => s.id === f.serviceId)
                      : undefined;
                  if (service && next.startTime) {
                    next.endTime = addMinutes(next.startTime, service.durationMinutes);
                  }
                  return next;
                })
              }
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="time"
              label={L.endTime}
              size="small"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          <TextField
            label={L.notes}
            size="small"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{L.cancel}</Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? <CircularProgress size={18} color="inherit" /> : L.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AppointmentsPage() {
  const { i18n, t } = useTranslation();

  const lang: Lang = i18n.language === 'en' ? 'en' : 'ar';
  const L = labels[lang];

  const canManage = useAuthStore((s) => s.hasPermission('appointments.write'));

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [employeeFilter, setEmployeeFilter] = useState<number | ''>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snack, setSnack] = useState<SnackState>({ open: false, message: '', severity: 'success' });
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    appointment: Appointment | null;
  }>({ open: false, mode: 'create', appointment: null });
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelFee, setCancelFee] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [payTarget, setPayTarget] = useState<Appointment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'TRANSFER' | 'CARD'>('TRANSFER');
  const [paySaving, setPaySaving] = useState(false);
  const [dropEmpId, setDropEmpId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [pointValue, setPointValue] = useState(0.1);
  const [invoiceTarget, setInvoiceTarget] = useState<Appointment | null>(null);
  const [invRedeem, setInvRedeem] = useState('');
  const [invBusy, setInvBusy] = useState(false);
  const [salonName, setSalonName] = useState('MIRA');
  const [logoUrl, setLogoUrl] = useState('');
  const [vatNumber, setVatNumber] = useState(ZATCA_VAT_NUMBER);
  const [vatRateDisplay, setVatRateDisplay] = useState(15);
  const [qrMode, setQrMode] = useState<QrDisplayMode>('square');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [salonPolicy, setSalonPolicy] = useState('');
  // Precise drag state: where inside the grabbed block the pointer holds it
  // (in minutes) plus its duration, used to land the block exactly under the
  // cursor and to draw the snapped preview bar while hovering a column.
  const dragInfoRef = useRef<{ id: number; grabMin: number; durationMin: number } | null>(null);
  const lastDragEndRef = useRef(0);
  const [hoverSlot, setHoverSlot] = useState<{ empId: number; startMin: number } | null>(null);

  const showSnack = (message: string, severity: 'success' | 'error') => {
    setSnack({ open: true, message, severity });
  };

  // Loyalty settings for the invoice-redemption dialog.
  useEffect(() => {
    let active = true;
    getSettings()
      .then((res) => {
        if (!active) return;
        const map: Record<string, string> = {};
        for (const it of res.items) map[it.key] = it.value;
        const pValue = Number(map['LOYALTY_POINT_VALUE']);
        if (Number.isFinite(pValue) && pValue > 0) setPointValue(pValue);
        const name = (lang === 'ar' ? map['SALON_NAME_AR'] : map['SALON_NAME_EN'])?.trim();
        if (name) setSalonName(name);
        setLogoUrl(map['SALON_LOGO_URL']?.trim() ?? '');
        const vat = map['ZATCA_VAT_NUMBER']?.trim();
        if (vat) setVatNumber(vat);
        const rate = Number(map['VAT_RATE']);
        if (Number.isFinite(rate) && rate >= 0) setVatRateDisplay(rate);
        const mode = map['QR_DISPLAY_MODE'] as QrDisplayMode | undefined;
        if (mode === 'square' || mode === 'text') setQrMode(mode);
        setWelcomeMessage(map['WELCOME_MESSAGE']?.trim() ?? '');
        setSalonPolicy(map['SALON_POLICY']?.trim() ?? '');
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Client search filter (name or phone) applied to table rows & calendar blocks.
  const clientSearchQ = clientSearch.trim().toLowerCase();
  const matchesClientSearch = (a: Appointment): boolean => {
    if (clientSearchQ === '') return true;
    return (
      (a.client?.name ?? '').toLowerCase().includes(clientSearchQ) ||
      (a.client?.phone ?? '').toLowerCase().includes(clientSearchQ)
    );
  };
  const invoiceTargetPoints =
    invoiceTarget ? (clients.find((c) => c.id === invoiceTarget.clientId)?.loyaltyPoints ?? 0) : 0;
  const invRedeemNum = Number(invRedeem) || 0;
  const invRedeemValue = Math.min(invRedeemNum * pointValue, Number(invoiceTarget?.service?.price ?? 0));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [emps, clis, servs] = await Promise.all([
          listEmployees(),
          listClients(),
          listServices(),
        ]);
        if (active) {
          setEmployees(emps);
          setClients(clis.items);
          setServices(servs);
        }
      } catch {
        if (active) {
          showSnack(L.refsLoadFailed, 'error');
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const params: AppointmentListParams = { date: selectedDate.format('YYYY-MM-DD') };
        if (employeeFilter !== '') {
          params.employeeId = employeeFilter;
        }
        const data = await listAppointments(params);
        if (active) {
          setAppointments(data);
        }
      } catch {
        if (active) {
          showSnack(L.loadFailed, 'error');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, employeeFilter, refreshKey, lang]);

  const weekStart = selectedDate.startOf('day').day(0);
  const weekKey = weekStart.format('YYYY-MM-DD');
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')),
    [weekKey],
  );
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const params: AppointmentListParams = {
          from: weekKey,
          to: dayjs(weekKey).add(6, 'day').format('YYYY-MM-DD'),
        };
        if (employeeFilter !== '') {
          params.employeeId = employeeFilter;
        }
        const data = await listAppointments(params);
        if (active) {
          setWeekAppointments(data);
        }
      } catch {
        void 0;
      }
    })();
    return () => {
      active = false;
    };
  }, [weekKey, employeeFilter, refreshKey]);

  const weekCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const appointment of weekAppointments) {
      const key = dayjs(appointment.date).format('YYYY-MM-DD');
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [weekAppointments]);

  const BackIcon = lang === 'ar' ? ChevronRightIcon : ChevronLeftIcon;
  const ForwardIcon = lang === 'ar' ? ChevronLeftIcon : ChevronRightIcon;
  const selectedKey = selectedDate.format('YYYY-MM-DD');
  const todayKey = dayjs().format('YYYY-MM-DD');
  const goToToday = () => setSelectedDate(dayjs());
  const goPrevWeek = () => setSelectedDate(weekStart.subtract(7, 'day'));
  const goNextWeek = () => setSelectedDate(weekStart.add(7, 'day'));

  const nameOf = (obj?: { nameAr?: string; nameEn?: string } | null): string => {
    if (!obj) {
      return '';
    }
    return lang === 'ar' ? obj.nameAr || obj.nameEn || '' : obj.nameEn || obj.nameAr || '';
  };

  const handleStatusChange = async (appointment: Appointment, status: AppointmentStatus) => {
    if (status === 'CANCELLED') {
      setCancelFee('');
      setCancelTarget(appointment);
      return;
    }
    try {
      await changeAppointmentStatus(appointment.id, status);
      setRefreshKey((k) => k + 1);
      showSnack(L.updated, 'success');
    } catch (err) {
      showSnack((err as ApiError).message || L.saveFailed, 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await changeAppointmentStatus(
        cancelTarget.id,
        'CANCELLED',
        Number(cancelFee) > 0 ? Number(cancelFee) : undefined,
      );
      setCancelTarget(null);
      setRefreshKey((k) => k + 1);
      showSnack(L.updated, 'success');
    } catch (err) {
      showSnack((err as ApiError).message || L.saveFailed, 'error');
    }
  };

  // ---- Time helpers (calendar drag & drop) ----
  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const minutesToTime = (mins: number): string => {
    const clamped = Math.max(0, Math.min(mins, 23 * 60 + 45));
    return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
  };

  // Move an appointment block via drag & drop: new employee column and/or
  // new start time. `grabOffsetMin` compensates for where inside the block
  // the pointer grabbed it, so the block lands exactly under the cursor,
  // then the start snaps to a 15-minute grid. Duration is preserved.
  const handleDropOnSlot = async (
    appointmentId: number,
    employeeId: number,
    dropMinutes: number,
    grabOffsetMin: number,
  ) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment || !canManage) return;
    const duration =
      timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime);
    const snappedStart = Math.max(
      8 * 60,
      Math.min(Math.round((dropMinutes - grabOffsetMin) / 15) * 15, 24 * 60 - Math.max(duration, 15)),
    );
    const newStart = minutesToTime(snappedStart);
    const newEnd = minutesToTime(snappedStart + Math.max(duration, 15));
    setHoverSlot(null);
    setDropEmpId(null);
    if (appointment.employeeId === employeeId && appointment.startTime === newStart) return;
    try {
      await updateAppointment(appointment.id, {
        employeeId,
        date: dayjs(appointment.date).format('YYYY-MM-DD'),
        startTime: newStart,
        endTime: newEnd,
      });
      setRefreshKey((k) => k + 1);
      showSnack(L.updated, 'success');
    } catch (err) {
      showSnack((err as ApiError).message || L.saveFailed, 'error');
      setRefreshKey((k) => k + 1);
    }
  };

  // Open the invoice dialog (with optional loyalty redemption) for an appointment.
  const openInvoiceDialog = (appointment: Appointment) => {
    setInvoiceTarget(appointment);
    setInvRedeem('');
  };

  // Create an invoice from the appointment and open the thermal receipt.
  const handleInvoicePrint = async () => {
    if (!invoiceTarget) return;
    const appointment = invoiceTarget;
    const redeem = Number(invRedeem) || 0;
    if (redeem > invoiceTargetPoints) return;
    setInvBusy(true);
    try {
      const invoice: Invoice = await createInvoiceFromAppointment({
        appointmentId: appointment.id,
        discount: 0,
        tax: 0,
        paymentMethod: 'CASH',
        redeemPoints: redeem > 0 ? redeem : undefined,
      });
      await printThermalReceipt(invoice, { name: appointment.client?.name ?? `#${appointment.clientId}` });
      showSnack(L.invoicePrint, 'success');
      setInvoiceTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showSnack((err as ApiError).message || L.saveFailed, 'error');
    } finally {
      setInvBusy(false);
    }
  };

  // Full thermal tax invoice (same layout as the POS receipt) for an
  // appointment: barcode, ZATCA QR, totals, points discount, welcome & policy.
  const printThermalReceipt = async (
    invoice: Invoice,
    clientInfo: { name: string },
  ): Promise<void> => {
    const win = window.open('', '_blank', 'width=340,height=620');
    if (!win) return;
    const rows = (invoice.items ?? [])
      .map(
        (item) =>
          `<tr><td colspan="2" style="padding:2px 0">${item.description}</td></tr><tr><td style="padding:0 0 3px;color:#555">${item.quantity} × ${Number(item.unitPrice).toFixed(2)}</td><td style="text-align:right;padding:0 0 3px">${Number(item.lineTotal).toFixed(2)}</td></tr>`,
      )
      .join('');
    const barcode = barcodeSvgDataUrl(invoice.invoiceNo);
    const qrPayload = buildInvoiceQrPayload({
      sellerName: salonName || 'MIRA',
      vatNumber: vatNumber || ZATCA_VAT_NUMBER,
      timestamp: new Date(invoice.date).toISOString(),
      invoiceTotal: Number(invoice.total),
      vatAmount: Number(invoice.tax),
    });
    const qrImgUrl =
      qrMode === 'square' ? await generateQrImageDataUrl(qrPayload).catch(() => '') : '';
    const qrHtml =
      qrMode === 'square'
        ? `<img src="${qrImgUrl}" alt="QR" style="width:100px;height:100px;display:block;margin:4px auto" />`
        : `<div class="qr-block">${qrPayload}</div>`;
    win.document.write(`<!doctype html>
<html dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8" /><title>${invoice.invoiceNo}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  body { width: 80mm; margin: 0; padding: 3mm 4mm; font-family: 'Courier New', Tahoma, monospace; font-size: 11px; color: #000; }
  .center { text-align: center; }
  .brand { font-size: 16px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }
  .badge { display: inline-block; border: 1px solid #000; padding: 1px 8px; font-size: 9px; font-weight: bold; margin-top: 2px; }
  .muted { color: #333; font-size: 10px; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; }
  hr.solid { border: none; border-top: 1px solid #000; margin: 5px 0; }
  hr.dash { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; }
  .grand { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 3px double #000; border-bottom: 3px double #000; padding: 4px 0; margin: 4px 0; }
  .barcode { max-width: 90%; height: auto; }
  .qr-block { margin-top: 4px; padding: 4px; border: 1px dashed #000; font-family: 'Courier New', monospace; font-size: 7px; word-break: break-all; text-align: left; }
  .welcome { text-align: center; font-size: 11px; font-weight: bold; padding: 4px 0; }
  .policy { text-align: center; font-size: 8px; color: #333; white-space: pre-line; padding: 2px 4mm; }
</style></head>
<body>
  <div class="center">
    ${logoUrl ? `<img src="${logoUrl}" alt="logo" style="max-width:38mm;max-height:20mm;object-fit:contain;display:block;margin:0 auto 2mm" />` : ''}
    <div class="brand">${salonName}</div>
    <span class="badge">${lang === 'ar' ? 'فاتورة ضريبية مبسطة' : 'SIMPLIFIED TAX INVOICE'}</span>
    <div class="muted" style="margin-top:3px">${lang === 'ar' ? 'الرقم الضريبي' : 'VAT No.'}: ${vatNumber || ZATCA_VAT_NUMBER}</div>
  </div>
  <hr class="solid" />
  <div class="row"><span>${lang === 'ar' ? 'رقم الفاتورة' : 'Invoice No.'}:</span><span>${invoice.invoiceNo}</span></div>
  <div class="row"><span>${lang === 'ar' ? 'التاريخ' : 'Date'}:</span><span>${new Date(invoice.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span></div>
  <div class="row"><span>${L.client}:</span><span>${clientInfo.name}</span></div>
  ${invoice.employee ? `<div class="row"><span>${L.employee}:</span><span>${nameOf(invoice.employee)}</span></div>` : ''}
  <div class="center" style="margin:4px 0"><img class="barcode" src="${barcode}" alt="${invoice.invoiceNo}" /></div>
  <hr class="dash" />
  <table><tbody>${rows}</tbody></table>
  <hr class="dash" />
  <div class="row"><span>${lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
  ${Number(invoice.discount) > 0 ? `<div class="row"><span>${lang === 'ar' ? 'خصم النقاط' : 'Points discount'} (${invoice.pointsRedeemed ?? 0}):</span><span>-${Number(invoice.discount).toFixed(2)}</span></div>` : ''}
  <div class="row"><span>${lang === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'} (${vatRateDisplay}%):</span><span>${Number(invoice.tax).toFixed(2)}</span></div>
  <div class="grand"><span>${lang === 'ar' ? 'الإجمالي' : 'TOTAL'}:</span><span>${Number(invoice.total).toFixed(2)}</span></div>
  <div class="center">
    <strong style="font-size:10px">${lang === 'ar' ? 'رمز QR للفاتورة الإلكترونية' : 'E-invoice QR'}</strong>
    ${qrHtml}
  </div>
  ${welcomeMessage ? `<hr class="dash" /><div class="welcome">${welcomeMessage}</div>` : ''}
  ${salonPolicy ? `<div class="policy">${salonPolicy}</div>` : ''}
  <div class="center" style="margin-top:6px">*** ${lang === 'ar' ? 'شكراً لثقتكم' : 'THANK YOU'} ***</div>
  <button onclick="window.print()" style="display:block;margin:12px auto;padding:6px 24px;font-family:inherit">${lang === 'ar' ? 'طباعة' : 'Print'}</button>
</body></html>`);
    win.document.close();
  };

  // Deposit payment to confirm the appointment (transfer or card network).
  const openPayDialog = (appointment: Appointment) => {
    setPayTarget(appointment);
    setPayAmount(Number(appointment.service?.price ?? 0).toFixed(2));
    setPayMethod('TRANSFER');
  };

  const handleConfirmPay = async () => {
    if (!payTarget) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setPaySaving(true);
    try {
      await createPayment({
        appointmentId: payTarget.id,
        amount,
        method: payMethod,
      });
      setPayTarget(null);
      setRefreshKey((k) => k + 1);
      showSnack(L.confirmedPaid, 'success');
    } catch (err) {
      showSnack((err as ApiError).message || L.saveFailed, 'error');
    } finally {
      setPaySaving(false);
    }
  };

  const handleDelete = async (appointment: Appointment) => {
    try {
      await deleteAppointment(appointment.id);
      setRefreshKey((k) => k + 1);
      showSnack(L.deleted, 'success');
    } catch (err) {
      showSnack((err as ApiError).message || L.deleteFailed, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRemind = async (appointment: Appointment) => {
    try {
      const result = await sendAppointmentReminder(appointment.id);
      showSnack(result.simulated ? L.reminderSimulated : L.reminderSent, 'success');
    } catch (err) {
      showSnack((err as ApiError).message || L.reminderFailed, 'error');
    }
  };

  const handleDialogSaved = (message: string) => {
    setDialog({ open: false, mode: 'create', appointment: null });
    setRefreshKey((k) => k + 1);
    showSnack(message, 'success');
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <PageHeader title={L.pageTitle} gutterBottom={false} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder={L.searchClients}
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 230 } }}
          />
          <DatePicker
            label={L.date}
            value={selectedDate}
            onChange={(value: Dayjs | null) => {
              if (value) {
                setSelectedDate(value);
              }
            }}
            slotProps={{ textField: { size: 'small' } }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
            {toHijri(selectedDate.toDate()) ?? ''}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="filter-employee-label">{L.employee}</InputLabel>
            <Select<number | ''>
              labelId="filter-employee-label"
              label={L.employee}
              value={employeeFilter}
              onChange={(e: SelectChangeEvent<number | ''>) =>
                setEmployeeFilter(e.target.value as number | '')
              }
            >
              <MenuItem value="">
                <em>{L.allEmployees}</em>
              </MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {nameOf(emp)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            aria-label="refresh"
            onClick={() => setRefreshKey((k) => k + 1)}
            title={L.loading}
          >
            <RefreshIcon />
          </IconButton>
          {canManage && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setDialog({ open: true, mode: 'create', appointment: null })}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {L.newAppointment}
            </Button>
          )}
          <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
            <Tooltip title={L.calendarView}>
              <IconButton
                onClick={() => setViewMode('calendar')}
                color={viewMode === 'calendar' ? 'primary' : 'default'}
              >
                <CalendarMonthIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={L.tableView}>
              <IconButton
                onClick={() => setViewMode('table')}
                color={viewMode === 'table' ? 'primary' : 'default'}
              >
                <TableRowsIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      <Box sx={{ overflowX: 'auto', mb: 3 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: 'max-content', margin: '0 auto', py: 0.5 }}
        >
          <IconButton
            aria-label={t('calendar.previousWeek')}
            title={t('calendar.previousWeek')}
            size="small"
            onClick={goPrevWeek}
          >
            <BackIcon />
          </IconButton>
          {weekDays.map((day) => {
            const dateKey = day.format('YYYY-MM-DD');
            const isSelected = dateKey === selectedKey;
            const isToday = dateKey === todayKey;
            const count = weekCounts[dateKey] ?? 0;
            return (
              <Button
                key={dateKey}
                onClick={() => setSelectedDate(day)}
                variant={isSelected ? 'contained' : 'outlined'}
                color={isSelected ? 'primary' : isToday ? 'secondary' : 'inherit'}
                sx={{
                  flexShrink: 0,
                  minWidth: 54,
                  px: 1.25,
                  py: 0.75,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.25,
                  borderRadius: 2,
                }}
              >
                <Typography variant="caption" sx={{ lineHeight: 1.2, fontSize: 11, fontWeight: 500 }}>
                  {t(`calendar.days.${day.day()}`)}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.3, fontWeight: 700 }}>
                  {day.format('D')}
                </Typography>
                <Box
                  sx={{
                    minWidth: 16,
                    minHeight: 15,
                    borderRadius: 8,
                    px: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    lineHeight: 1,
                    color:
                      count > 0
                        ? isSelected
                          ? 'primary.main'
                          : 'primary.contrastText'
                        : 'transparent',
                    bgcolor:
                      count > 0
                        ? isSelected
                          ? 'primary.contrastText'
                          : 'secondary.main'
                        : 'transparent',
                  }}
                >
                  {count > 0 ? count : '·'}
                </Box>
              </Button>
            );
          })}
          <IconButton
            aria-label={t('calendar.nextWeek')}
            title={t('calendar.nextWeek')}
            size="small"
            onClick={goNextWeek}
          >
            <ForwardIcon />
          </IconButton>
          <Button size="small" startIcon={<TodayIcon />} onClick={goToToday} sx={{ ml: 1 }}>
            {t('calendar.today')}
          </Button>
        </Stack>
      </Box>

      {viewMode === 'calendar' && (
        <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, display: 'block' }}>
            {canManage ? L.dragHint : ''}
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ width: 'max-content', minWidth: '100%' }}>
              {/* Header row: employee columns */}
              <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
                <Box
                  sx={{
                    width: 64,
                    flexShrink: 0,
                    p: 1,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'text.secondary',
                  }}
                >
                  {L.time}
                </Box>
                {(employeeFilter === '' ? employees : employees.filter((e) => e.id === employeeFilter)).map(
                  (emp) => (
                    <Box
                      key={emp.id}
                      sx={{
                        width: 180,
                        flexShrink: 0,
                        p: 1,
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: 13,
                        borderInlineStart: 1,
                        borderColor: 'divider',
                      }}
                    >
                      {nameOf(emp)}
                    </Box>
                  ),
                )}
              </Box>
              {/* Time grid */}
              <Box sx={{ display: 'flex', position: 'relative' }}>
                {/* Time axis */}
                <Box sx={{ width: 64, flexShrink: 0 }}>
                  {Array.from({ length: 16 }, (_, i) => 8 + i).map((hour) => (
                    <Box
                      key={hour}
                      sx={{
                        height: 56,
                        borderTop: 1,
                        borderColor: 'divider',
                        px: 1,
                        pt: 0.25,
                        fontSize: 11,
                        color: 'text.secondary',
                      }}
                    >
                      {String(hour).padStart(2, '0')}:00
                    </Box>
                  ))}
                </Box>
                {(employeeFilter === '' ? employees : employees.filter((e) => e.id === employeeFilter)).map(
                  (emp) => {
                    const empAppointments = appointments.filter(
                      (a) =>
                        a.employeeId === emp.id &&
                        a.status !== 'CANCELLED' &&
                        matchesClientSearch(a),
                    );
                    return (
                      <Box
                        key={emp.id}
                        sx={{
                          width: 180,
                          flexShrink: 0,
                          position: 'relative',
                          borderInlineStart: 1,
                          borderColor: 'divider',
                          bgcolor: (dropEmpId === emp.id) ? 'action.hover' : 'transparent',
                        }}
                        onDragOver={(e) => {
                          if (!canManage || !dragInfoRef.current) return;
                          e.preventDefault();
                          setDropEmpId(emp.id);
                          const rect = e.currentTarget.getBoundingClientRect();
                          const dropMin = ((e.clientY - rect.top) / 56) * 60 + 8 * 60;
                          const { grabMin } = dragInfoRef.current;
                          const snapped = Math.round((dropMin - grabMin) / 15) * 15;
                          setHoverSlot({ empId: emp.id, startMin: snapped });
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!canManage || !dragInfoRef.current) {
                            setDropEmpId(null);
                            setHoverSlot(null);
                            return;
                          }
                          const { id, grabMin } = dragInfoRef.current;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const minutes = ((e.clientY - rect.top) / 56) * 60 + 8 * 60;
                          void handleDropOnSlot(id, emp.id, minutes, grabMin);
                        }}
                      >
                        {Array.from({ length: 16 }, (_, i) => (
                          <Box
                            key={i}
                            sx={{
                              height: 56,
                              borderTop: i > 0 ? 1 : 0,
                              borderColor: 'divider',
                              '&:nth-of-type(odd)': { bgcolor: 'action.hover', opacity: 0.4 },
                            }}
                          />
                        ))}
                        {hoverSlot && hoverSlot.empId === emp.id && dragInfoRef.current && (
                          <Box
                            sx={{
                              position: 'absolute',
                              insetInlineStart: 4,
                              insetInlineEnd: 4,
                              top:
                                ((hoverSlot.startMin - 8 * 60) / 60) * 56,
                              height: Math.max(
                                (dragInfoRef.current.durationMin / 60) * 56 - 2,
                                24,
                              ),
                              borderRadius: 1.5,
                              border: '2px dashed',
                              borderColor: 'primary.main',
                              bgcolor: 'primary.main',
                              opacity: 0.25,
                              pointerEvents: 'none',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, color: 'primary.contrastText', pt: 0.25 }}
                            >
                              {minutesToTime(hoverSlot.startMin)}
                            </Typography>
                          </Box>
                        )}
                        {empAppointments.map((a) => {
                          // Strictly proportional to the stored time window,
                          // clamped to the visible day grid (08:00–24:00).
                          const DAY_START = 8 * 60;
                          const DAY_END = 24 * 60;
                          const startMin = timeToMinutes(a.startTime);
                          const endMin = timeToMinutes(a.endTime);
                          const clampedStart = Math.max(startMin, DAY_START);
                          const clampedEnd = Math.min(
                            Math.max(endMin, clampedStart + 20),
                            DAY_END,
                          );
                          const top = ((clampedStart - DAY_START) / 60) * 56;
                          const height = Math.max(((clampedEnd - clampedStart) / 60) * 56 - 2, 22);
                          const isPaid = (a.payments ?? []).length > 0;
                          return (
                            <Tooltip
                              key={a.id}
                              title={`${a.client?.name ?? ''} — ${nameOf(a.service)} ${a.startTime}-${a.endTime}`}
                            >
                              <Box
                                draggable={canManage}
                                onDragStart={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const duration =
                                    timeToMinutes(a.endTime) - timeToMinutes(a.startTime);
                                  dragInfoRef.current = {
                                    id: a.id,
                                    grabMin:
                                      ((e.clientY - rect.top) / Math.max(rect.height, 1)) *
                                      Math.max(duration, 15),
                                    durationMin: Math.max(duration, 15),
                                  };
                                  e.dataTransfer.setData('text/plain', String(a.id));
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => {
                                  lastDragEndRef.current = Date.now();
                                  dragInfoRef.current = null;
                                  setHoverSlot(null);
                                  setDropEmpId(null);
                                }}
                                onClick={() => {
                                  // Ignore the click that fires right after a drag ends.
                                  if (Date.now() - lastDragEndRef.current < 250) return;
                                  setDialog({ open: true, mode: 'edit', appointment: a });
                                }}
                                sx={{
                                  position: 'absolute',
                                  insetInlineStart: 3,
                                  insetInlineEnd: 3,
                                  top,
                                  height,
                                  overflow: 'hidden',
                                  borderRadius: 2,
                                  px: 0.75,
                                  py: 0.5,
                                  cursor: canManage ? 'grab' : 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  gap: 0.25,
                                  bgcolor:
                                    a.status === 'DONE'
                                      ? 'success.main'
                                      : a.status === 'CONFIRMED' || isPaid
                                        ? 'info.main'
                                        : 'primary.main',
                                  color: '#fff',
                                  border: isPaid ? '2px solid #fff' : '1px solid rgba(0,0,0,0.18)',
                                  boxShadow: 3,
                                  '&:hover': { filter: 'brightness(1.1)', zIndex: 5 },
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 800,
                                    lineHeight: 1.15,
                                    fontSize: 12,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                  }}
                                  noWrap
                                >
                                  {a.startTime} {a.client?.name ?? `#${a.clientId}`}
                                </Typography>
                                {height > 40 && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 700,
                                      lineHeight: 1.15,
                                      fontSize: 11,
                                      opacity: 0.95,
                                      textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                    }}
                                    noWrap
                                  >
                                    {nameOf(a.service)}
                                    {isPaid ? ' ✓' : ''}
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    );
                  },
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {viewMode === 'table' && (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{L.time}</TableCell>
              <TableCell>{L.client}</TableCell>
              <TableCell>{L.employee}</TableCell>
              <TableCell>{L.service}</TableCell>
              <TableCell align="right">{L.price}</TableCell>
              <TableCell>{L.status}</TableCell>
              <TableCell>{L.notes}</TableCell>
              <TableCell align="right">{L.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{L.noAppointments}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              appointments.filter(matchesClientSearch).map((appointment) => (
                <TableRow key={appointment.id} hover>
                  <TableCell>
                    {appointment.startTime} – {appointment.endTime}
                  </TableCell>
                  <TableCell>{appointment.client?.name ?? `#${appointment.clientId}`}</TableCell>
                  <TableCell>{nameOf(appointment.employee)}</TableCell>
                  <TableCell>{nameOf(appointment.service)}</TableCell>
                  <TableCell align="right">
                    {Number(appointment.service?.price ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {(appointment.payments ?? []).length > 0 && (
                        <Tooltip
                          title={`${L.confirmedPaid} (${appointment.payments!.map((p) => Number(p.amount).toFixed(2)).join(', ')})`}
                        >
                          <Chip label="✓" size="small" color="success" sx={{ fontWeight: 700 }} />
                        </Tooltip>
                      )}
                      <Chip
                        label={L.statuses[appointment.status]}
                        color={statusColor[appointment.status]}
                        size="small"
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {appointment.notes?.includes('[حجز أونلاين]') ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip label="حجز أونلاين" size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                        <Typography variant="body2">{appointment.notes.replace('[حجز أونلاين]', '').trim()}</Typography>
                      </Stack>
                    ) : (
                      appointment.notes || '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {appointment.client?.phone && (
                        <Tooltip title={L.remind}>
                          <IconButton
                            size="small"
                            onClick={() => void handleRemind(appointment)}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canManage && appointment.status === 'BOOKED' && (
                        <Tooltip title={L.payConfirm}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => openPayDialog(appointment)}
                          >
                            <PaidIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canManage && (
                        <Tooltip title={L.invoicePrint}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => openInvoiceDialog(appointment)}
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {canManage && (
                        <FormControl size="small" sx={{ minWidth: 110 }}>
                          <Select<AppointmentStatus>
                            value={appointment.status}
                            size="small"
                            onChange={(e) =>
                void handleStatusChange(appointment, e.target.value as AppointmentStatus)
              }
                          >
                            {ALL_STATUSES.map((status) => (
                              <MenuItem key={status} value={status}>
                                {L.statuses[status]}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                      {canManage && (
                        <IconButton
                          size="small"
                          title={L.edit}
                          onClick={() =>
                            setDialog({
                              open: true,
                              mode: 'edit',
                              appointment,
                            })
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canManage && (
                        <IconButton
                          size="small"
                          title={L.delete}
                          color="error"
                          onClick={() => setDeleteTarget(appointment)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {/* Appointment invoice dialog with loyalty redemption */}
      <Dialog
        open={!!invoiceTarget}
        onClose={() => setInvoiceTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{L.invoiceFor}</DialogTitle>
        <DialogContent>
          {invoiceTarget && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {invoiceTarget.client?.name} — {nameOf(invoiceTarget.service)} (
                {invoiceTarget.startTime}–{invoiceTarget.endTime})
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap',
                }}
              >
                <StarIcon />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" fontWeight={800}>
                    {invoiceTargetPoints} {L.pointsUnit}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    {L.loyaltyBalance} — {L.worthValue}{' '}
                    {(invoiceTargetPoints * pointValue).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
              {invoiceTargetPoints > 0 && (
                <>
                  <TextField
                    label={L.redeemNow}
                    type="number"
                    value={invRedeem}
                    onChange={(e) => setInvRedeem(e.target.value)}
                    inputProps={{ min: 0, max: invoiceTargetPoints, step: 1 }}
                    helperText={
                      invRedeemNum > 0
                        ? `= ${invRedeemValue.toFixed(2)} ${L.redeemValueHint}`
                        : undefined
                    }
                    error={invRedeemNum > invoiceTargetPoints}
                    fullWidth
                  />
                  <Stack direction="row" spacing={0.75} flexWrap="wrap">
                    {[25, 50, 100]
                      .filter((n) => n <= invoiceTargetPoints)
                      .map((n) => (
                        <Chip
                          key={n}
                          label={`${L.usePoints} ${n}`}
                          onClick={() => setInvRedeem(String(n))}
                          size="small"
                          variant={invRedeemNum === n ? 'filled' : 'outlined'}
                          color={invRedeemNum === n ? 'primary' : 'default'}
                        />
                      ))}
                    <Chip
                      label={L.useAllPoints}
                      onClick={() => setInvRedeem(String(invoiceTargetPoints))}
                      size="small"
                      variant={invRedeemNum === invoiceTargetPoints ? 'filled' : 'outlined'}
                      color={invRedeemNum === invoiceTargetPoints ? 'primary' : 'default'}
                    />
                  </Stack>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceTarget(null)}>{L.cancel}</Button>
          <Button
            onClick={() => {
              setInvRedeem('');
              void handleInvoicePrint();
            }}
            disabled={invBusy}
          >
            {L.noRedeem}
          </Button>
          <Button
            variant="contained"
            startIcon={invBusy ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />}
            disabled={
              invBusy || invRedeemNum > invoiceTargetPoints || !(Number(invRedeem) >= 0)
            }
            onClick={() => void handleInvoicePrint()}
          >
            {L.createPrint}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deposit confirmation dialog (transfer / card network) */}
      <Dialog open={!!payTarget} onClose={() => setPayTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{L.payConfirm}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {payTarget && (
              <Typography variant="body2" color="text.secondary">
                {payTarget.client?.name} — {nameOf(payTarget.service)} ({payTarget.startTime})
              </Typography>
            )}
            <TextField
              label={L.payAmount}
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              inputProps={{ min: 0, step: '0.01' }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="pay-method-label">{L.payMethod}</InputLabel>
              <Select<'TRANSFER' | 'CARD'>
                labelId="pay-method-label"
                label={L.payMethod}
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as 'TRANSFER' | 'CARD')}
              >
                <MenuItem value="TRANSFER">{L.transfer}</MenuItem>
                <MenuItem value="CARD">{L.networkPay}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayTarget(null)}>{L.cancel}</Button>
          <Button
            variant="contained"
            startIcon={paySaving ? <CircularProgress size={18} color="inherit" /> : <PaidIcon />}
            disabled={paySaving || !(Number(payAmount) > 0)}
            onClick={() => void handleConfirmPay()}
          >
            {L.confirmedPaid}
          </Button>
        </DialogActions>
      </Dialog>

      <AppointmentDialog
        open={dialog.open}
        mode={dialog.mode}
        appointment={dialog.appointment}
        defaultDate={selectedDate}
        clients={clients}
        employees={employees}
        services={services}
        lang={lang}
        L={L}
        pointValue={pointValue}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSaved={handleDialogSaved}
        onItemSaved={(msg) => {
          setRefreshKey((k) => k + 1);
          showSnack(msg, 'success');
        }}
      />

      <Dialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{L.cancelTitle}</DialogTitle>
        <DialogContent>
          <TextField
            label={L.cancelFee}
            type="number"
            value={cancelFee}
            onChange={(e) => setCancelFee(e.target.value)}
            inputProps={{ min: 0, step: '0.01' }}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)}>{L.cancel}</Button>
          <Button color="error" variant="contained" onClick={() => void handleConfirmCancel()}>
            {L.cancelConfirm}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{L.delete}</DialogTitle>
        <DialogContent>
          <Alert severity="warning">{L.deleteConfirm}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{L.cancel}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteTarget && void handleDelete(deleteTarget)}
          >
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
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}