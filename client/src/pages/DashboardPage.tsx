import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentsIcon from '@mui/icons-material/Payments';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PercentIcon from '@mui/icons-material/Percent';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { getSummary } from '../api/accounting';
import { listAppointments, type Appointment, type AppointmentStatus } from '../api/appointments';
import { getDashboardAnalytics } from '../api/reports';
import { useAuthStore } from '../stores/authStore';
import { toHijri } from '../utils/hijri';
import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import { useSettings, useUpdateSettings } from '../api/settingsHooks';
const labels = {
  ar: {
    todayOverview: 'ملخص اليوم',
    revenue: 'الإيرادات',
    expenses: 'المصروفات',
    profit: 'الأرباح',
    commissions: 'العمولات',
    invoices: 'الفواتير',
    doneAppointments: 'مواعيد منجزة',
    todayAppointments: 'مواعيد اليوم',
    time: 'الوقت',
    client: 'العميلة',
    employee: 'الموظفة',
    service: 'الخدمة',
    status: 'الحالة',
    empty: 'لا توجد مواعيد اليوم',
    loadError: 'تعذر تحميل البيانات',
    analytics: 'تحليلات الأسبوع',
    revenueTrend: 'الإيرادات (آخر 7 أيام)',
    topServices: 'أعلى الخدمات طلباً',
    lowStock: 'تنبيهات المخزون',
    activeMemberships: 'عضويات نشطة',
    totalClients: 'إجمالي العميلات',
    hijriToday: 'التاريخ الهجري اليوم',
    lowStockEmpty: 'لا توجد أصناف منخفضة',
    noData: 'لا توجد بيانات',
    quickActions: 'إجراءات سريعة',
    newClient: 'عميلة جديدة',
    newAppointment: 'موعد جديد',
    newInvoice: 'فاتورة سريعة',
    salonIdentity: 'هوية الصالون',
    salonIdentityNote: 'عدّل اسم الصالون وساعات العمل ونسبة الضريبة من هنا — تُستخدم في الفواتير والإيصالات والتقارير والإشعارات والموقع.',
    salonNameAr: 'اسم الصالون (عربي)',
    salonNameEn: 'اسم الصالون (إنجليزي)',
    workingHours: 'ساعات العمل',
    openingTime: 'بداية',
    closingTime: 'نهاية',
    closed: 'مغلق',
    copyToAll: 'نسخ ساعات هذا اليوم لجميع الأيام',
    vatRateLabel: 'نسبة الضريبة VAT %',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    identitySaved: 'تم حفظ اسم الصالون بنجاح',
    identityFailed: 'تعذر حفظ الإعدادات',
    identityLoadFailed: 'تعذر تحميل إعدادات الصالون',
  },
  en: {
    todayOverview: 'Today Overview',
    revenue: 'Revenue',
    expenses: 'Expenses',
    profit: 'Profit',
    commissions: 'Commissions',
    invoices: 'Invoices',
    doneAppointments: 'Done Appointments',
    todayAppointments: "Today's Appointments",
    time: 'Time',
    client: 'Client',
    employee: 'Employee',
    service: 'Service',
    status: 'Status',
    empty: 'No appointments today',
    loadError: 'Failed to load data',
    analytics: 'Weekly Analytics',
    revenueTrend: 'Revenue (last 7 days)',
    topServices: 'Top Services',
    lowStock: 'Low Stock Alerts',
    activeMemberships: 'Active Memberships',
    totalClients: 'Total Clients',
    hijriToday: "Today's Hijri Date",
    lowStockEmpty: 'No low stock items',
    noData: 'No data',
    quickActions: 'Quick Actions',
    newClient: 'New Client',
    newAppointment: 'New Appointment',
    newInvoice: 'Quick Invoice',
    salonIdentity: 'Salon Identity',
    salonIdentityNote: 'Edit your salon name, working hours and VAT rate here — used in invoices, receipts, reports, notifications and the website.',
    salonNameAr: 'Salon Name (Arabic)',
    salonNameEn: 'Salon Name (English)',
    workingHours: 'Working Hours',
    openingTime: 'Opening',
    closingTime: 'Closing',
    closed: 'Closed',
    copyToAll: 'Copy this day to all days',
    vatRateLabel: 'VAT Rate %',
    save: 'Save',
    saving: 'Saving...',
    identitySaved: 'Salon settings saved',
    identityFailed: 'Failed to save settings',
    identityLoadFailed: 'Could not load salon settings',
  },
};

const statusChips: Record<AppointmentStatus, { color: 'success' | 'info' | 'default' | 'error'; ar: string; en: string }> = {
  BOOKED: { color: 'info', ar: 'محجوز', en: 'Booked' },
  CONFIRMED: { color: 'default', ar: 'مؤكد', en: 'Confirmed' },
  ARRIVED: { color: 'info', ar: 'حاضرة', en: 'Arrived' },
  DONE: { color: 'success', ar: 'منجز', en: 'Done' },
  CANCELLED: { color: 'error', ar: 'ملغي', en: 'Cancelled' },
};

