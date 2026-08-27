import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Switch from '@mui/material/Switch';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  listServices,
  createService,
  updateService,
  deleteService,
  type Service,
  type ServiceInput,
} from '../api/services';
import { useAuthStore } from '../stores/authStore';
import { isArabicText, isLatinText } from '../utils/languageValidation';
import { getSettings, updateSettings } from '../api/settings';
import PageHeader from '../components/PageHeader';

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

interface ServiceForm {
  nameAr: string;
  nameEn: string;
  category: string;
  price: string;
  durationMinutes: string;
  cost: string;
  isActive: boolean;
}

const emptyForm: ServiceForm = {
  nameAr: '',
  nameEn: '',
  category: '',
  price: '',
  durationMinutes: '',
  cost: '',
  isActive: true,
};

const NEW_CATEGORY_OPTION = '__enter_new_category__';

export default function ServicesPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const canWrite = useAuthStore((s) => s.hasPermission('services.write'));

  const labels = useMemo(
    () =>
      lang === 'ar'
        ? {
            title: 'الخدمات',
            add: 'إضافة خدمة',
            addTitle: 'إضافة خدمة جديدة',
            editTitle: 'تعديل الخدمة',
            colName: 'الاسم',
            colCategory: 'الفئة',
            colPrice: 'السعر',
            colDuration: 'المدة (دقيقة)',
            colActive: 'مفعلة',
            colActions: 'إجراءات',
            nameAr: 'الاسم بالعربية',
            nameEn: 'الاسم بالإنجليزية',
            category: 'الفئة',
            price: 'السعر',
            durationMinutes: 'المدة (دقيقة)',
            cost: 'التكلفة',
            active: 'مفعلة',
            required: 'هذا الحقل مطلوب',
            nameArError: 'يجب أن يُكتب الاسم بالحروف العربية فقط',
            nameEnError: 'يجب أن يُكتب الاسم بالحروف الإنجليزية فقط',
            save: 'حفظ',
            cancel: 'إلغاء',
            delete: 'حذف',
            confirmDeleteTitle: 'تأكيد الحذف',
            confirmDeleteMessage:
              'هل أنت متأكد من حذف هذه الخدمة؟ إذا كانت مستخدمة في مواعيد أو فواتير فلن يمكن حذفها ويمكنك تعطيلها بدلاً من ذلك.',
            deleteYes: 'حذف',
            noData: 'لا توجد بيانات',
            loading: 'جارٍ التحميل...',
            created: 'تم إنشاء الخدمة بنجاح',
            updated: 'تم تحديث الخدمة بنجاح',
            deleted: 'تم حذف الخدمة بنجاح',
            renameHint: 'انقر مرتين لتعديل الاسم مباشرة',
            viewGrid: 'عرض بطاقات',
            viewTable: 'عرض جدول',
            allCategories: 'كل الفئات',
            searchPlaceholder: 'بحث بالاسم...',
            minutes: 'دقيقة',
            categoryHint: 'اختر فئة موجودة أو اكتب اسم فئة جديدة',
            enterNewCategory: 'إدخال فئة جديدة',
            newCategoryName: 'اسم الفئة الجديدة',
            newCategoryHint: 'اكتب اسم الفئة الجديدة هنا',
          }
        : {
            title: 'Services',
            add: 'Add Service',
            addTitle: 'Add New Service',
            editTitle: 'Edit Service',
            colName: 'Name',
            colCategory: 'Category',
            colPrice: 'Price',
            colDuration: 'Duration (min)',
            colActive: 'Active',
            colActions: 'Actions',
            nameAr: 'Name (Arabic)',
            nameEn: 'Name (English)',
            category: 'Category',
            price: 'Price',
            durationMinutes: 'Duration (minutes)',
            cost: 'Cost',
            active: 'Active',
            required: 'This field is required',
            nameArError: 'Name must be written in Arabic letters only',
            nameEnError: 'Name must be written in English letters only',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            confirmDeleteTitle: 'Confirm Delete',
            confirmDeleteMessage:
              'Are you sure you want to delete this service? If it is used in appointments or invoices it cannot be deleted and you may deactivate it instead.',
            deleteYes: 'Delete',
            noData: 'No data',
            loading: 'Loading...',
            created: 'Service created successfully',
            updated: 'Service updated successfully',
            deleted: 'Service deleted successfully',
            renameHint: 'Double-click to rename directly',
            viewGrid: 'Card view',
            viewTable: 'Table view',
            allCategories: 'All categories',
            searchPlaceholder: 'Search by name...',
            minutes: 'min',
            categoryHint: 'Select an existing category or type a new one',
            enterNewCategory: 'Enter new category',
            newCategoryName: 'New category name',
            newCategoryHint: 'Type the new category name here',
          },
    [lang],
  );

  const nameOf = (service: Service): string => (lang === 'ar' ? service.nameAr : service.nameEn);

  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [toggleId, setToggleId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(
    null,
  );
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [settingCategories, setSettingCategories] = useState<string[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((res) => {
        if (cancelled) return;
        const raw = res.items.find((it) => it.key === 'SERVICES_CATEGORIES')?.value ?? '';
        const list = raw
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c !== '');
        setSettingCategories(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.category) set.add(r.category); });
    settingCategories.forEach((c) => set.add(c));
    return Array.from(set).sort();
  }, [rows, settingCategories]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (q && !nameOf(r).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, categoryFilter, search, lang]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listServices()
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

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      nameAr: service.nameAr,
      nameEn: service.nameEn,
      category: service.category,
      price: String(service.price ?? 0),
      durationMinutes: String(service.durationMinutes ?? 0),
      cost: String(service.cost ?? 0),
      isActive: service.isActive,
    });
    setDialogOpen(true);
  };

  const formValid = (): boolean => {
    const price = Number(form.price);
    const duration = Number(form.durationMinutes);
    const costOk = form.cost.trim() === '' || !Number.isNaN(Number(form.cost));
    return (
      form.nameAr.trim() !== '' &&
      isArabicText(form.nameAr) &&
      form.nameEn.trim() !== '' &&
      isLatinText(form.nameEn) &&
      form.category.trim() !== '' &&
      !Number.isNaN(price) &&
      price > 0 &&
      !Number.isNaN(duration) &&
      duration > 0 &&
      Number.isInteger(duration) &&
      costOk
    );
  };

  const handleSave = async () => {
    if (!formValid()) return;
    const payload: ServiceInput = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      cost: form.cost.trim() === '' ? 0 : Number(form.cost),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await updateService(editing.id, payload);
        setSnackbar({ message: labels.updated, severity: 'success' });
      } else {
        await createService(payload);
        setSnackbar({ message: labels.created, severity: 'success' });
      }
      if (!settingCategories.includes(payload.category)) {
        const next = [...settingCategories, payload.category].sort();
        setSettingCategories(next);
        try {
          await updateSettings({ SERVICES_CATEGORIES: next.join(',') });
        } catch {
          // category still saved on the service; settings sync is best-effort
        }
      }
      setDialogOpen(false);
      setRefresh((n) => n + 1);
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.id);
      setSnackbar({ message: labels.deleted, severity: 'success' });
      setDeleteTarget(null);
      setRefresh((n) => n + 1);
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (service: Service, isActive: boolean) => {
    setToggleId(service.id);
    try {
      const updated = await updateService(service.id, { isActive });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setToggleId(null);
    }
  };

  const startRename = (service: Service) => {
    if (!canWrite) return;
    setRenameId(service.id);
    setRenameValue(nameOf(service));
  };

  const commitRename = async (service: Service) => {
    const value = renameValue.trim();
    if (!value || value === nameOf(service)) {
      setRenameId(null);
      return;
    }
    const field = lang === 'ar' ? 'nameAr' : 'nameEn';
    const valid = lang === 'ar' ? isArabicText(value) : isLatinText(value);
    if (!valid) {
      setSnackbar({
        message: lang === 'ar' ? labels.nameArError : labels.nameEnError,
        severity: 'error',
      });
      setRenameId(null);
      return;
    }
    try {
      const updated = await updateService(service.id, { [field]: value });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSnackbar({ message: labels.updated, severity: 'success' });
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setRenameId(null);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: labels.colName,
      flex: 1,
      minWidth: 180,
      valueGetter: (_value: unknown, row: any) => nameOf(row as Service),
      renderCell: (params: GridRenderCellParams) => {
        const service = params.row as Service;
        if (renameId === service.id) {
          return (
            <TextField
              size="small"
              value={renameValue}
              autoFocus
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => void commitRename(service)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setRenameId(null);
                }
              }}
            />
          );
        }
        return (
          <Box
            onDoubleClick={() => startRename(service)}
            title={canWrite ? labels.renameHint : undefined}
            sx={{
              cursor: canWrite ? 'text' : 'default',
              minHeight: 28,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {nameOf(service)}
          </Box>
        );
      },
    },
    { field: 'category', headerName: labels.colCategory, width: 140 },
    {
      field: 'price',
      headerName: labels.colPrice,
      width: 110,
      renderCell: (params: GridRenderCellParams) => formatMoney(params.value),
    },
    { field: 'durationMinutes', headerName: labels.colDuration, width: 130 },
    {
      field: 'isActive',
      headerName: labels.colActive,
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => {
        const service = params.row as Service;
        return (
          <Switch
            checked={Boolean(service.isActive)}
            disabled={!canWrite || toggleId === service.id}
            size="small"
            onChange={(e) => void handleToggleActive(service, e.target.checked)}
          />
        );
      },
    },
    ...(canWrite
      ? [
          {
            field: 'actions',
            headerName: labels.colActions,
            width: 110,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params: GridRenderCellParams) => {
              const service = params.row as Service;
              return (
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(service);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(service);
                    }}
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
        title={labels.title}
        actions={
          canWrite && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={openAdd}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {labels.add}
            </Button>
          )
        }
      />

      <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" sx={{ mb: 2, gap: 1 }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(_e, v) => { if (v) setView(v as 'grid' | 'table'); }}
        >
          <ToggleButton value="grid"><ViewModuleIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="table"><ViewListIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={categoryFilter}
          exclusive
          size="small"
          onChange={(_e, v) => setCategoryFilter(v ?? 'all')}
          sx={{ flexWrap: 'wrap' }}
        >
          <ToggleButton value="all">{labels.allCategories}</ToggleButton>
          {categories.map((c) => (
            <ToggleButton key={c} value={c}>{c}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TextField
          placeholder={labels.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          }}
        />
      </Stack>

      {view === 'grid' ? (
        filteredRows.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {labels.noData}
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredRows.map((service) => {
              const duration = service.durationMinutes;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={service.id}>
                  <Card
                    sx={{
                      height: '100%',
                      opacity: service.isActive ? 1 : 0.55,
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
                      cursor: 'pointer',
                    }}
                    onClick={() => canWrite && openEdit(service)}
                  >
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Chip label={service.category || '—'} size="small" color="primary" variant="outlined" />
                        {canWrite && (
                          <Switch
                            checked={Boolean(service.isActive)}
                            disabled={toggleId === service.id}
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => void handleToggleActive(service, e.target.checked)}
                          />
                        )}
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }} gutterBottom>
                        {nameOf(service)}
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 800, mt: 1 }}>
                        {formatMoney(service.price)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {duration ? `${duration} ${labels.minutes}` : '—'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )
      ) : (
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
              ? { noRowsLabel: labels.noData, noResultsOverlayLabel: labels.noData }
              : undefined
          }
          disableRowSelectionOnClick
        />
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? labels.editTitle : labels.addTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={labels.nameAr}
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              error={form.nameAr.trim() === '' || (form.nameAr.trim() !== '' && !isArabicText(form.nameAr))}
              helperText={
                form.nameAr.trim() === ''
                  ? labels.required
                  : !isArabicText(form.nameAr)
                    ? labels.nameArError
                    : undefined
              }
              required
              fullWidth
            />
            <TextField
              label={labels.nameEn}
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              error={form.nameEn.trim() === '' || (form.nameEn.trim() !== '' && !isLatinText(form.nameEn))}
              helperText={
                form.nameEn.trim() === ''
                  ? labels.required
                  : !isLatinText(form.nameEn)
                    ? labels.nameEnError
                    : undefined
              }
              required
              fullWidth
            />
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                freeSolo
                openOnFocus
                options={[...categories, NEW_CATEGORY_OPTION]}
                value={form.category}
                getOptionLabel={(option) =>
                  typeof option === 'string' && option !== NEW_CATEGORY_OPTION ? option : ''
                }
                onInputChange={(_, newValue) => {
                  if (newValue === NEW_CATEGORY_OPTION) return;
                  setShowNewCategory(false);
                  setForm((f) => ({ ...f, category: newValue ?? '' }));
                }}
                onChange={(_, newValue) => {
                  if (newValue === NEW_CATEGORY_OPTION) {
                    setShowNewCategory(true);
                    setForm((f) => ({ ...f, category: '' }));
                    return;
                  }
                  setShowNewCategory(false);
                  setForm((f) => ({ ...f, category: newValue ?? '' }));
                }}
                fullWidth
                renderOption={(props, option) => {
                  if (option === NEW_CATEGORY_OPTION) {
                    const { key, ...rest } = props as { key?: string };
                    return (
                      <Box component="li" key={key ?? 'new-category'} {...rest} sx={{ gap: 1, color: 'primary.main', fontWeight: 600 }}>
                        <AddIcon fontSize="small" />
                        {labels.enterNewCategory}
                      </Box>
                    );
                  }
                  const { key, ...rest } = props as { key?: string };
                  return (
                    <Box component="li" key={key} {...rest}>
                      {option}
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={labels.category}
                    required
                    error={form.category.trim() === ''}
                    helperText={
                      form.category.trim() === ''
                        ? labels.required
                        : !categories.includes(form.category.trim())
                          ? labels.categoryHint
                          : undefined
                    }
                  />
                )}
              />
              <TextField
                label={labels.price}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                error={form.price !== '' && Number(form.price) <= 0}
                fullWidth
                required
              />
              <TextField
                label={labels.durationMinutes}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                type="number"
                inputProps={{ min: 1, step: 1 }}
                error={form.durationMinutes !== '' && Number(form.durationMinutes) <= 0}
                fullWidth
                required
              />
            </Stack>
            {showNewCategory && (
              <TextField
                autoFocus
                label={labels.newCategoryName}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                error={form.category.trim() === ''}
                helperText={
                  form.category.trim() === ''
                    ? labels.newCategoryHint
                    : undefined
                }
                required
                fullWidth
              />
            )}
            <TextField
              label={labels.cost}
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label={labels.active}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{labels.cancel}</Button>
          <Button onClick={() => void handleSave()} variant="contained" disabled={!formValid()}>
            {labels.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{labels.confirmDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{labels.confirmDeleteMessage}</Typography>
          {deleteTarget && (
            <Typography fontWeight={600} sx={{ mt: 1 }}>
              {nameOf(deleteTarget)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{labels.cancel}</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
            {labels.deleteYes}
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