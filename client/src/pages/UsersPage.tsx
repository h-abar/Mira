import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  createUser,
  getPermissionDefs,
  listUsers,
  updateUser,
  type PermissionDef,
  type UserAccount,
  type UserCreateInput,
  type UserRole,
  type UserUpdateInput,
} from '../api/users';
import { listEmployees, type Employee } from '../api/employees';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'المستخدمون',
    add: 'إضافة مستخدم',
    edit: 'تعديل مستخدم',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    role: 'الدور',
    employee: 'الموظفة',
    permissions: 'الصلاحيات',
    permissionsCount: 'عدد الصلاحيات',
    active: 'نشط',
    actions: 'إجراءات',
    editAction: 'تعديل',
    save: 'حفظ',
    cancel: 'إلغاء',
    none: 'بدون موظفة',
    noPermissions: 'لا توجد صلاحيات',
    fillRequired: 'يرجى تعبئة جميع الحقول المطلوبة',
    passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    successCreated: 'تم إنشاء المستخدم بنجاح',
    successUpdated: 'تم تحديث المستخدم بنجاح',
    successToggled: 'تم تحديث حالة المستخدم',
    error: 'حدث خطأ',
    selfDisabled: 'لا يمكنك تعطيل حسابك الحالي',
    other: 'أخرى',
  },
  en: {
    title: 'Users',
    add: 'Add User',
    edit: 'Edit User',
    username: 'Username',
    password: 'Password',
    role: 'Role',
    employee: 'Employee',
    permissions: 'Permissions',
    permissionsCount: 'Permissions',
    active: 'Active',
    actions: 'Actions',
    editAction: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    none: 'No employee',
    noPermissions: 'No permissions',
    fillRequired: 'Please fill all required fields',
    passwordMin: 'Password must be at least 6 characters',
    successCreated: 'User created successfully',
    successUpdated: 'User updated successfully',
    successToggled: 'User status updated',
    error: 'Something went wrong',
    selfDisabled: 'You cannot deactivate your own account',
    other: 'Other',
  },
} as const;

const roleLabelsAr: Record<UserRole, string> = {
  ADMIN: 'مدير',
  RECEPTIONIST: 'استقبال',
  STYLIST: 'كوافيرة',
};

const roleLabelsEn: Record<UserRole, string> = {
  ADMIN: 'Admin',
  RECEPTIONIST: 'Receptionist',
  STYLIST: 'Stylist',
};

const groupLabelsAr: Record<string, string> = {
  services: 'الخدمات',
  clients: 'العملاء',
  appointments: 'المواعيد',
  employees: 'الموظفات',
  inventory: 'المخزون',
  accounting: 'المحاسبة',
  reports: 'التقارير',
  other: 'أخرى',
};

const groupLabelsEn: Record<string, string> = {
  services: 'Services',
  clients: 'Clients',
  appointments: 'Appointments',
  employees: 'Employees',
  inventory: 'Inventory',
  accounting: 'Accounting',
  reports: 'Reports',
  other: 'Other',
};

interface UserForm {
  username: string;
  password: string;
  role: UserRole;
  employeeId: number | '';
  isActive: boolean;
  permissions: string[];
}

const emptyForm = (): UserForm => ({
  username: '',
  password: '',
  role: 'RECEPTIONIST',
  employeeId: '',
  isActive: true,
  permissions: [],
});

