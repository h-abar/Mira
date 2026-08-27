import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type Supplier,
  type SupplierPayload,
} from '../api/suppliers';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'الموردون',
    add: 'إضافة مورد',
    addTitle: 'إضافة مورد جديد',
    editTitle: 'تعديل المورد',
    colName: 'الاسم',
    colPhone: 'الهاتف',
    colEmail: 'البريد',
    colProducts: 'المنتجات',
    colOrders: 'أوامر الشراء',
    colStatus: 'الحالة',
    colActions: 'إجراءات',
    name: 'الاسم',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    address: 'العنوان',
    notes: 'ملاحظات',
    active: 'نشط',
    activeLabel: 'نشط',
    inactive: 'معطّل',
    required: 'هذا الحقل مطلوب',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    deleteTitle: 'تأكيد الحذف',
    deleteMessage: 'سيتم تعطيل المورد إذا كان مرتبطاً بمنتجات أو أوامر شراء. هل تريد المتابعة؟',
    deleteYes: 'نعم، تعطيل',
    noData: 'لا توجد بيانات',
    loading: 'جارٍ التحميل...',
    search: 'بحث',
    created: 'تم إنشاء المورد بنجاح',
    updated: 'تم تحديث المورد بنجاح',
    deleted: 'تم تعطيل المورد',
    error: 'حدث خطأ',
    nameError: 'يرجى إدخال اسم المورد',
  },
  en: {
    title: 'Suppliers',
    add: 'Add Supplier',
    addTitle: 'Add New Supplier',
    editTitle: 'Edit Supplier',
    colName: 'Name',
    colPhone: 'Phone',
    colEmail: 'Email',
    colProducts: 'Products',
    colOrders: 'Purchase Orders',
    colStatus: 'Status',
    colActions: 'Actions',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    notes: 'Notes',
    active: 'Active',
    activeLabel: 'Active',
    inactive: 'Inactive',
    required: 'This field is required',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteTitle: 'Confirm Delete',
    deleteMessage:
      'The supplier will be deactivated if linked to products or purchase orders. Continue?',
    deleteYes: 'Yes, Deactivate',
    noData: 'No data',
    loading: 'Loading...',
    search: 'Search',
    created: 'Supplier created successfully',
    updated: 'Supplier updated successfully',
    deleted: 'Supplier deactivated',
    error: 'Something went wrong',
    nameError: 'Please enter the supplier name',
  },
} as const;

interface SupplierForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
}

const emptyForm: SupplierForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
};

export default function SuppliersPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const canWrite = useAuthStore((s) => s.hasPermission('suppliers'));

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSuppliers({ q: search || undefined, limit: 100 });
      setSuppliers(res.data.items);
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
      isActive: supplier.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (form.name.trim() === '') {
      setSnackbar({ message: l.nameError, severity: 'error' });
      return;
    }
    const payload: SupplierPayload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await updateSupplier(editing.id, payload);
        setSnackbar({ message: l.updated, severity: 'success' });
      } else {
        await createSupplier(payload);
        setSnackbar({ message: l.created, severity: 'success' });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteSupplier(deleteTarget.id);
      setSnackbar({ message: res.data.message || l.deleted, severity: 'success' });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: l.colName, flex: 1, minWidth: 150 },
    { field: 'phone', headerName: l.colPhone, flex: 1, minWidth: 130 },
    { field: 'email', headerName: l.colEmail, flex: 1, minWidth: 170 },
    {
      field: '_count',
      headerName: l.colProducts,
      width: 100,
      valueGetter: (value: { products?: number } | undefined) => value?.products ?? 0,
    },
    {
      field: 'isActive',
      headerName: l.colStatus,
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          color={params.row.isActive ? 'success' : 'default'}
          label={params.row.isActive ? l.activeLabel : l.inactive}
        />
      ),
    },
    {
      field: 'actions',
      headerName: l.colActions,
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="primary" onClick={() => openEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(params.row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title={l.title}
        actions={
          canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
              {l.add}
            </Button>
          )
        }
      />

      <TextField
        placeholder={l.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2, maxWidth: 360 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 480, width: '100%' }}>
          <DataGrid
            rows={suppliers}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">{l.noData}</Typography>
                </Box>
              ),
            }}
            localeText={{
              noRowsLabel: l.noData,
              noResultsOverlayLabel: l.noData,
            }}
          />
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? l.editTitle : l.addTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={l.name}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={form.name.trim() === ''}
              helperText={form.name.trim() === '' ? l.required : undefined}
              required
              fullWidth
            />
            <TextField
              label={l.phone}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label={l.email}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label={l.address}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              fullWidth
            />
            <TextField
              label={l.notes}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              multiline
              minRows={2}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label={l.activeLabel}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{l.cancel}</Button>
          <Button variant="contained" onClick={handleSave}>
            {l.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{l.deleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{l.deleteMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{l.cancel}</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            {l.deleteYes}
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar && (
        <Snackbar
          open
          autoHideDuration={3500}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
