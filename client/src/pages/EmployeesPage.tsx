import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
  type Employee,
  type EmployeeInput,
  type EmployeeRole,
} from '../api/employees';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { isArabicText, isLatinText } from '../utils/languageValidation';
import PageHeader from '../components/PageHeader';

interface Labels {
  title: string;
  add: string;
  edit: string;
  name: string;
  phone: string;
  role: string;
  commissionRate: string;
  hireDate: string;
  active: string;
  appointments: string;
  actions: string;
  save: string;
  cancel: string;
  delete: string;
  nameAr: string;
  nameEn: string;
  nameArError: string;
  nameEnError: string;
  deleteConfirm: string;
  successCreated: string;
  successUpdated: string;
  successDeleted: string;
  successToggled: string;
  fillRequired: string;
  shiftName: string;
  shiftHours: string;
  shiftStart: string;
  shiftEnd: string;
  workDays: string;
  schedule: string;
  shiftMorning: string;
  shiftEvening: string;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
}

const enLabels: Labels = {
  title: 'Employees',
  add: 'Add Employee',
  edit: 'Edit Employee',
  name: 'Name',
  phone: 'Phone',
  role: 'Role',
  commissionRate: 'Commission %',
  hireDate: 'Hire Date',
  active: 'Active',
  appointments: 'Appointments',
  actions: 'Actions',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  nameAr: 'Name (Arabic)',
  nameEn: 'Name (English)',
  nameArError: 'Name must be written in Arabic letters only',
  nameEnError: 'Name must be written in English letters only',
  deleteConfirm: 'Delete this employee?',
  successCreated: 'Employee created successfully',
  successUpdated: 'Employee updated successfully',
  successDeleted: 'Employee deleted successfully',
  successToggled: 'Employee status updated',
  fillRequired: 'Please fill all required fields',
  shiftName: 'Shift Name',
  shiftHours: 'Working Hours',
  shiftStart: 'Shift Start',
  shiftEnd: 'Shift End',
  workDays: 'Work Days',
  schedule: 'Work Schedule',
  shiftMorning: 'Morning',
  shiftEvening: 'Evening',
  morningStart: 'Morning Start',
  morningEnd: 'Morning End',
  eveningStart: 'Evening Start',
  eveningEnd: 'Evening End',
};

const arLabels: Labels = {
  title: 'الموظفات',
  add: 'إضافة موظفة',
  edit: 'تعديل موظفة',
  name: 'الاسم',
  phone: 'الهاتف',
  role: 'الدور',
  commissionRate: 'نسبة العمولة %',
  hireDate: 'تاريخ التعيين',
  active: 'نشطة',
  appointments: 'المواعيد',
  actions: 'إجراءات',
  save: 'حفظ',
  cancel: 'إلغاء',
  delete: 'حذف',
  nameAr: 'الاسم (بالعربية)',
  nameEn: 'الاسم (بالإنجليزية)',
  nameArError: 'يجب أن يُكتب الاسم بالحروف العربية فقط',
  nameEnError: 'يجب أن يُكتب الاسم بالحروف الإنجليزية فقط',
  deleteConfirm: 'حذف هذه الموظفة؟',
  successCreated: 'تم إنشاء الموظفة بنجاح',
  successUpdated: 'تم تحديث الموظفة بنجاح',
  successDeleted: 'تم حذف الموظفة بنجاح',
  successToggled: 'تم تحديث حالة الموظفة',
  fillRequired: 'يرجى تعبئة جميع الحقول المطلوبة',
  shiftName: 'اسم الوردية',
  shiftHours: 'ساعات العمل',
  shiftStart: 'بداية الوردية',
  shiftEnd: 'نهاية الوردية',
  workDays: 'أيام العمل',
  schedule: 'جدول الدوام',
  shiftMorning: 'صباحي',
  shiftEvening: 'مسائي',
  morningStart: 'بداية الدوام الصباحي',
  morningEnd: 'نهاية الدوام الصباحي',
  eveningStart: 'بداية الدوام المسائي',
  eveningEnd: 'نهاية الدوام المسائي',
};

