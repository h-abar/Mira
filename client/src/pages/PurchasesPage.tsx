import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseStatus,
  type PurchasePaymentMethod,
} from '../api/purchases';
import { listSuppliers, type Supplier } from '../api/suppliers';
import { listProducts, type Product } from '../api/inventory';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'أوامر الشراء',
    add: 'أمر شراء جديد',
    colOrderNo: 'رقم الأمر',
    colSupplier: 'المورد',
    colDate: 'التاريخ',
    colStatus: 'الحالة',
    colTotal: 'الإجمالي',
    colActions: 'إجراءات',
    pending: 'معلق',
    received: 'مستلم',
    cancelled: 'ملغي',
    details: 'التفاصيل',
    receive: 'استلام',
    cancel: 'إلغاء',
    noData: 'لا توجد بيانات',
    loading: 'جارٍ التحميل...',
    supplier: 'المورد',
    item: 'الصنف',
    productName: 'اسم المنتج (حر أو منتج)',
    selectProduct: 'اختر منتجاً',
    quantity: 'الكمية',
    unitCost: 'سعر الوحدة',
    lineTotal: 'إجمالي السطر',
    discount: 'الخصم',
    paymentMethod: 'طريقة الدفع',
    notes: 'ملاحظات',
    cash: 'نقدي',
    card: 'شبكة',
    wallet: 'محفظة',
    subtotal: 'الإجمالي الفرعي',
    total: 'الإجمالي',
    save: 'حفظ',
    cancelDialog: 'إلغاء',
    close: 'إغلاق',
    addRow: 'إضافة سطر',
    created: 'تم إنشاء أمر الشراء بنجاح',
    receivedOk: 'تم استلام أمر الشراء وإضافة المخزون',
    cancelledOk: 'تم إلغاء أمر الشراء',
    error: 'حدث خطأ',
    confirmReceive: 'استلام هذا الأمر سيضيف الكميات إلى المخزون ويسجل مصروف مشتريات. متابعة؟',
    confirmCancel: 'هل تريد إلغاء هذا الأمر؟',
    yes: 'نعم',
    filterAll: 'الكل',
  },
  en: {
    title: 'Purchase Orders',
    add: 'New Purchase Order',
    colOrderNo: 'Order No',
    colSupplier: 'Supplier',
    colDate: 'Date',
    colStatus: 'Status',
    colTotal: 'Total',
    colActions: 'Actions',
    pending: 'Pending',
    received: 'Received',
    cancelled: 'Cancelled',
    details: 'Details',
    receive: 'Receive',
    cancel: 'Cancel',
    noData: 'No data',
    loading: 'Loading...',
    supplier: 'Supplier',
    item: 'Item',
    productName: 'Product name (free or product)',
    selectProduct: 'Select a product',
    quantity: 'Quantity',
    unitCost: 'Unit Cost',
    lineTotal: 'Line Total',
    discount: 'Discount',
    paymentMethod: 'Payment Method',
    notes: 'Notes',
    cash: 'Cash',
    card: 'Card',
    wallet: 'Wallet',
    subtotal: 'Subtotal',
    total: 'Total',
    save: 'Save',
    cancelDialog: 'Cancel',
    close: 'Close',
    addRow: 'Add row',
    created: 'Purchase order created successfully',
    receivedOk: 'Purchase received and stock updated',
    cancelledOk: 'Purchase order cancelled',
    error: 'Something went wrong',
    confirmReceive:
      'Receiving this order will add quantities to stock and record a purchase expense. Continue?',
    confirmCancel: 'Cancel this order?',
    yes: 'Yes',
    filterAll: 'All',
  },
} as const;

type Labels = (typeof L)[keyof typeof L];

const statusColor: Record<PurchaseStatus, 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'error',
};

const statusLabel = (status: PurchaseStatus, l: Labels) =>
  status === 'PENDING' ? l.pending : status === 'RECEIVED' ? l.received : l.cancelled;

interface ItemRow {
  productId?: number;
  productName: string;
  quantity: string;
  unitCost: string;
}

