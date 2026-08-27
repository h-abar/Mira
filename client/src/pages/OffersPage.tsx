import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Switch from '@mui/material/Switch';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import {
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  type Offer,
  type OfferInput,
  type DiscountType,
} from '../api/offers';
import { useAuthStore } from '../stores/authStore';
import { isArabicText, isLatinText } from '../utils/languageValidation';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'العروض والكوبونات',
    add: 'إضافة عرض',
    editTitle: 'تعديل العرض',
    addTitle: 'إضافة عرض جديد',
    search: 'بحث...',
    colCode: 'الكود',
    colName: 'الاسم',
    colType: 'النوع',
    colValue: 'القيمة',
    colValidity: 'الصلاحية',
    colActive: 'مفعل',
    colActions: 'إجراءات',
    code: 'الكود',
    nameAr: 'الاسم (عربي)',
    nameEn: 'الاسم (إنجليزي)',
    discountType: 'نوع الخصم',
    percent: 'نسبة مئوية',
    fixed: 'قيمة ثابتة',
    value: 'القيمة',
    validFrom: 'يبدأ من',
    validTo: 'ينتهي في',
    minTotal: 'الحد الأدنى للفاتورة',
    active: 'مفعل',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    deleteConfirmTitle: 'تأكيد الحذف',
    deleteConfirmMessage: 'هل أنت متأكد من حذف هذا العرض؟',
    deleteYes: 'حذف',
    noData: 'لا توجد بيانات',
    loading: 'جارٍ التحميل...',
    created: 'تم إنشاء العرض بنجاح',
    updated: 'تم تحديث العرض بنجاح',
    deleted: 'تم حذف العرض بنجاح',
    required: 'هذا الحقل مطلوب',
    nameArError: 'يجب أن يُكتب الاسم بالحروف العربية فقط',
    nameEnError: 'يجب أن يُكتب الاسم بالحروف الإنجليزية فقط',
    valueError: 'يجب أن تكون القيمة أكبر من صفر',
    valid: 'ساري',
    expired: 'منتهي',
    upcoming: 'لم يبدأ',
    inactive: 'غير مفعل',
    noValidity: 'دائم',
  },
  en: {
    title: 'Offers & Coupons',
    add: 'Add Offer',
    editTitle: 'Edit Offer',
    addTitle: 'Add New Offer',
    search: 'Search...',
    colCode: 'Code',
    colName: 'Name',
    colType: 'Type',
    colValue: 'Value',
    colValidity: 'Validity',
    colActive: 'Active',
    colActions: 'Actions',
    code: 'Code',
    nameAr: 'Name (Arabic)',
    nameEn: 'Name (English)',
    discountType: 'Discount Type',
    percent: 'Percent',
    fixed: 'Fixed',
    value: 'Value',
    validFrom: 'Valid From',
    validTo: 'Valid To',
    minTotal: 'Min Invoice Total',
    active: 'Active',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirmTitle: 'Confirm Delete',
    deleteConfirmMessage: 'Are you sure you want to delete this offer?',
    deleteYes: 'Delete',
    noData: 'No data',
    loading: 'Loading...',
    created: 'Offer created successfully',
    updated: 'Offer updated successfully',
    deleted: 'Offer deleted successfully',
    required: 'This field is required',
    nameArError: 'Name must be written in Arabic letters only',
    nameEnError: 'Name must be written in English letters only',
    valueError: 'Value must be greater than zero',
    valid: 'Valid',
    expired: 'Expired',
    upcoming: 'Not started',
    inactive: 'Inactive',
    noValidity: 'Always',
  },
} as const;

const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Request failed';
};