export default function UsersPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const roleLabels = lang === 'ar' ? roleLabelsAr : roleLabelsEn;
  const groupLabels = lang === 'ar' ? groupLabelsAr : groupLabelsEn;
  const user = useAuthStore((s) => s.user);

  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [permissionDefs, setPermissionDefs] = useState<PermissionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    { open: false, message: '', severity: 'success' },
  );

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await listUsers());
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, l.error]);

  const loadOptions = useCallback(async () => {
    try {
      const [emps, defs] = await Promise.all([listEmployees(), getPermissionDefs()]);
      setEmployees(emps);
      setPermissionDefs(defs);
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    }
  }, [showSnackbar, l.error]);

  useEffect(() => {
    void loadUsers();
    void loadOptions();
  }, [loadUsers, loadOptions]);

  const grouped = useMemo(() => {
    const groups: { key: string; items: PermissionDef[] }[] = [];
    const index = new Map<string, number>();
    for (const def of permissionDefs) {
      const key = def.key.includes('.') ? def.key.split('.')[0] : 'other';
      if (!index.has(key)) {
        index.set(key, groups.length);
        groups.push({ key, items: [] });
      }
      groups[index.get(key) as number].items.push(def);
    }
    return groups;
  }, [permissionDefs]);

  const nameOf = (employee?: { nameAr: string; nameEn: string } | null): string =>
    employee ? (lang === 'ar' ? employee.nameAr : employee.nameEn) : '—';

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (account: UserAccount) => {
    setEditing(account);
    setForm({
      username: account.username,
      password: '',
      role: account.role,
      employeeId: account.employeeId ?? '',
      isActive: account.isActive,
      permissions: account.permissions ?? [],
    });
    setDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const handleToggleActive = async (account: UserAccount) => {
    if (account.id === user?.id) {
      showSnackbar(l.selfDisabled, 'error');
      return;
    }
    try {
      await updateUser(account.id, { isActive: !account.isActive });
      showSnackbar(l.successToggled, 'success');
      await loadUsers();
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    }
  };

  const handleSubmit = async () => {
    if (!form.username.trim()) {
      showSnackbar(l.fillRequired, 'error');
      return;
    }
    if (form.password && form.password.length < 6) {
      showSnackbar(l.passwordMin, 'error');
      return;
    }
    if (!editing && form.password.length < 6) {
      showSnackbar(l.passwordMin, 'error');
      return;
    }
    setSaving(true);
    try {
      const employeeId = form.employeeId === '' ? null : Number(form.employeeId);
      if (editing) {
        const payload: UserUpdateInput = {
          username: form.username.trim(),
          role: form.role,
          employeeId,
          permissions: form.permissions,
          isActive: form.isActive,
        };
        if (form.password) {
          payload.password = form.password;
        }
        await updateUser(editing.id, payload);
        showSnackbar(l.successUpdated, 'success');
      } else {
        const payload: UserCreateInput = {
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          employeeId,
          permissions: form.permissions,
          isActive: form.isActive,
        };
        await createUser(payload);
        showSnackbar(l.successCreated, 'success');
      }
      setDialogOpen(false);
      await loadUsers();
    } catch (err) {
      showSnackbar((err as ApiError).message || l.error, 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef<UserAccount>[] = [
    { field: 'username', headerName: l.username, flex: 1, minWidth: 140 },
    {
      field: 'role',
      headerName: l.role,
      width: 140,
      renderCell: ({ row }) => (
        <Chip label={roleLabels[row.role]} size="small" color="secondary" variant="outlined" />
      ),
    },
    {
      field: 'employee',
      headerName: l.employee,
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) => nameOf(row.employee),
    },
    {
      field: 'permissions',
      headerName: l.permissionsCount,
      width: 140,
      renderCell: ({ row }) => (
        <Chip
          label={`${row.permissions?.length ?? 0}`}
          size="small"
          color={row.permissions?.length ? 'primary' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: l.active,
      width: 90,
      renderCell: ({ row }) => (
        <Switch
          size="small"
          checked={row.isActive}
          disabled={row.id === user?.id}
          onChange={() => void handleToggleActive(row)}
        />
      ),
    },
    {
      field: 'actions',
      headerName: l.actions,
      width: 80,
      sortable: false,
      renderCell: ({ row }) => (
        <IconButton size="small" aria-label={l.editAction} onClick={() => openEdit(row)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const isSelf = editing?.id === user?.id;

  return (
    <Box>
      <PageHeader
        title={l.title}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            {l.add}
          </Button>
        }
      />

      <Box sx={{ height: 'calc(100vh - 220px)', width: '100%' }}>
        <DataGrid
          rows={accounts}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? `${l.edit} — ${editing.username}` : l.add}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label={l.username}
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label={l.password}
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                helperText={
                  editing
                    ? lang === 'ar'
                      ? 'اتركه فارغاً للإبقاء على كلمة المرور الحالية'
                      : 'Leave empty to keep current password'
                    : undefined
                }
                required={!editing}
                fullWidth
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="user-role-label">{l.role}</InputLabel>
                <Select
                  labelId="user-role-label"
                  label={l.role}
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                >
                  {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                    <MenuItem key={role} value={role}>
                      {roleLabels[role]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="user-employee-label">{l.employee}</InputLabel>
                <Select
                  labelId="user-employee-label"
                  label={l.employee}
                  value={form.employeeId}
                  onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value as number | '' }))}
                >
                  <MenuItem value="">
                    <em>{l.none}</em>
                  </MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {nameOf(employee)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  disabled={isSelf}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label={l.active}
            />

            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
                {l.permissions}
              </FormLabel>
              {permissionDefs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {l.noPermissions}
                </Typography>
              ) : (
                grouped.map((group) => (
                  <FormControl key={group.key} component="fieldset" sx={{ mb: 1.5 }}>
                    <FormLabel component="legend">{groupLabels[group.key] ?? group.key}</FormLabel>
                    <FormGroup row>
                      {group.items.map((def) => {
                        const label = lang === 'ar' ? def.ar : def.en;
                        return (
                          <FormControlLabel
                            key={def.key}
                            control={
                              <Checkbox
                                checked={form.permissions.includes(def.key)}
                                onChange={() => togglePermission(def.key)}
                                size="small"
                              />
                            }
                            label={label}
                          />
                        );
                      })}
                    </FormGroup>
                  </FormControl>
                ))
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{l.cancel}</Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {l.save}
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