export default function PurchasesPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const canWrite = useAuthStore((s) => s.hasPermission('purchases'));

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({
    supplierId: '' as string,
    discount: '',
    paymentMethod: 'CASH' as PurchasePaymentMethod,
    notes: '',
    items: [] as ItemRow[],
  });
  const [details, setDetails] = useState<PurchaseOrder | null>(null);
  const [confirm, setConfirm] = useState<{ order: PurchaseOrder; action: 'receive' | 'cancel' } | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPurchaseOrders({
        status: statusFilter || undefined,
        limit: 100,
      });
      setOrders(res.data.items);
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const openCreate = async () => {
    setForm({ supplierId: '', discount: '', paymentMethod: 'CASH', notes: '', items: [] });
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        listSuppliers({ limit: 100 }),
        listProducts({}),
      ]);
      setSuppliers(suppliersRes.data.items);
      setProducts(productsRes);
    } catch {
      // ignore
    }
    setDialogOpen(true);
  };

  const addRow = () =>
    setForm((f) => ({ ...f, items: [...f.items, { productName: '', quantity: '1', unitCost: '' }] }));

  const updateRow = (index: number, patch: Partial<ItemRow>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    }));

  const removeRow = (index: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== index) }));

  const itemSubtotal = (item: ItemRow) =>
    (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);

  const subtotal = form.items.reduce((sum, item) => sum + itemSubtotal(item), 0);
  const discount = Number(form.discount) || 0;
  const total = Math.max(subtotal - discount, 0);

  const handleCreate = async () => {
    if (form.items.length === 0) {
      setSnackbar({ message: l.error, severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      await createPurchaseOrder({
        supplierId: form.supplierId ? Number(form.supplierId) : undefined,
        items: form.items.map((item) => ({
          productId: item.productId,
          productName: item.productName.trim() || undefined,
          quantity: Number(item.quantity) || 1,
          unitCost: Number(item.unitCost) || 0,
        })),
        discount: discount || undefined,
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim() || undefined,
      });
      setSnackbar({ message: l.created, severity: 'success' });
      setDialogOpen(false);
      await loadOrders();
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (order: PurchaseOrder) => {
    try {
      const res = await getPurchaseOrder(order.id);
      setDetails(res.data);
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.action === 'receive') {
        await receivePurchaseOrder(confirm.order.id);
        setSnackbar({ message: l.receivedOk, severity: 'success' });
      } else {
        await cancelPurchaseOrder(confirm.order.id);
        setSnackbar({ message: l.cancelledOk, severity: 'success' });
      }
      setConfirm(null);
      await loadOrders();
    } catch (err) {
      setSnackbar({ message: (err as ApiError).message || l.error, severity: 'error' });
    }
  };

  const columns: GridColDef[] = [
    { field: 'orderNo', headerName: l.colOrderNo, width: 190 },
    {
      field: 'supplier',
      headerName: l.colSupplier,
      flex: 1,
      minWidth: 150,
      valueGetter: (value: { name?: string } | null | undefined) => value?.name ?? '—',
    },
    {
      field: 'date',
      headerName: l.colDate,
      width: 130,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'status',
      headerName: l.colStatus,
      width: 120,
      renderCell: (params) => (
        <Chip size="small" color={statusColor[params.row.status as PurchaseStatus]} label={statusLabel(params.row.status as PurchaseStatus, l)} />
      ),
    },
    {
      field: 'total',
      headerName: l.colTotal,
      width: 120,
      valueFormatter: (value: number) => Number(value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: l.colActions,
      width: 170,
      sortable: false,
      renderCell: (params) => {
        const order = params.row as PurchaseOrder;
        return (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => openDetails(order)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            {canWrite && order.status === 'PENDING' && (
              <>
                <Button size="small" color="success" onClick={() => setConfirm({ order, action: 'receive' })}>
                  {l.receive}
                </Button>
                <IconButton size="small" color="error" onClick={() => setConfirm({ order, action: 'cancel' })}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title={l.title}
        actions={
          canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              {l.add}
            </Button>
          )
        }
      />

      <FormControl size="small" sx={{ mb: 2, minWidth: 160 }}>
        <InputLabel>{l.colStatus}</InputLabel>
        <Select
          label={l.colStatus}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PurchaseStatus | '')}
        >
          <MenuItem value="">{l.filterAll}</MenuItem>
          <MenuItem value="PENDING">{l.pending}</MenuItem>
          <MenuItem value="RECEIVED">{l.received}</MenuItem>
          <MenuItem value="CANCELLED">{l.cancelled}</MenuItem>
        </Select>
      </FormControl>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 480, width: '100%' }}>
          <DataGrid
            rows={orders}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{l.add}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{l.supplier}</InputLabel>
              <Select
                label={l.supplier}
                value={form.supplierId}
                onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
              >
                {suppliers
                  .filter((supplier) => supplier.isActive)
                  .map((supplier) => (
                    <MenuItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {form.items.map((item, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <FormControl fullWidth size="small">
                  <InputLabel>{l.selectProduct}</InputLabel>
                  <Select
                    label={l.selectProduct}
                    value={item.productId ?? ''}
                    onChange={(e) => {
                      const product = products.find((p) => p.id === Number(e.target.value));
                      updateRow(index, {
                        productId: e.target.value ? Number(e.target.value) : undefined,
                        productName: product ? `${product.nameAr} / ${product.nameEn}` : item.productName,
                        unitCost: product ? String(product.costPrice ?? 0) : item.unitCost,
                      });
                    }}
                  >
                    <MenuItem value="">{l.productName}</MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.nameAr} / {product.nameEn} (stock: {product.quantity})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={l.productName}
                  size="small"
                  value={item.productName}
                  onChange={(e) => updateRow(index, { productName: e.target.value })}
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  label={l.quantity}
                  size="small"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateRow(index, { quantity: e.target.value })}
                  sx={{ width: 90 }}
                />
                <TextField
                  label={l.unitCost}
                  size="small"
                  type="number"
                  value={item.unitCost}
                  onChange={(e) => updateRow(index, { unitCost: e.target.value })}
                  sx={{ width: 110 }}
                />
                <Typography variant="body2" sx={{ minWidth: 70, textAlign: 'end' }}>
                  {itemSubtotal(item).toLocaleString()}
                </Typography>
                <IconButton size="small" color="error" onClick={() => removeRow(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}

            <Button variant="outlined" size="small" onClick={addRow} startIcon={<AddIcon />}>
              {l.addRow}
            </Button>

            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <TextField
                label={l.discount}
                size="small"
                type="number"
                value={form.discount}
                onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                sx={{ width: 140 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{l.paymentMethod}</InputLabel>
                <Select
                  label={l.paymentMethod}
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentMethod: e.target.value as PurchasePaymentMethod }))
                  }
                >
                  <MenuItem value="CASH">{l.cash}</MenuItem>
                  <MenuItem value="CARD">{l.card}</MenuItem>
                  <MenuItem value="WALLET">{l.wallet}</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ textAlign: 'end' }}>
                <Typography variant="body2">
                  {l.subtotal}: <b>{subtotal.toLocaleString()}</b>
                </Typography>
                <Typography variant="body2">
                  {l.total}: <b>{total.toLocaleString()}</b>
                </Typography>
              </Box>
            </Stack>

            <TextField
              label={l.notes}
              size="small"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{l.cancelDialog}</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? '...' : l.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={details !== null} onClose={() => setDetails(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{details ? details.orderNo : ''}</DialogTitle>
        <DialogContent>
          {details && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
                <Typography variant="body2">
                  {l.supplier}: <b>{details.supplier?.name ?? '—'}</b>
                </Typography>
                <Chip
                  size="small"
                  color={statusColor[details.status]}
                  label={statusLabel(details.status, l)}
                />
              </Stack>
              {(details.items ?? []).map((item: PurchaseOrderItem) => (
                <Stack key={item.id} direction="row" justifyContent="space-between">
                  <Typography variant="body2">
                    {item.productName} × {item.quantity}
                  </Typography>
                  <Typography variant="body2">{Number(item.lineTotal).toLocaleString()}</Typography>
                </Stack>
              ))}
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={700}>
                  {l.total}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {Number(details.total).toLocaleString()}
                </Typography>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetails(null)}>{l.close}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirm !== null} onClose={() => setConfirm(null)}>
        <DialogTitle>
          {confirm?.action === 'receive' ? l.receive : l.cancel}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirm?.action === 'receive' ? l.confirmReceive : l.confirmCancel}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>{l.cancelDialog}</Button>
          <Button
            color={confirm?.action === 'cancel' ? 'error' : 'success'}
            variant="contained"
            onClick={handleConfirm}
          >
            {l.yes}
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
