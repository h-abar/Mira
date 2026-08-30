import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  type Product,
  type StockMovement,
  type MovementType,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addMovement,
  listMovements,
  type ProductPayload,
} from '../api/inventory';
import { listSuppliers, type Supplier } from '../api/suppliers';
import { getSettings } from '../api/settings';
import { useAuthStore } from '../stores/authStore';
import { useBranchStore } from '../stores/branchStore';
import { isArabicText, isLatinText } from '../utils/languageValidation';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'المخزون',
    products: 'المنتجات',
    movements: 'الحركات',
    addProduct: 'إضافة منتج',
    editProduct: 'تعديل منتج',
    addMovement: 'إضافة حركة',
    name: 'الاسم',
    category: 'الفئة',
    quantity: 'الكمية',
    minStock: 'الحد الأدنى',
    costPrice: 'سعر التكلفة',
    salePrice: 'سعر البيع',
    supplier: 'المورد',
    barcode: 'الباركود',
    unit: 'الوحدة',
    lowStock: 'مخزون منخفض',
    lowStockOnly: 'المنخفض فقط',
    search: 'بحث',
    actions: 'إجراءات',
    edit: 'تعديل',
    activate: 'المنتج مفعل — اضغط للإيقاف',
    deactivate: 'المنتج موقوف — اضغط للتفعيل',
    activeChip: 'مفعل',
    inactiveChip: 'موقوف',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    type: 'النوع',
    reference: 'المرجع',
    product: 'المنتج',
    date: 'التاريخ',
    deleteConfirmTitle: 'تأكيد الحذف',
    deleteConfirmMessage: 'هل أنت متأكد من حذف هذا المنتج؟',
    emptyProducts: 'لا توجد منتجات',
    emptyMovements: 'لا توجد حركات',
    error: 'حدث خطأ',
    selectProduct: 'اختر المنتج أولاً',
    nameAr: 'الاسم (عربي)',
    nameEn: 'الاسم (إنجليزي)',
    nameArError: 'يجب أن يُكتب الاسم بالحروف العربية فقط',
    nameEnError: 'يجب أن يُكتب الاسم بالحروف الإنجليزية فقط',
    requiredText: 'هذا الحقل مطلوب',
  },
  en: {
    title: 'Inventory',
    products: 'Products',
    movements: 'Movements',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    addMovement: 'Add Movement',
    name: 'Name',
    category: 'Category',
    quantity: 'Quantity',
    minStock: 'Min Stock',
    costPrice: 'Cost Price',
    salePrice: 'Sale Price',
    supplier: 'Supplier',
    barcode: 'Barcode',
    unit: 'Unit',
    lowStock: 'Low Stock',
    lowStockOnly: 'Low stock only',
    search: 'Search',
    actions: 'Actions',
    edit: 'Edit',
    activate: 'Active — click to disable',
    deactivate: 'Disabled — click to enable',
    activeChip: 'Active',
    inactiveChip: 'Disabled',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    type: 'Type',
    reference: 'Reference',
    product: 'Product',
    date: 'Date',
    deleteConfirmTitle: 'Confirm Delete',
    deleteConfirmMessage: 'Are you sure you want to delete this product?',
    emptyProducts: 'No products found',
    emptyMovements: 'No movements found',
    error: 'Something went wrong',
    selectProduct: 'Please select a product first',
    nameAr: 'Name (Arabic)',
    nameEn: 'Name (English)',
    nameArError: 'Name must be written in Arabic letters only',
    nameEnError: 'Name must be written in English letters only',
    requiredText: 'This field is required',
  },
} as const;

type ChipColor = 'success' | 'primary' | 'warning' | 'error';

const typeMeta: Record<MovementType, { ar: string; en: string; color: ChipColor }> = {
  IN: { ar: 'إدخال', en: 'In', color: 'success' },
  SALE: { ar: 'بيع', en: 'Sale', color: 'primary' },
  USAGE: { ar: 'استخدام', en: 'Usage', color: 'warning' },
  LOSS: { ar: 'فقدان', en: 'Loss', color: 'error' },
};

interface ProductForm {
  nameAr: string;
  nameEn: string;
  barcode: string;
  category: string;
  quantity: string;
  unit: string;
  costPrice: string;
  salePrice: string;
  minStock: string;
  supplier: string;
}