const roleLabelsEn: Record<EmployeeRole, string> = {
  STYLIST: 'Stylist',
  BEAUTICIAN: 'Beautician',
  RECEPTIONIST: 'Receptionist',
};

const roleLabelsAr: Record<EmployeeRole, string> = {
  STYLIST: 'كوافيرة',
  BEAUTICIAN: 'خبيرة تجميل',
  RECEPTIONIST: 'استقبال',
};

interface EmployeeForm {
  nameAr: string;
  nameEn: string;
  phone: string;
  role: EmployeeRole;
  commissionRate: string;
  hireDate: Dayjs | null;
  shiftTypes: ('morning' | 'evening')[];
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  workDays: string;
}

const emptyForm: EmployeeForm = {
  nameAr: '',
  nameEn: '',
  phone: '',
  role: 'STYLIST',
  commissionRate: '0',
  hireDate: dayjs(),
  shiftTypes: ['morning'],
  morningStart: '09:00',
  morningEnd: '14:00',
  eveningStart: '16:00',
  eveningEnd: '21:00',
  workDays: 'Sun,Mon,Tue,Wed,Thu',
};

export default function EmployeesPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const L = lang === 'ar' ? arLabels : enLabels;
  const roleLabels = lang === 'ar' ? roleLabelsAr : roleLabelsEn;

  const isAdmin = useAuthStore((s) => s.hasPermission('employees.write'));

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    { open: false, message: '', severity: 'success' },
  );

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      setEmployees(await listEmployees());
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const nameOf = (employee: { nameAr: string; nameEn: string }): string =>
    lang === 'ar' ? employee.nameAr : employee.nameEn;

  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB');
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    const types: ('morning' | 'evening')[] = [];
    if (employee.morningStart || employee.morningEnd) types.push('morning');
    if (employee.eveningStart || employee.eveningEnd) types.push('evening');
    if (types.length === 0) {
      // Legacy single-shift records: infer from shiftName or default to morning.
      types.push('morning');
      if ((employee.shiftName ?? '').includes('مسائ')) types.push('evening');
    }
    setForm({
      nameAr: employee.nameAr,
      nameEn: employee.nameEn,
      phone: employee.phone ?? '',
      role: employee.role,
      commissionRate: String(Number(employee.commissionRate)),
      hireDate: dayjs(employee.hireDate),
      shiftTypes: types,
      morningStart: employee.morningStart || '09:00',
      morningEnd: employee.morningEnd || '14:00',
      eveningStart: employee.eveningStart || '16:00',
      eveningEnd: employee.eveningEnd || '21:00',
      workDays: employee.workDays || 'Sun,Mon,Tue,Wed,Thu',
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      await updateEmployee(employee.id, { isActive: !employee.isActive });
      showSnackbar(L.successToggled, 'success');
      await loadEmployees();
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployee(deleteTarget.id);
      showSnackbar(L.successDeleted, 'success');
      setDeleteTarget(null);
      await loadEmployees();
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    }
  };

  const handleSubmit = async () => {
    if (!form.nameAr.trim() || !form.nameEn.trim() || !form.role || !form.hireDate) {
      showSnackbar(L.fillRequired, 'error');
      return;
    }
    if (!isArabicText(form.nameAr) || !isLatinText(form.nameEn)) {
      showSnackbar(L.nameArError, 'error');
      return;
    }
    setSaving(true);
    const hasMorning = form.shiftTypes.includes('morning');
    const hasEvening = form.shiftTypes.includes('evening');
    const shiftName = hasMorning && hasEvening
      ? 'صباحي ومسائي'
      : hasMorning
        ? 'صباحي'
        : hasEvening
          ? 'مسائي'
          : undefined;
    // Keep legacy single-shift columns in sync (attendance/reports rely on them).
    const legacyStart = hasMorning
      ? form.morningStart
      : hasEvening
        ? form.eveningStart
        : undefined;
    const legacyEnd = hasMorning
      ? form.morningEnd
      : hasEvening
        ? form.eveningEnd
        : undefined;
    const payload: EmployeeInput = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      commissionRate: Number(form.commissionRate) || 0,
      hireDate: form.hireDate.format('YYYY-MM-DD'),
      shiftName,
      shiftStart: legacyStart,
      shiftEnd: legacyEnd,
      workDays: form.workDays.trim() || undefined,
      morningStart: hasMorning ? form.morningStart : undefined,
      morningEnd: hasMorning ? form.morningEnd : undefined,
      eveningStart: hasEvening ? form.eveningStart : undefined,
      eveningEnd: hasEvening ? form.eveningEnd : undefined,
    };
    if (!editing) {
      payload.isActive = true;
    }
    try {
      if (editing) {
        await updateEmployee(editing.id, payload);
        showSnackbar(L.successUpdated, 'success');
      } else {
        await createEmployee(payload);
        showSnackbar(L.successCreated, 'success');
      }
      setDialogOpen(false);
      await loadEmployees();
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef<Employee>[] = [
    { field: 'name', headerName: L.name, flex: 1, minWidth: 160, renderCell: ({ row }) => nameOf(row) },
    { field: 'phone', headerName: L.phone, width: 130, valueGetter: (_value, row) => row.phone ?? '—' },
    {
      field: 'role',
      headerName: L.role,
      width: 130,
      renderCell: ({ row }) => (
        <Chip label={roleLabels[row.role]} size="small" color="secondary" variant="outlined" />
      ),
    },
    {
      field: 'shiftHours',
      headerName: L.shiftHours,
      width: 170,
      renderCell: ({ row }) => {
        const parts: string[] = [];
        if (row.morningStart || row.morningEnd) {
          parts.push(`${L.shiftMorning} ${row.morningStart ?? ""}-${row.morningEnd ?? ""}`.trim());
        }
        if (row.eveningStart || row.eveningEnd) {
          parts.push(`${L.shiftEvening} ${row.eveningStart ?? ""}-${row.eveningEnd ?? ""}`.trim());
        }
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2, py: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {row.morningStart || row.eveningStart
                ? [row.morningStart && L.shiftMorning, row.eveningStart && L.shiftEvening]
                    .filter(Boolean)
                    .join(" + ")
                : row.shiftName || "\u2014"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {parts.length > 0
                ? parts.join(" / ")
                : `${row.shiftStart || "09:00"} - ${row.shiftEnd || "17:00"}`}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'commissionRate',
      headerName: L.commissionRate,
      width: 120,
      valueGetter: (_value, row) => `${Number(row.commissionRate)}%`,
    },
    { field: 'hireDate', headerName: L.hireDate, width: 120, valueGetter: (_value, row) => formatDate(row.hireDate) },
    {
      field: 'appointments',
      headerName: L.appointments,
      width: 100,
      valueGetter: (_value, row) => row._count?.appointments ?? 0,
    },
    {
      field: 'isActive',
      headerName: L.active,
      width: 80,
      renderCell: ({ row }) => (
        <Switch size="small" checked={row.isActive} disabled={!isAdmin} onChange={() => handleToggleActive(row)} />
      ),
    },
    {
      field: 'actions',
      headerName: L.actions,
      width: 110,
      sortable: false,
      renderCell: ({ row }) =>
        isAdmin ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" aria-label={L.edit} onClick={() => openEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" aria-label={L.delete} onClick={() => setDeleteTarget(row)}>
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

  return (
    <Box>
      <PageHeader
        title={L.title}
        actions={
          isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
              {L.add}
            </Button>
          )
        }
      />

      <Box sx={{ height: 'calc(100vh - 220px)', width: '100%' }}>
        <DataGrid
          rows={employees}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editing ? `${L.edit} — ${L.title}` : L.add}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={L.nameAr}
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              error={form.nameAr.trim() === '' || (form.nameAr.trim() !== '' && !isArabicText(form.nameAr))}
              helperText={
                form.nameAr.trim() === ''
                  ? L.fillRequired
                  : !isArabicText(form.nameAr)
                    ? L.nameArError
                    : undefined
              }
              required
              fullWidth
            />
            <TextField
              label={L.nameEn}
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              error={form.nameEn.trim() === '' || (form.nameEn.trim() !== '' && !isLatinText(form.nameEn))}
              helperText={
                form.nameEn.trim() === ''
                  ? L.fillRequired
                  : !isLatinText(form.nameEn)
                    ? L.nameEnError
                    : undefined
              }
              required
              fullWidth
            />
            <TextField
              label={L.phone}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label={L.role}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as EmployeeRole }))}
              fullWidth
            >
              {(Object.keys(roleLabels) as EmployeeRole[]).map((role) => (
                <MenuItem key={role} value={role}>
                  {roleLabels[role]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={L.commissionRate}
              type="number"
              inputProps={{ min: 0, max: 100, step: '0.01' }}
              value={form.commissionRate}
              onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
              fullWidth
            />
            <DatePicker
              label={L.hireDate}
              value={form.hireDate}
              onChange={(value: Dayjs | null) => setForm((f) => ({ ...f, hireDate: value }))}
            />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>
              {L.schedule}
            </Typography>

            <Autocomplete
              multiple
              limitTags={2}
              disableCloseOnSelect
              options={[
                { id: 'morning' as const, label: L.shiftMorning },
                { id: 'evening' as const, label: L.shiftEvening },
              ]}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={
                form.shiftTypes.includes('morning') && form.shiftTypes.includes('evening')
                  ? [
                      { id: 'morning' as const, label: L.shiftMorning },
                      { id: 'evening' as const, label: L.shiftEvening },
                    ]
                  : form.shiftTypes.includes('evening')
                    ? [{ id: 'evening' as const, label: L.shiftEvening }]
                    : form.shiftTypes.includes('morning')
                      ? [{ id: 'morning' as const, label: L.shiftMorning }]
                      : []
              }
              onChange={(_e, v) =>
                setForm((f) => ({ ...f, shiftTypes: v.map((o) => o.id) }))
              }
              renderInput={(params) => (
                <TextField {...params} label={L.schedule} placeholder={L.schedule} />
              )}
            />

            {form.shiftTypes.includes('morning') && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label={L.morningStart}
                  type="time"
                  value={form.morningStart}
                  onChange={(e) => setForm((f) => ({ ...f, morningStart: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={L.morningEnd}
                  type="time"
                  value={form.morningEnd}
                  onChange={(e) => setForm((f) => ({ ...f, morningEnd: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            )}

            {form.shiftTypes.includes('evening') && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label={L.eveningStart}
                  type="time"
                  value={form.eveningStart}
                  onChange={(e) => setForm((f) => ({ ...f, eveningStart: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label={L.eveningEnd}
                  type="time"
                  value={form.eveningEnd}
                  onChange={(e) => setForm((f) => ({ ...f, eveningEnd: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            )}

            {form.shiftTypes.includes('evening') && (
              <TextField
                label={L.workDays}
                value={form.workDays}
                onChange={(e) => setForm((f) => ({ ...f, workDays: e.target.value }))}
                helperText={lang === 'ar' ? 'أيام العمل مفصولة بفواصل (مثال: Sun,Mon,Tue,Wed,Thu)' : 'Work days comma separated (e.g. Sun,Mon,Tue,Wed,Thu)'}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{L.cancel}</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {L.save}
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
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
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