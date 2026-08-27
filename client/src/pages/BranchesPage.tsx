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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  type Branch,
  type BranchPayload,
} from '../api/branches';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'الفروع',
    add: 'إضافة فرع',
    addTitle: 'إضافة فرع جديد',
    editTitle: 'تعديل الفرع',
    colName: 'الاسم',
    colAddress: 'العنوان',
    colPhone: 'الهاتف',
    colProducts: 'المنتجات',
    colInvoices: 'الفواتير',
    colStatus: 'الحالة',
    colActions: 'إجراءات',
    nameAr: 'الاسم (عربي)',
    nameEn: 'الاسم (إنجليزي)',
    address: 'العنوان',
    phone: 'الهاتف',
    active: 'نشط',
    activeLabel: 'نشط',
    inactive: 'معطّل',
    showInactive: 'إظهار المعطلة',
    required: 'هذا الحقل مطلوب',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    deleteTitle: 'تأكيد الحذف',
    deleteMessage: 'سيتم تعطيل هذا الفرع. هل تريد المتابعة؟',
    deleteYes: 'نعم، تعطيل',
    noData: 'لا توجد بيانات',
    loading: 'جارٍ التحميل...',
    created: 'تم إنشاء الفرع بنجاح',
    updated: 'تم تحديث الفرع بنجاح',
    deleted: 'تم تعطيل الفرع',
    error: 'حدث خطأ',
    nameError: 'يرجى إدخال اسم الفرع بالعربية والإنجليزية',
  },
  en: {
    title: 'Branches',
    add: 'Add Branch',
    addTitle: 'Add New Branch',
    editTitle: 'Edit Branch',
    colName: 'Name',
    colAddress: 'Address',
    colPhone: 'Phone',
    colProducts: 'Products',
    colInvoices: 'Invoices',
    colStatus: 'Status',
    colActions: 'Actions',
    nameAr: 'Name (Arabic)',
    nameEn: 'Name (English)',
    address: 'Address',
    phone: 'Phone',
    active: 'Active',
    activeLabel: 'Active',
    inactive: 'Inactive',
    showInactive: 'Show inactive',
    required: 'This field is required',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteTitle: 'Confirm Delete',
    deleteMessage: 'This branch will be deactivated. Continue?',
    deleteYes: 'Yes, Deactivate',
    noData: 'No data',
    loading: 'Loading...',
    created: 'Branch created successfully',
    updated: 'Branch updated successfully',
    deleted: 'Branch deactivated',
    error: 'Something went wrong',
    nameError: 'Please enter the branch name in Arabic and English',
  },
} as const;

interface BranchForm {
  nameAr: string;
  nameEn: string;
  address: string;
  phone: string;
}

const emptyForm: BranchForm = {
  nameAr: '',
  nameEn: '',
  address: '',
  phone: '',
};

export default function BranchesPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const canWrite = useAuthStore((s) => s.hasPermission('branches'));

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBranches({
        isActive: showInactive ? undefined : true,
        limit: 100,
      });
      setBranches(res.data.items);
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showInactive, l.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({
      nameAr: branch.nameAr,
      nameEn: branch.nameEn,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (form.nameAr.trim() === '' || form.nameEn.trim() === '') {
      setSnackbar({ message: l.nameError, severity: 'error' });
      return;
    }
    const payload: BranchPayload = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
    };
    try {
      if (editing) {
        await updateBranch(editing.id, payload);
        setSnackbar({ message: l.updated, severity: 'success' });
      } else {
        await createBranch(payload);
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
      const res = await deleteBranch(deleteTarget.id);
      setSnackbar({ message: res.data.message || l.deleted, severity: 'success' });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: l.colName,
      flex: 1,
      minWidth: 170,
      valueGetter: (_value, row) => (lang === 'ar' ? row.nameAr : row.nameEn),
    },
    { field: 'address', headerName: l.colAddress, flex: 1, minWidth: 160, valueGetter: (_value, row) => row.address ?? '—' },
    { field: 'phone', headerName: l.colPhone, flex: 1, minWidth: 130, valueGetter: (_value, row) => row.phone ?? '—' },
    {
      field: '_count.products',
      headerName: l.colProducts,
      width: 100,
      valueGetter: (_value, row) => row._count?.products ?? 0,
    },
    {
      field: '_count.invoices',
      headerName: l.colInvoices,
      width: 100,
      valueGetter: (_value, row) => row._count?.invoices ?? 0,
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

      <FormControlLabel
        control={
          <Checkbox
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
        }
        label={l.showInactive}
        sx={{ mb: 2 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 480, width: '100%' }}>
          <DataGrid
            rows={branches}
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
              label={l.nameAr}
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              error={form.nameAr.trim() === ''}
              helperText={form.nameAr.trim() === '' ? l.required : undefined}
              required
              fullWidth
            />
            <TextField
              label={l.nameEn}
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              error={form.nameEn.trim() === ''}
              helperText={form.nameEn.trim() === '' ? l.required : undefined}
              required
              fullWidth
            />
            <TextField
              label={l.address}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              fullWidth
            />
            <TextField
              label={l.phone}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
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