const emptyForm = (): ProductForm => ({
  nameAr: '',
  nameEn: '',
  barcode: '',
  category: '',
  quantity: '0',
  unit: 'pcs',
  costPrice: '0',
  salePrice: '0',
  minStock: '0',
  supplier: '',
});

const money = (value: number) => Number(value).toLocaleString();

export default function InventoryPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const isAdmin = useAuthStore((s) => s.hasPermission('inventory.write'));
  const canMove = useAuthStore((s) => s.hasPermission('inventory.write'));

  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);

  // Category options: managed list from Settings + existing product categories
  // + the two defaults, so the dropdown always shows a useful set.
  const [managedCategories, setManagedCategories] = useState<string[]>([]);
  useEffect(() => {
    getSettings()
      .then((res) => {
        const raw = res.items.find((it) => it.key === 'INVENTORY_CATEGORIES')?.value ?? '';
        setManagedCategories(
          raw.split(',').map((c) => c.trim()).filter(Boolean),
        );
      })
      .catch(() => undefined);
  }, []);

  // Always-available category options + any existing product categories.
  const categories = useMemo(
    () =>
      Array.from(
        new Set([
          ...managedCategories,
          'COSMETICS',
          'PRODUCTS',
          ...products.map((p) => p.category).filter(Boolean),
        ]),
      ).sort(),
    [products, managedCategories],
  );
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [movementOpen, setMovementOpen] = useState(false);
  const [movementProductId, setMovementProductId] = useState<number | ''>('');
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [movementQty, setMovementQty] = useState('1');
  const [movementRef, setMovementRef] = useState('');
  const [movementSaving, setMovementSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    listSuppliers()
      .then((res) => setSuppliers(res.data.items))
      .catch(() => undefined);
  }, []);

  const nameOf = (product: Product) => (lang === 'ar' ? product.nameAr : product.nameEn);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listProducts({
        q: search.trim() || undefined,
        lowStock: lowStockOnly || undefined,
        branchId: selectedBranchId ?? undefined,
      });
      setProducts(res);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.error);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMovements();
      setMovements(res.data);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProducts();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStockOnly, selectedBranchId]);

  useEffect(() => {
    void loadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddProduct = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setFormOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditing(product);
    setForm({
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      barcode: product.barcode ?? '',
      category: product.category,
      quantity: String(product.quantity),
      unit: product.unit,
      costPrice: String(product.costPrice),
      salePrice: String(product.salePrice),
      minStock: String(product.minStock),
      supplier: product.supplier ?? '',
    });
    setError(null);
    setFormOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!isArabicText(form.nameAr) || !isLatinText(form.nameEn)) {
      setError(!isArabicText(form.nameAr) ? l.nameArError : l.nameEnError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: ProductPayload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        barcode: form.barcode || undefined,
        category: form.category,
        quantity: Number(form.quantity) || 0,
        unit: form.unit || 'pcs',
        costPrice: Number(form.costPrice) || 0,
        salePrice: Number(form.salePrice) || 0,
        minStock: Number(form.minStock) || 0,
        supplier: form.supplier || undefined,
        branchId: selectedBranchId,
      };
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      setFormOpen(false);
      await loadProducts();
    } catch (err) {
      setError((err as { message?: string }).message ?? l.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      await loadProducts();
    } catch (err) {
      setError((err as { message?: string }).message ?? l.error);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const next = !(product.isActive ?? true);
    try {
      await updateProduct(product.id, { isActive: next });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: next } : p)),
      );
    } catch (err) {
      setError((err as { message?: string }).message ?? l.error);
    }
  };

  const openMovementDialog = (product?: Product) => {
    setMovementProductId(product ? product.id : '');
    setMovementType('IN');
    setMovementQty('1');
    setMovementRef('');
    setError(null);
    setMovementOpen(true);
  };

  const handleSaveMovement = async () => {
    if (movementProductId === '') {
      setError(l.selectProduct);
      return;
    }
    const quantity = Number(movementQty);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError(l.error);
      return;
    }
    setMovementSaving(true);
    setError(null);
    try {
      await addMovement({
        productId: movementProductId,
        type: movementType,
        quantity,
        referenceId: movementRef || undefined,
      });
      setMovementOpen(false);
      await Promise.all([loadProducts(), loadMovements()]);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.error);
    } finally {
      setMovementSaving(false);
    }
  };

  // Stored values stay English; Arabic is a display label only.
  const categoryDisplay = (cat?: string | null): string => {
    const v = cat ?? '';
    return v === 'cafeteria' && lang === 'ar' ? 'كافيتريا' : v;
  };

  const productColumns: GridColDef<Product>[] = [
    {
      field: 'name',
      headerName: l.name,
      flex: 1.4,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{nameOf(params.row)}</span>
          {(params.row.isActive ?? true) ? (
            <Chip size="small" color="success" variant="outlined" label={l.activeChip} />
          ) : (
            <Chip size="small" color="default" variant="outlined" label={l.inactiveChip} />
          )}
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: l.category,
      flex: 1,
      valueGetter: (_v, row) => categoryDisplay(row.category),
    },
    {
      field: 'quantity',
      headerName: l.quantity,
      width: 100,
      renderCell: (params) => (
        <Typography color={params.row.quantity <= params.row.minStock ? 'error.main' : 'inherit'}>
          {params.row.quantity}
        </Typography>
      ),
    },
    {
      field: 'minStock',
      headerName: l.minStock,
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>{params.row.minStock}</span>
          {params.row.quantity <= params.row.minStock && (
            <Chip size="small" color="error" label={l.lowStock} />
          )}
        </Box>
      ),
    },
    {
      field: 'costPrice',
      headerName: l.costPrice,
      width: 110,
      renderCell: (params) => money(params.row.costPrice),
    },
    {
      field: 'salePrice',
      headerName: l.salePrice,
      width: 110,
      renderCell: (params) => money(params.row.salePrice),
    },
    { field: 'supplier', headerName: l.supplier, width: 130 },
    {
      field: 'actions',
      headerName: l.actions,
      width: 170,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip title={(params.row.isActive ?? true) ? l.activate : l.deactivate}>
            <span>
              <IconButton
                size="small"
                color={(params.row.isActive ?? true) ? 'success' : 'default'}
                onClick={() => void handleToggleActive(params.row)}
              >
                <PowerSettingsNewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {canMove && (
            <Tooltip title={l.addMovement}>
              <IconButton size="small" onClick={() => openMovementDialog(params.row)}>
                <SwapHorizIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isAdmin && (
            <>
              <Tooltip title={l.edit}>
                <IconButton size="small" onClick={() => openEditProduct(params.row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={l.delete}>
                <IconButton size="small" color="error" onClick={() => setDeleteTarget(params.row)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  const movementColumns: GridColDef<StockMovement>[] = [
    {
      field: 'product',
      headerName: l.product,
      flex: 1.4,
      renderCell: (params) =>
        params.row.product ? nameOf(params.row.product) : `#${params.row.productId}`,
    },
    {
      field: 'type',
      headerName: l.type,
      width: 120,
      renderCell: (params) => {
        const meta = typeMeta[params.row.type];
        return <Chip size="small" color={meta.color} label={lang === 'ar' ? meta.ar : meta.en} />;
      },
    },
    {
      field: 'quantity',
      headerName: l.quantity,
      width: 100,
      renderCell: (params) => {
        const isOut = params.row.type !== 'IN';
        return (
          <Typography color={isOut ? 'error.main' : 'success.main'} fontWeight={600}>
            {isOut ? '-' : '+'}
            {params.row.quantity}
          </Typography>
        );
      },
    },
    { field: 'referenceId', headerName: l.reference, width: 140 },
    {
      field: 'date',
      headerName: l.date,
      width: 190,
      renderCell: (params) => new Date(params.row.date).toLocaleString(),
    },
  ];

  return (
    <Box>
      <PageHeader title={l.title} />

      <Tabs value={tab} onChange={(_e, newValue) => setTab(newValue)} sx={{ mb: 2 }}>
        <Tab label={l.products} />
        <Tab label={l.movements} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {tab === 0 && (
        <>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ mb: 2, flexWrap: 'wrap' }}
          >
            <TextField
              size="small"
              placeholder={l.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 260 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                />
              }
              label={l.lowStockOnly}
            />
            <Box sx={{ flexGrow: 1 }} />
            {canMove && (
              <Button
                variant="outlined"
                startIcon={<SwapHorizIcon />}
                onClick={() => openMovementDialog()}
              >
                {l.addMovement}
              </Button>
            )}
            {isAdmin && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAddProduct}>
                {l.addProduct}
              </Button>
            )}
          </Stack>

          <DataGrid<Product>
            rows={products}
            columns={productColumns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            getRowClassName={(params) =>
              params.row.quantity <= params.row.minStock ? 'low-stock-row' : ''
            }
            sx={{ '& .low-stock-row': { bgcolor: 'rgba(255, 152, 0, 0.14)' } }}
          />
        </>
      )}

      {tab === 1 && (
        <DataGrid<StockMovement>
          rows={movements}
          columns={movementColumns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? l.editProduct : l.addProduct}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <TextField
              label={l.nameAr}
              value={form.nameAr}
              onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
              error={form.nameAr.trim() === '' || (form.nameAr.trim() !== '' && !isArabicText(form.nameAr))}
              helperText={
                form.nameAr.trim() === ''
                  ? l.requiredText
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
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              error={form.nameEn.trim() === '' || (form.nameEn.trim() !== '' && !isLatinText(form.nameEn))}
              helperText={
                form.nameEn.trim() === ''
                  ? l.requiredText
                  : !isLatinText(form.nameEn)
                    ? l.nameEnError
                    : undefined
              }
              required
              fullWidth
            />
            <TextField
              label={l.barcode}
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth required size="small">
              <InputLabel id="product-category-label">{l.category}</InputLabel>
              <Select
                labelId="product-category-label"
                label={l.category}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <MenuItem value="" disabled>
                  {l.category}
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {categoryDisplay(cat)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label={l.quantity}
                type="number"
                fullWidth
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              <TextField
                label={l.unit}
                fullWidth
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label={l.costPrice}
                type="number"
                fullWidth
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
              <TextField
                label={l.salePrice}
                type="number"
                fullWidth
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label={l.minStock}
                type="number"
                fullWidth
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              />
              <FormControl fullWidth size="small">
                <InputLabel id="product-supplier-label">{l.supplier}</InputLabel>
                <Select
                  labelId="product-supplier-label"
                  label={l.supplier}
                  fullWidth
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                >
                  <MenuItem value="">{lang === 'ar' ? 'بدون مورد' : 'No supplier'}</MenuItem>
                  {suppliers.map((s) => (
                    <MenuItem key={s.id} value={s.name}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>{l.cancel}</Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveProduct()}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {l.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{l.deleteConfirmTitle}</DialogTitle>
        <DialogContent>
          <Typography>{l.deleteConfirmMessage}</Typography>
          {deleteTarget && (
            <Typography fontWeight={600} sx={{ mt: 1 }}>
              {nameOf(deleteTarget)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{l.cancel}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleDelete()}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {l.delete}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={movementOpen} onClose={() => setMovementOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{l.addMovement}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="movement-product-label">{l.product}</InputLabel>
              <Select
                labelId="movement-product-label"
                label={l.product}
                value={movementProductId}
                onChange={(e) => setMovementProductId(e.target.value as number | '')}
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {nameOf(product)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="movement-type-label">{l.type}</InputLabel>
              <Select
                labelId="movement-type-label"
                label={l.type}
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as MovementType)}
              >
                {(Object.keys(typeMeta) as MovementType[]).map((type) => {
                  const meta = typeMeta[type];
                  return (
                    <MenuItem key={type} value={type}>
                      {lang === 'ar' ? meta.ar : meta.en}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <TextField
              label={l.quantity}
              type="number"
              value={movementQty}
              onChange={(e) => setMovementQty(e.target.value)}
              inputProps={{ min: 1 }}
              fullWidth
            />
            <TextField
              label={l.reference}
              value={movementRef}
              onChange={(e) => setMovementRef(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementOpen(false)}>{l.cancel}</Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveMovement()}
            disabled={movementSaving}
            startIcon={
              movementSaving ? <CircularProgress size={18} color="inherit" /> : undefined
            }
          >
            {l.save}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}