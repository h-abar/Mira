import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery, useTheme } from '@mui/material';
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
import {
  listUsers,
  createUser,
  updateUser,
  getPermissionDefs,
  type UserAccount,
  type PermissionDef,
  type UserRole,
} from '../api/users';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { isArabicText, isLatinText } from '../utils/languageValidation';
import PageHeader from '../components/PageHeader';
import ExportButtons from '../components/ExportButtons';

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
  userAccount: string;
  username: string;
  password: string;
  userRole: string;
  permissions: string;
  noUserAccount: string;
  createUserAccount: string;
  editUserAccount: string;
  activateUser: string;
  saveUser: string;
  userSaved: string;
  selectPermissions: string;
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
  userAccount: 'User Account',
  username: 'Username',
  password: 'Password',
  userRole: 'System Role',
  permissions: 'Permissions',
  noUserAccount: 'No user account linked',
  createUserAccount: 'Create User Account',
  editUserAccount: 'Edit User Account',
  activateUser: 'Active',
  saveUser: 'Save User',
  userSaved: 'User account saved successfully',
  selectPermissions: 'Select permissions',
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
  userAccount: 'حساب المستخدم',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  userRole: 'الدور في النظام',
  permissions: 'الصلاحيات',
  noUserAccount: 'لا يوجد حساب مستخدم مرتبط',
  createUserAccount: 'إنشاء حساب مستخدم',
  editUserAccount: 'تعديل حساب المستخدم',
  activateUser: 'نشط',
  saveUser: 'حفظ المستخدم',
  userSaved: 'تم حفظ حساب المستخدم بنجاح',
  selectPermissions: 'اختر الصلاحيات',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isAdmin = useAuthStore((s) => s.hasPermission('employees.write'));
  const canViewCost = useAuthStore((s) => s.hasPermission('cost.view'));

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

  // User account management state
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [permissionDefs, setPermissionDefs] = useState<PermissionDef[]>([]);
  const [linkedUser, setLinkedUser] = useState<UserAccount | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'STYLIST' as UserRole,
    permissions: [] as string[],
    isActive: true,
  });
  const [savingUser, setSavingUser] = useState(false);
  const canManageUsers = useAuthStore((s) => s.hasPermission('users'));

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

  const loadUsersAndPerms = useCallback(async () => {
    try {
      const [users, perms] = await Promise.all([listUsers(), getPermissionDefs()]);
      setAllUsers(users);
      setPermissionDefs(perms);
    } catch {
      // ignore — user management is optional
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
    if (canManageUsers) void loadUsersAndPerms();
  }, [loadEmployees, loadUsersAndPerms, canManageUsers]);

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
    // Find linked user account
    const user = allUsers.find((u) => u.employeeId === employee.id) ?? null;
    setLinkedUser(user);
    setDialogOpen(true);
  };

  const openUserDialog = () => {
    if (linkedUser) {
      setUserForm({
        username: linkedUser.username,
        password: '',
        role: linkedUser.role,
        permissions: linkedUser.permissions,
        isActive: linkedUser.isActive,
      });
    } else {
      const suggestedName = (form.nameEn || form.nameAr || 'user').toLowerCase().replace(/\s+/g, '');
      setUserForm({
        username: suggestedName,
        password: '',
        role: 'STYLIST',
        permissions: ['shifts.read', 'shifts.write'],
        isActive: true,
      });
    }
    setUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editing || !userForm.username.trim()) return;
    setSavingUser(true);
    try {
      if (linkedUser) {
        await updateUser(linkedUser.id, {
          username: userForm.username.trim(),
          password: userForm.password || undefined,
          role: userForm.role,
          permissions: userForm.permissions,
          isActive: userForm.isActive,
        });
      } else {
        if (!userForm.password) {
          showSnackbar(lang === 'ar' ? 'كلمة المرور مطلوبة لحساب جديد' : 'Password required for new account', 'error');
          setSavingUser(false);
          return;
        }
        const created = await createUser({
          username: userForm.username.trim(),
          password: userForm.password,
          role: userForm.role,
          employeeId: editing.id,
          permissions: userForm.permissions,
          isActive: userForm.isActive,
        });
        setLinkedUser(created);
      }
      showSnackbar(L.userSaved, 'success');
      setUserDialogOpen(false);
      await loadUsersAndPerms();
    } catch (err) {
      showSnackbar((err as ApiError).message, 'error');
    } finally {
      setSavingUser(false);
    }
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
    ...(canViewCost
      ? [
          {
            field: 'commissionRate' as const,
            headerName: L.commissionRate,
            width: 120,
            valueGetter: (_value: unknown, row: Employee) => `${Number(row.commissionRate)}%`,
          },
        ]
      : []),
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
          <Stack direction="row" spacing={1} alignItems="center">
            <ExportButtons endpoint="/employees/export" />
            {isAdmin && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                {L.add}
              </Button>
            )}
          </Stack>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
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
            {canViewCost && (
              <TextField
                label={L.commissionRate}
                type="number"
                inputProps={{ min: 0, max: 100, step: '0.01' }}
                value={form.commissionRate}
                onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
                fullWidth
              />
            )}
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

          {/* User account & permissions management */}
          {canManageUsers && editing && (
            <Box sx={{ mt: 3, p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {L.userAccount}
                </Typography>
                <Button size="small" variant="outlined" onClick={openUserDialog}>
                  {linkedUser ? L.editUserAccount : L.createUserAccount}
                </Button>
              </Stack>
              {linkedUser ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    <strong>{L.username}:</strong> {linkedUser.username}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{L.userRole}:</strong> {linkedUser.role}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{L.permissions}:</strong>{' '}
                    {linkedUser.permissions.length > 0
                      ? linkedUser.permissions.map((p) => {
                          const def = permissionDefs.find((d) => d.key === p);
                          return lang === 'ar' ? def?.ar ?? p : def?.en ?? p;
                        }).join('، ')
                      : (lang === 'ar' ? 'لا توجد' : 'None')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{L.activateUser}:</strong>{' '}
                    <Chip size="small" color={linkedUser.isActive ? 'success' : 'default'} label={linkedUser.isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Inactive')} />
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {L.noUserAccount}
                </Typography>
              )}
            </Box>
          )}
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

      {/* User account management dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{linkedUser ? L.editUserAccount : L.createUserAccount}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={L.username}
              value={userForm.username}
              onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label={linkedUser ? `${L.password} (${lang === 'ar' ? 'اتركه فارغ للإبقاء' : 'leave blank to keep'})` : L.password}
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
              fullWidth
              required={!linkedUser}
            />
            <TextField
              select
              label={L.userRole}
              value={userForm.role}
              onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              fullWidth
            >
              <MenuItem value="ADMIN">{lang === 'ar' ? 'مدير' : 'Admin'}</MenuItem>
              <MenuItem value="RECEPTIONIST">{lang === 'ar' ? 'استقبال' : 'Receptionist'}</MenuItem>
              <MenuItem value="STYLIST">{lang === 'ar' ? 'كوافيرة' : 'Stylist'}</MenuItem>
            </TextField>
            <Box>
              <Typography variant="subtitle2" mb={1}>{L.selectPermissions}</Typography>
              <Stack spacing={0.5} sx={{ maxHeight: 250, overflowY: 'auto' }}>
                {permissionDefs.map((perm) => {
                  const checked = userForm.permissions.includes(perm.key);
                  return (
                    <Stack
                      key={perm.key}
                      direction="row"
                      alignItems="center"
                      onClick={() =>
                        setUserForm((f) => ({
                          ...f,
                          permissions: checked
                            ? f.permissions.filter((p) => p !== perm.key)
                            : [...f.permissions, perm.key],
                        }))
                      }
                      sx={{ cursor: 'pointer', py: 0.25 }}
                    >
                      <Switch size="small" checked={checked} />
                      <Typography variant="body2">
                        {lang === 'ar' ? perm.ar : perm.en}
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ mx: 1 }}>
                          ({perm.key})
                        </Typography>
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={userForm.isActive}
                onChange={(e) => setUserForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <Typography variant="body2">{L.activateUser}</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>{L.cancel}</Button>
          <Button
            variant="contained"
            onClick={handleSaveUser}
            disabled={savingUser}
            startIcon={savingUser ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {L.saveUser}
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