import { useCallback, useEffect, useMemo, useState } from 'react';
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
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import {
  attendanceSummary,
  checkIn,
  checkOut,
  listAttendance,
  type AttendanceRecord,
  type AttendanceSummaryRow,
} from '../api/attendance';
import { listEmployees, type Employee } from '../api/employees';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'الحضور والانصراف',
    checkIn: 'تسجيل دخول',
    checkOut: 'تسجيل خروج',
    notCheckedIn: 'لم يتم تسجيل الدخول',
    checkedIn: 'تم تسجيل الدخول',
    checkedOut: 'تم تسجيل الخروج',
    selectEmployee: 'اختر الموظفة',
    myAttendance: 'حضور اليوم',
    attendanceCard: 'بطاقة الحضور',
    employee: 'الموظفة',
    date: 'التاريخ',
    checkInTime: 'وقت الدخول',
    checkOutTime: 'وقت الخروج',
    hours: 'ساعات العمل',
    hoursUnit: 'ساعة',
    summary: 'ملخص الحضور',
    days: 'أيام الحضور',
    totalHours: 'إجمالي الساعات',
    earliestCheckIn: 'أول دخول',
    latestCheckOut: 'آخر خروج',
    from: 'من',
    to: 'إلى',
    refresh: 'تحديث',
    records: 'سجل الحضور',
    checkInSuccess: 'تم تسجيل الدخول بنجاح',
    alreadyCheckedIn: 'تم تسجيل الدخول مسبقاً اليوم',
    checkOutSuccess: 'تم تسجيل الخروج بنجاح',
    error: 'حدث خطأ',
    empty: 'لا توجد سجلات في هذه الفترة',
    noSummary: 'لا يوجد ملخص في هذه الفترة',
    notFound: '—',
  },
  en: {
    title: 'Attendance',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    notCheckedIn: 'Not checked in',
    checkedIn: 'Checked in',
    checkedOut: 'Checked out',
    selectEmployee: 'Select employee',
    myAttendance: 'Today\'s Attendance',
    attendanceCard: 'Attendance Card',
    employee: 'Employee',
    date: 'Date',
    checkInTime: 'Check-in',
    checkOutTime: 'Check-out',
    hours: 'Hours Worked',
    hoursUnit: 'hrs',
    summary: 'Summary',
    days: 'Days Present',
    totalHours: 'Total Hours',
    earliestCheckIn: 'Earliest Check-in',
    latestCheckOut: 'Latest Check-out',
    from: 'From',
    to: 'To',
    refresh: 'Refresh',
    records: 'Attendance Records',
    checkInSuccess: 'Checked in successfully',
    alreadyCheckedIn: 'Already checked in today',
    checkOutSuccess: 'Checked out successfully',
    error: 'Something went wrong',
    empty: 'No records in this period',
    noSummary: 'No summary in this period',
    notFound: '—',
  },
} as const;

type Status = 'none' | 'checkedIn' | 'checkedOut';

