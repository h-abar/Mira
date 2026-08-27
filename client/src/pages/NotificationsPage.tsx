import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import {
  listNotifications,
  retryNotification,
  getNotificationSchedule,
  type NotificationItem,
  type NotificationStatus,
  type ReminderScheduleStatus,
} from '../api/notifications';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'لوحة الإشعارات',
    filterAll: 'الكل',
    filterSent: 'تم الإرسال',
    filterFailed: 'فشل الإرسال',
    filterPending: 'قيد الانتظار',
    filterType: 'النوع',
    colType: 'النوع',
    colTarget: 'الرقم',
    colMessage: 'الرسالة',
    colStatus: 'الحالة',
    colDate: 'التاريخ',
    colReference: 'المرجع',
    retry: 'إعادة إرسال',
    retried: 'تمت إعادة إرسال الرسالة بنجاح',
    retryFailed: 'فشلت إعادة الإرسال',
    scheduleTitle: 'حالة جدولة التذكيرات',
    scheduleEnabled: 'مفعّلة',
    scheduleDisabled: 'معطّلة',
    scheduleCron: 'جدولة Cron',
    scheduleHoursBefore: 'قبل الموعد بـ',
    scheduleLastRun: 'آخر تشغيل',
    scheduleSent: 'تم الإرسال',
    scheduleFailed: 'فشل',
    neverRun: 'لم يعمل بعد',
    loading: 'جارٍ التحميل...',
    error: 'حدث خطأ',
    hoursUnit: 'ساعة',
    refresh: 'تحديث',
  },
  en: {
    title: 'Notifications Inbox',
    filterAll: 'All',
    filterSent: 'Sent',
    filterFailed: 'Failed',
    filterPending: 'Pending',
    filterType: 'Type',
    colType: 'Type',
    colTarget: 'Target',
    colMessage: 'Message',
    colStatus: 'Status',
    colDate: 'Date',
    colReference: 'Reference',
    retry: 'Retry',
    retried: 'Message resent successfully',
    retryFailed: 'Retry failed',
    scheduleTitle: 'Reminder Scheduler Status',
    scheduleEnabled: 'Enabled',
    scheduleDisabled: 'Disabled',
    scheduleCron: 'Cron',
    scheduleHoursBefore: 'Hours before',
    scheduleLastRun: 'Last run',
    scheduleSent: 'Sent',
    scheduleFailed: 'Failed',
    neverRun: 'Never run',
    loading: 'Loading...',
    error: 'Something went wrong',
    hoursUnit: 'hrs',
    refresh: 'Refresh',
  },
} as const;

const statusLabel = (lang: 'ar' | 'en', status: NotificationStatus): string => {
  const l = L[lang];
  return status === 'SENT' ? l.filterSent : status === 'FAILED' ? l.filterFailed : l.filterPending;
};

const statusMeta: Record<
  NotificationStatus,
  { color: 'success' | 'error' | 'default' }
> = {
  SENT: { color: 'success' },
  FAILED: { color: 'error' },
  PENDING: { color: 'default' },
};

export default function NotificationsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const canManage = useAuthStore((s) => s.hasPermission('notifications'));

  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'' | NotificationStatus>('');
  const [type, setType] = useState('');
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ReminderScheduleStatus | null>(null);
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications({
        page: page + 1,
        limit: pageSize,
        status: status || undefined,
        type: type || undefined,
      });
      setRows(res.items);
      setTotal(res.total);
      setTypeOptions((prev) => {
        const next = new Set([...prev, ...res.items.map((item) => item.type)]);
        return [...next].sort();
      });
    } catch (err) {
      setSnack({
        open: true,
        message: (err as ApiError).message || l.error,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, type, l.error]);

  const loadSchedule = useCallback(async () => {
    try {
      const res = await getNotificationSchedule();
      setSchedule(res);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const handleRetry = async (row: NotificationItem) => {
    try {
      await retryNotification(row.id);
      setSnack({ open: true, message: l.retried, severity: 'success' });
      void load();
    } catch (err) {
      setSnack({
        open: true,
        message: (err as ApiError).message || l.retryFailed,
        severity: 'error',
      });
    }
  };

  const formatDate = (value: string): string => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const columns: GridColDef<NotificationItem>[] = [
    { field: 'type', headerName: l.colType, width: 140, renderCell: ({ row }) => <Chip label={row.type} size="small" variant="outlined" /> },
    { field: 'target', headerName: l.colTarget, width: 130 },
    {
      field: 'message',
      headerName: l.colMessage,
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.message}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: l.colStatus,
      width: 120,
      renderCell: ({ row }) => (
        <Chip label={statusLabel(lang, row.status)} color={statusMeta[row.status].color} size="small" />
      ),
    },
    { field: 'createdAt', headerName: l.colDate, width: 170, renderCell: ({ row }) => formatDate(row.createdAt) },
    { field: 'referenceId', headerName: l.colReference, width: 180, renderCell: ({ row }) => (row.referenceId ? row.referenceId : '—') },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as NotificationItem;
        if (row.status !== 'FAILED') return null;
        return (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<ReplayIcon fontSize="small" />}
            disabled={!canManage}
            onClick={() => void handleRetry(row)}
          >
            {l.retry}
          </Button>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader title={l.title} />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          {l.scheduleTitle}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Chip
            label={schedule?.enabled ? l.scheduleEnabled : l.scheduleDisabled}
            color={schedule?.enabled ? 'success' : 'default'}
          />
          <Chip label={`${l.scheduleCron}: ${schedule?.cronExpression ?? '—'}`} />
          <Chip label={`${l.scheduleHoursBefore}: ${schedule?.hoursBefore ?? '—'} ${l.hoursUnit}`} />
          <Chip label={`${l.scheduleLastRun}: ${schedule?.lastRunAt ? formatDate(schedule.lastRunAt) : l.neverRun}`} />
          <Chip label={`${l.scheduleSent}: ${schedule?.lastRunSent ?? 0}`} color="success" />
          <Chip label={`${l.scheduleFailed}: ${schedule?.lastRunFailed ?? 0}`} color="error" />
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="notification-status-label">{l.filterAll}</InputLabel>
          <Select
            labelId="notification-status-label"
            label={l.filterAll}
            value={status}
            onChange={(e) => {
              setPage(0);
              setStatus(e.target.value as '' | NotificationStatus);
            }}
          >
            <MenuItem value="">
              <em>{l.filterAll}</em>
            </MenuItem>
            <MenuItem value="SENT">{l.filterSent}</MenuItem>
            <MenuItem value="FAILED">{l.filterFailed}</MenuItem>
            <MenuItem value="PENDING">{l.filterPending}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="notification-type-label">{l.filterType}</InputLabel>
          <Select
            labelId="notification-type-label"
            label={l.filterType}
            value={type}
            onChange={(e) => {
              setPage(0);
              setType(e.target.value as string);
            }}
          >
            <MenuItem value="">
              <em>{l.filterAll}</em>
            </MenuItem>
            {typeOptions.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void load()}>
          {l.refresh}
        </Button>
      </Stack>

      <Box sx={{ width: '100%' }}>
        <DataGrid<NotificationItem>
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 20, 50]}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          sx={{ minHeight: 360 }}
        />
      </Box>

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