const formatMoney = (value: unknown): string => {
  const num = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  if (Number.isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface OfferForm {
  code: string;
  nameAr: string;
  nameEn: string;
  discountType: DiscountType;
  value: string;
  validFrom: Dayjs | null;
  validTo: Dayjs | null;
  minTotal: string;
  isActive: boolean;
}

const emptyForm = (): OfferForm => ({
  code: '',
  nameAr: '',
  nameEn: '',
  discountType: 'PERCENT',
  value: '',
  validFrom: null,
  validTo: null,
  minTotal: '0',
  isActive: true,
});

export default function OffersPage() {
  const { i18n } = useTranslation();
  const hasRole = useAuthStore((s) => s.hasPermission('offers'));
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const canWrite = hasRole;

  const nameOf = (offer: Offer): string => (lang === 'ar' ? offer.nameAr : offer.nameEn);

  const [rows, setRows] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleId, setToggleId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(
    null,
  );
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listOffers()
      .then((items) => {
        if (!cancelled) setRows(items);
      })
      .catch((err) => {
        if (!cancelled) setSnackbar({ message: getErrorMessage(err), severity: 'error' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (offer) =>
        offer.code.toLowerCase().includes(q) ||
        offer.nameAr.toLowerCase().includes(q) ||
        offer.nameEn.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditing(offer);
    setForm({
      code: offer.code,
      nameAr: offer.nameAr,
      nameEn: offer.nameEn,
      discountType: offer.discountType,
      value: String(Number(offer.value)),
      validFrom: offer.validFrom ? dayjs(offer.validFrom) : null,
      validTo: offer.validTo ? dayjs(offer.validTo) : null,
      minTotal: String(Number(offer.minTotal)),
      isActive: offer.isActive,
    });
    setDialogOpen(true);
  };

  const formValid = (): boolean => {
    const value = Number(form.value);
    const minTotal = form.minTotal.trim() === '' ? 0 : Number(form.minTotal);
    return (
      form.code.trim() !== '' &&
      isArabicText(form.nameAr) &&
      isLatinText(form.nameEn) &&
      !Number.isNaN(value) &&
      value > 0 &&
      !Number.isNaN(minTotal) &&
      minTotal >= 0
    );
  };

  const handleSave = async () => {
    if (!formValid()) return;
    const payload: OfferInput = {
      code: form.code.trim().toUpperCase(),
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      discountType: form.discountType,
      value: Number(form.value),
      validFrom: form.validFrom ? form.validFrom.format('YYYY-MM-DD') : undefined,
      validTo: form.validTo ? form.validTo.format('YYYY-MM-DD') : undefined,
      minTotal: form.minTotal.trim() === '' ? 0 : Number(form.minTotal),
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateOffer(editing.id, payload);
        setSnackbar({ message: l.updated, severity: 'success' });
      } else {
        await createOffer(payload);
        setSnackbar({ message: l.created, severity: 'success' });
      }
      setDialogOpen(false);
      setRefresh((n) => n + 1);
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOffer(deleteTarget.id);
      setSnackbar({ message: l.deleted, severity: 'success' });
      setDeleteTarget(null);
      setRefresh((n) => n + 1);
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (offer: Offer, isActive: boolean) => {
    setToggleId(offer.id);
    try {
      const updated = await updateOffer(offer.id, { isActive });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setToggleId(null);
    }
  };

  const validityLabel = (offer: Offer): { text: string; color: 'success' | 'error' | 'warning' | 'default' } => {
    if (!offer.isActive) {
      return { text: l.inactive, color: 'default' };
    }
    const now = dayjs();
    if (offer.validFrom && now.isBefore(dayjs(offer.validFrom))) {
      return { text: l.upcoming, color: 'warning' };
    }
    if (offer.validTo && now.isAfter(dayjs(offer.validTo))) {
      return { text: l.expired, color: 'error' };
    }
    return { text: l.valid, color: 'success' };
  };

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return l.noValidity;
    const d = dayjs(value);
    if (!d.isValid()) return '—';
    return d.format(lang === 'ar' ? 'DD/MM/YYYY' : 'MM/DD/YYYY');
  };

  const typeLabel = (type: DiscountType): string => (type === 'PERCENT' ? l.percent : l.fixed);

  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: l.colCode,
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontWeight={600} sx={{ fontFamily: 'monospace' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: l.colName,
      flex: 1,
      minWidth: 180,
      valueGetter: (_value: unknown, row: any) => nameOf(row as Offer),
      renderCell: (params: GridRenderCellParams) => nameOf(params.row as Offer),
    },
    {
      field: 'discountType',
      headerName: l.colType,
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip size="small" variant="outlined" label={typeLabel(params.value as DiscountType)} />
      ),
    },
    {
      field: 'value',
      headerName: l.colValue,
      width: 110,
      renderCell: (params: GridRenderCellParams) => {
        const offer = params.row as Offer;
        return offer.discountType === 'PERCENT' ? `${Number(offer.value)}%` : formatMoney(offer.value);
      },
    },
    {
      field: 'validity',
      headerName: l.colValidity,
      flex: 1,
      minWidth: 200,
      valueGetter: (_value: unknown, row: Offer) =>
        `${formatDate(row.validFrom)} — ${formatDate(row.validTo)}`,
    },
    {
      field: 'status',
      headerName: l.colActive,
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => {
        const meta = validityLabel(params.row as Offer);
        return <Chip size="small" color={meta.color} label={meta.text} />;
      },
    },
    {
      field: 'isActive',
      headerName: l.colActive,
      width: 90,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => {
        const offer = params.row as Offer;
        return (
          <Switch
            checked={Boolean(offer.isActive)}
            disabled={!canWrite || toggleId === offer.id}
            size="small"
            onChange={(e) => void handleToggleActive(offer, e.target.checked)}
          />
        );
      },
    },
    ...(canWrite
      ? [
          {
            field: 'actions',
            headerName: l.colActions,
            width: 110,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params: GridRenderCellParams) => {
              const offer = params.row as Offer;
              return (
                <Stack direction="row" spacing={0.5}>
                  <IconButton size="small" onClick={() => openEdit(offer)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(offer)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            },
          } as GridColDef,
        ]
      : []),
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
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2, maxWidth: 480 }}
      />

      <DataGrid
        rows={filteredRows}
        columns={columns}
        loading={loading}
        autoHeight
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        localeText={
          lang === 'ar'
            ? {
                noRowsLabel: l.noData,
                noResultsOverlayLabel: l.noData,
              }
            : undefined
        }
        disableRowSelectionOnClick
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? l.editTitle : l.addTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={l.code}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              error={form.code.trim() === ''}
              helperText={form.code.trim() === '' ? l.required : undefined}
              required
              fullWidth
            />
            <TextField
              label={l.nameAr}
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              error={form.nameAr.trim() === '' || (form.nameAr.trim() !== '' && !isArabicText(form.nameAr))}
              helperText={
                form.nameAr.trim() === ''
                  ? l.required
                  : !isArabicText(form.nameAr)
                    ? l.nameArError
                    : undefined
              }
              required
              fullWidth
            />
            <TextField
              label={l.nameEn}
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              error={form.nameEn.trim() === '' || (form.nameEn.trim() !== '' && !isLatinText(form.nameEn))}
              helperText={
                form.nameEn.trim() === ''
                  ? l.required
                  : !isLatinText(form.nameEn)
                    ? l.nameEnError
                    : undefined
              }
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>{l.discountType}</InputLabel>
                <Select
                  label={l.discountType}
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
                >
                  <MenuItem value="PERCENT">{l.percent}</MenuItem>
                  <MenuItem value="FIXED">{l.fixed}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={l.value}
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                error={form.value !== '' && Number(form.value) <= 0}
                helperText={form.value !== '' && Number(form.value) <= 0 ? l.valueError : undefined}
                required
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label={l.validFrom}
                value={form.validFrom}
                onChange={(value: Dayjs | null) => setForm((f) => ({ ...f, validFrom: value }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label={l.validTo}
                value={form.validTo}
                onChange={(value: Dayjs | null) => setForm((f) => ({ ...f, validTo: value }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>
            <TextField
              label={l.minTotal}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              value={form.minTotal}
              onChange={(e) => setForm({ ...form, minTotal: e.target.value })}
              fullWidth
            />
            <Stack direction="row" alignItems="center">
              <Typography>{l.active}</Typography>
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{l.cancel}</Button>
          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={!formValid() || saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {l.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{l.deleteConfirmTitle}</DialogTitle>
        <DialogContent>
          <Typography>{l.deleteConfirmMessage}</Typography>
          {deleteTarget && (
            <Typography fontWeight={600} sx={{ mt: 1 }}>
              {deleteTarget.code} — {nameOf(deleteTarget)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{l.cancel}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {l.deleteYes}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: lang === 'ar' ? 'right' : 'left' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity ?? 'success'}
          variant="filled"
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}