export default function AttendancePage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const user = useAuthStore((s) => s.user);
  const myEmployeeId = user?.employeeId ?? null;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>(myEmployeeId ?? '');
  const [status, setStatus] = useState<Status>('none');
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [to, setTo] = useState<Dayjs | null>(dayjs());
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const activeEmployeeId = selectedEmployeeId === '' ? undefined : Number(selectedEmployeeId);
  const hasEmployee = myEmployeeId != null;
  const canSelect = !hasEmployee;

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  const selectedEmployee = useMemo(
    () => (activeEmployeeId ? employees.find((emp) => emp.id === activeEmployeeId) ?? null : null),
    [employees, activeEmployeeId],
  );

  const nameOf = (employee?: { nameAr: string; nameEn: string } | null): string =>
    employee ? (lang === 'ar' ? employee.nameAr : employee.nameEn) : l.notFound;

  const formatDate = (value?: string | null): string => {
    if (!value) return l.notFound;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return l.notFound;
    return d.toLocaleDateString('en-GB');
  };

  const formatTime = (value?: string | null): string => {
    if (!value) return l.notFound;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return l.notFound;
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHours = (value: string | number | null): string =>
    value != null ? `${Number(value).toFixed(2)} ${l.hoursUnit}` : l.notFound;

  const loadStatus = useCallback(async () => {
    if (!activeEmployeeId) {
      setStatus('none');
      setTodayRecord(null);
      return;
    }
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const res = await listAttendance({ from: today, to: today, employeeId: activeEmployeeId, limit: 1 });
      const record = res.items[0] ?? null;
      setTodayRecord(record);
      if (record?.checkIn && !record?.checkOut) {
        setStatus('checkedIn');
      } else if (record?.checkIn && record?.checkOut) {
        setStatus('checkedOut');
      } else {
        setStatus('none');
      }
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    }
  }, [activeEmployeeId, showSnackbar, l.error]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        from: from ? from.format('YYYY-MM-DD') : undefined,
        to: to ? to.format('YYYY-MM-DD') : undefined,
        employeeId: activeEmployeeId,
        limit: 100,
      };
      const [listRes, sumRes] = await Promise.all([
        listAttendance(params),
        attendanceSummary(params),
      ]);
      setRecords(listRes.items);
      setSummary(sumRes);
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    } finally {
      setLoading(false);
    }
  }, [from, to, activeEmployeeId, showSnackbar, l.error]);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await listEmployees();
      setEmployees(data);
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    }
  }, [showSnackbar, l.error]);

  useEffect(() => {
    if (canSelect) {
      void loadEmployees();
    } else if (myEmployeeId != null) {
      setSelectedEmployeeId(myEmployeeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadStatus();
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEmployeeId]);

  const handleCheckIn = async () => {
    if (!activeEmployeeId) {
      showSnackbar(l.selectEmployee, 'error');
      return;
    }
    try {
      const res = await checkIn(activeEmployeeId);
      showSnackbar(res.alreadyCheckedIn ? l.alreadyCheckedIn : l.checkInSuccess, 'success');
      await Promise.all([loadStatus(), loadData()]);
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    }
  };

  const handleCheckOut = async () => {
    if (!activeEmployeeId) {
      showSnackbar(l.selectEmployee, 'error');
      return;
    }
    try {
      await checkOut(activeEmployeeId);
      showSnackbar(l.checkOutSuccess, 'success');
      await Promise.all([loadStatus(), loadData()]);
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    }
  };

  const statusMeta: Record<Status, { ar: string; en: string; color: 'default' | 'success' | 'info' }> = {
    none: { ar: l.notCheckedIn, en: l.notCheckedIn, color: 'default' },
    checkedIn: { ar: l.checkedIn, en: l.checkedIn, color: 'success' },
    checkedOut: { ar: l.checkedOut, en: l.checkedOut, color: 'info' },
  };

  const columns: GridColDef<AttendanceRecord>[] = [
    {
      field: 'employee',
      headerName: l.employee,
      flex: 1.2,
      renderCell: ({ row }) => nameOf(row.employee),
    },
    { field: 'date', headerName: l.date, width: 130, renderCell: ({ row }) => formatDate(row.date) },
    { field: 'checkIn', headerName: l.checkInTime, width: 110, renderCell: ({ row }) => formatTime(row.checkIn) },
    { field: 'checkOut', headerName: l.checkOutTime, width: 110, renderCell: ({ row }) => formatTime(row.checkOut) },
    { field: 'hoursWorked', headerName: l.hours, width: 130, renderCell: ({ row }) => formatHours(row.hoursWorked) },
  ];

  const summaryColumns: GridColDef<AttendanceSummaryRow>[] = [
    {
      field: 'employee',
      headerName: l.employee,
      flex: 1.2,
      renderCell: ({ row }) => nameOf(row.employee),
    },
    { field: 'days', headerName: l.days, width: 130, renderCell: ({ row }) => row.days },
    { field: 'totalHours', headerName: l.totalHours, width: 140, renderCell: ({ row }) => `${row.totalHours.toFixed(2)} ${l.hoursUnit}` },
    { field: 'earliestCheckIn', headerName: l.earliestCheckIn, width: 130, renderCell: ({ row }) => formatTime(row.earliestCheckIn) },
    { field: 'latestCheckOut', headerName: l.latestCheckOut, width: 130, renderCell: ({ row }) => formatTime(row.latestCheckOut) },
  ];

  return (
    <Box>
      <PageHeader title={l.title} />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          {l.attendanceCard}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          {canSelect ? (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="attendance-employee-label">{l.employee}</InputLabel>
              <Select
                labelId="attendance-employee-label"
                label={l.employee}
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value as number | '')}
              >
                <MenuItem value="">
                  <em>{l.selectEmployee}</em>
                </MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {nameOf(employee)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography variant="body1" fontWeight={600}>
              {nameOf(selectedEmployee)}
            </Typography>
          )}

          <Chip
            color={statusMeta[status].color}
            label={statusMeta[status].ar}
            sx={{ fontWeight: 600 }}
          />

          {todayRecord?.checkIn && (
            <Typography variant="body2" color="text.secondary">
              {l.checkInTime}: {formatTime(todayRecord.checkIn)}
            </Typography>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            color="primary"
            startIcon={<LoginIcon />}
            disabled={!activeEmployeeId || status !== 'none'}
            onClick={() => void handleCheckIn()}
          >
            {l.checkIn}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<LogoutIcon />}
            disabled={!activeEmployeeId || status !== 'checkedIn'}
            onClick={() => void handleCheckOut()}
          >
            {l.checkOut}
          </Button>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <DatePicker
          label={l.from}
          value={from}
          onChange={(value: Dayjs | null) => setFrom(value)}
          slotProps={{ textField: { size: 'small' } }}
        />
        <DatePicker
          label={l.to}
          value={to}
          onChange={(value: Dayjs | null) => setTo(value)}
          slotProps={{ textField: { size: 'small' } }}
        />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void loadData()}>
          {l.refresh}
        </Button>
      </Stack>

      <Typography variant="h6" gutterBottom>
        {l.summary}
      </Typography>
      {summary.length === 0 && !loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {l.noSummary}
        </Typography>
      ) : (
        <Box sx={{ width: '100%', mb: 4 }}>
          <DataGrid<AttendanceSummaryRow>
            rows={summary}
            columns={summaryColumns}
            loading={loading}
            getRowId={(row) => row.employeeId}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
          />
        </Box>
      )}

      <Typography variant="h6" gutterBottom>
        {l.records}
      </Typography>
      <Box sx={{ height: 420, width: '100%' }}>
        <DataGrid<AttendanceRecord>
          rows={records}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
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