const fmt = (value: string | number): string =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const t = labels[lang];
  const nameOf = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const today = dayjs().format('YYYY-MM-DD');
  const hijriToday = toHijri(new Date());

  const canReadAccounting = useAuthStore((s) => s.hasPermission('accounting.read'));
  const canReadAppointments = useAuthStore((s) => s.hasPermission('appointments.read'));
  const canReadReports = useAuthStore((s) => s.hasPermission('reports.read'));
  const canWriteAppointments = useAuthStore((s) => s.hasPermission('appointments.write'));
  const canWriteClients = useAuthStore((s) => s.hasPermission('clients.write'));
  const canPos = useAuthStore((s) => s.hasPermission('pos') || s.hasPermission('accounting.write'));
  const canEditSettings = useAuthStore((s) => s.hasPermission('settings'));

  const [salonAr, setSalonAr] = useState('');
  const [salonEn, setSalonEn] = useState('');
  const [vatRate, setVatRate] = useState('');
  const [seeded, setSeeded] = useState(false);
  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityMsg, setIdentityMsg] = useState<string | null>(null);
  const [identityErr, setIdentityErr] = useState(false);

  const settingsQuery = useSettings();
  const updateMutation = useUpdateSettings();

  useEffect(() => {
    if (!canEditSettings) return;
    if (settingsQuery.data && !seeded) {
      setSalonAr(settingsQuery.data.byKey['SALON_NAME_AR'] ?? '');
      setSalonEn(settingsQuery.data.byKey['SALON_NAME_EN'] ?? '');
      setVatRate(settingsQuery.data.byKey['VAT_RATE'] ?? '');
      setSeeded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsQuery.data, canEditSettings, seeded]);

  const saveIdentity = async () => {
    setIdentitySaving(true);
    setIdentityErr(false);
    try {
      await updateMutation.mutateAsync({
        SALON_NAME_AR: salonAr.trim(),
        SALON_NAME_EN: salonEn.trim(),
        VAT_RATE: vatRate,
      });
      setIdentityMsg(t.identitySaved);
    } catch {
      setIdentityMsg(t.identityFailed);
      setIdentityErr(true);
    } finally {
      setIdentitySaving(false);
    }
  };

  const summaryQuery = useQuery({
    queryKey: ['summary', today],
    queryFn: () => getSummary(today),
    enabled: canReadAccounting,
  });
  const appointmentsQuery = useQuery({
    queryKey: ['appointments', today],
    queryFn: () => listAppointments({ date: today }),
    enabled: canReadAppointments,
  });
  const analyticsQuery = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => getDashboardAnalytics(),
    enabled: canReadReports,
  });

  const summary = summaryQuery.data;
  const appointments = appointmentsQuery.data;
  const analytics = analyticsQuery.data;
  const loading = summaryQuery.isLoading || appointmentsQuery.isLoading || (canReadReports && analyticsQuery.isLoading);
  const error = summaryQuery.error ?? appointmentsQuery.error ?? analyticsQuery.error;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    { label: t.revenue, value: summary ? fmt(summary.revenue) : '0', icon: <PaymentsIcon />, gradient: 'linear-gradient(135deg,#43a047,#2e7d32)', caption: t.invoices ? `${summary ? String(summary.invoicesCount) : '0'} ${t.invoices}` : undefined },
    { label: t.expenses, value: summary ? fmt(summary.expenses) : '0', icon: <MoneyOffIcon />, gradient: 'linear-gradient(135deg,#ef5350,#c62828)' },
    { label: t.profit, value: summary ? fmt(summary.profit) : '0', icon: <TrendingUpIcon />, gradient: 'linear-gradient(135deg,#c2185b,#880e4f)' },
    { label: t.commissions, value: summary ? fmt(summary.commissions) : '0', icon: <PercentIcon />, gradient: 'linear-gradient(135deg,#ff9800,#ed6c02)' },
    { label: t.invoices, value: summary ? String(summary.invoicesCount) : '0', icon: <ReceiptLongIcon />, gradient: 'linear-gradient(135deg,#0288d1,#01579b)' },
    { label: t.doneAppointments, value: summary ? String(summary.doneAppointments) : '0', icon: <EventAvailableIcon />, gradient: 'linear-gradient(135deg,#9c27b0,#7b1fa2)' },
  ];

  const maxRevenue = Math.max(1, ...(analytics?.revenueByDay.map((p) => p.revenue) ?? []));
  const maxTop = Math.max(
    1,
    ...(analytics?.topServices.map((s) => Number(s.revenue) ?? 0) ?? []),
  );

  return (
    <Box>
      <PageHeader title={t.todayOverview} />
      {hijriToday && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t.hijriToday}: {hijriToday}
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t.loadError}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap">
        {canWriteClients && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/clients')}
          >
            {t.newClient}
          </Button>
        )}
        {canWriteAppointments && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CalendarMonthIcon />}
            onClick={() => navigate('/admin/appointments')}
          >
            {t.newAppointment}
          </Button>
        )}
        {canPos && (
          <Button
            variant="contained"
            color="success"
            startIcon={<PointOfSaleIcon />}
            onClick={() => navigate('/admin/pos')}
          >
            {t.newInvoice}
          </Button>
        )}
      </Stack>

      {canEditSettings && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t.salonIdentity}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t.salonIdentityNote}
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t.salonNameAr}
                    value={salonAr}
                    onChange={(e) => setSalonAr(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t.salonNameEn}
                    value={salonEn}
                    onChange={(e) => setSalonEn(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    label={t.vatRateLabel}
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button variant="contained" onClick={saveIdentity} disabled={identitySaving} fullWidth>
                    {identitySaving ? t.saving : t.save}
                  </Button>
                </Grid>
              </Grid>
              <Button
                size="small"
                startIcon={<SettingsIcon />}
                onClick={() => navigate('/admin/settings')}
                sx={{ mt: 1.5 }}
              >
                {t.workingHours} →
              </Button>
            </CardContent>
          </Card>
          <Snackbar
            open={identityMsg !== null}
            autoHideDuration={4000}
            onClose={() => setIdentityMsg(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={identityErr ? 'error' : 'success'} sx={{ width: '100%' }} onClose={() => setIdentityMsg(null)}>
              {identityMsg}
            </Alert>
          </Snackbar>
        </>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.label}>
            <StatCard
              label={card.label}
              value={card.value}
              icon={card.icon}
              gradient={card.gradient}
              caption={card.caption}
            />
          </Grid>
        ))}
      </Grid>

      {analytics && (
        <>
          <Typography variant="h5" gutterBottom>
            {t.analytics}
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t.revenueTrend}
                  </Typography>
                  <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ height: 160 }}>
                    {analytics.revenueByDay.map((p) => (
                      <Box key={p.date} sx={{ flex: 1, textAlign: 'center' }}>
                        <Box
                          sx={{
                            height: `${Math.max(4, (p.revenue / maxRevenue) * 120)}px`,
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            minWidth: 14,
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                          {dayjs(p.date).format('DD/MM')}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t.topServices}
                  </Typography>
                  <Stack spacing={1}>
                    {analytics.topServices.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {t.noData}
                      </Typography>
                    )}
                    {analytics.topServices.map((s) => (
                      <Box key={s.serviceId}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">{nameOf(s.nameAr, s.nameEn)}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {fmt(s.revenue)}
                          </Typography>
                        </Stack>
                        <Box sx={{ bgcolor: 'grey.200', borderRadius: 1, mt: 0.5, height: 8 }}>
                          <Box
                            sx={{
                              width: `${(Number(s.revenue) / maxTop) * 100}%`,
                              bgcolor: 'secondary.main',
                              borderRadius: 1,
                              height: 8,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t.lowStock}
                  </Typography>
                  {analytics.lowStock.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t.lowStockEmpty}
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {analytics.lowStock.map((p) => (
                        <Stack key={p.id} direction="row" justifyContent="space-between">
                          <Typography variant="body2">{nameOf(p.nameAr, p.nameEn)}</Typography>
                          <Chip
                            label={`${p.quantity} / ${p.minStock}`}
                            color="error"
                            size="small"
                          />
                        </Stack>
                      ))}
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip
                      label={`${t.activeMemberships}: ${analytics.activeMemberships}`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip label={`${t.totalClients}: ${analytics.clientsCount}`} color="secondary" variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      <Typography variant="h5" gutterBottom>
        {t.todayAppointments}
      </Typography>
      {appointments && appointments.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          {t.empty}
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t.time}</TableCell>
                <TableCell>{t.client}</TableCell>
                <TableCell>{t.employee}</TableCell>
                <TableCell>{t.service}</TableCell>
                <TableCell>{t.status}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(appointments ?? []).map((a: Appointment) => {
                const sc = statusChips[a.status];
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.startTime} - {a.endTime}
                    </TableCell>
                    <TableCell>{a.client?.name ?? '-'}</TableCell>
                    <TableCell>
                      {a.employee ? nameOf(a.employee.nameAr, a.employee.nameEn) : '-'}
                    </TableCell>
                    <TableCell>
                      {a.service ? nameOf(a.service.nameAr, a.service.nameEn) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip label={sc[lang]} color={sc.color} size="small" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}