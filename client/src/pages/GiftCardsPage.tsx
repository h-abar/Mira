import { useEffect, useState } from 'react';
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
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import {
  listGiftCards,
  createGiftCard,
  updateGiftCard,
  deleteGiftCard,
  type GiftCard,
  type GiftCardInput,
} from '../api/giftcards';
import { listClients, type Client } from '../api/clients';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'بطاقات الهدايا',
    add: 'إنشاء بطاقة',
    search: 'بحث...',
    colCode: 'الكود',
    colClient: 'العميلة',
    colBalance: 'الرصيد',
    colValue: 'القيمة الاسمية',
    colStatus: 'الحالة',
    colExpiry: 'الانتهاء',
    colCreated: 'تاريخ الإنشاء',
    colActions: 'إجراءات',
    client: 'العميلة (اختياري)',
    value: 'القيمة',
    expiry: 'تاريخ الانتهاء (اختياري)',
    noExpiry: 'بدون انتهاء',
    active: 'نشطة',
    redeemed: 'مستنفدة',
    cancelled: 'ملغاة',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    deleteConfirm: 'هل أنت متأكد من حذف هذه البطاقة؟',
    noData: 'لا توجد بيانات',
    loading: 'جارٍ التحميل...',
    created: 'تم إنشاء البطاقة بنجاح',
    deleted: 'تم حذف البطاقة بنجاح',
    cancelledMsg: 'تم إلغاء البطاقة',
    activated: 'تم تفعيل البطاقة',
    valueError: 'يجب أن تكون القيمة أكبر من صفر',
  },
  en: {
    title: 'Gift Cards',
    add: 'Create Card',
    search: 'Search...',
    colCode: 'Code',
    colClient: 'Client',
    colBalance: 'Balance',
    colValue: 'Initial Value',
    colStatus: 'Status',
    colExpiry: 'Expiry',
    colCreated: 'Created At',
    colActions: 'Actions',
    client: 'Client (optional)',
    value: 'Value',
    expiry: 'Expiry Date (optional)',
    noExpiry: 'No expiry',
    active: 'Active',
    redeemed: 'Redeemed',
    cancelled: 'Cancelled',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this card?',
    noData: 'No data',
    loading: 'Loading...',
    created: 'Gift card created successfully',
    deleted: 'Gift card deleted successfully',
    cancelledMsg: 'Gift card cancelled',
    activated: 'Gift card activated',
    valueError: 'Value must be greater than zero',
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

export default function GiftCardsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const canWrite = useAuthStore((s) => s.hasPermission('giftcards'));

  const [rows, setRows] = useState<GiftCard[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [value, setValue] = useState('');
  const [clientId, setClientId] = useState('');
  const [expiry, setExpiry] = useState<Dayjs | null>(null);
  const [valueError, setValueError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<GiftCard | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listGiftCards({ q: query || undefined, limit: 100 });
      setRows(res.items);
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void load(), query ? 400 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const loadClients = async () => {
    try {
      const res = await listClients({ limit: 100 });
      setClients(res.items);
    } catch {
      /* ignore */
    }
  };

  const openCreate = () => {
    setValue('');
    setClientId('');
    setExpiry(null);
    setValueError('');
    setCreateOpen(true);
    void loadClients();
  };

  const handleCreate = async () => {
    const num = Number(value);
    if (!num || num <= 0) {
      setValueError(l.valueError);
      return;
    }
    const payload: GiftCardInput = {
      initialValue: num,
      ...(clientId ? { clientId: Number(clientId) } : {}),
      ...(expiry ? { expiresAt: expiry.toISOString() } : {}),
    };
    try {
      await createGiftCard(payload);
      setSnack({ open: true, message: l.created, severity: 'success' });
      setCreateOpen(false);
      await load();
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGiftCard(deleteTarget.id);
      setSnack({ open: true, message: l.deleted, severity: 'success' });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const handleStatusChange = async (card: GiftCard) => {
    try {
      if (card.status === 'ACTIVE') {
        await updateGiftCard(card.id, { status: 'CANCELLED' });
        setSnack({ open: true, message: l.cancelledMsg, severity: 'success' });
      } else {
        await updateGiftCard(card.id, { status: 'ACTIVE' });
        setSnack({ open: true, message: l.activated, severity: 'success' });
      }
      await load();
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: l.colCode,
      width: 170,
      renderCell: (params) => (
        <Typography sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{params.value}</Typography>
      ),
    },
    {
      field: 'client',
      headerName: l.colClient,
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.value?.name ?? '-',
    },
    {
      field: 'balance',
      headerName: l.colBalance,
      width: 110,
      renderCell: (params) => formatMoney(params.value),
    },
    {
      field: 'initialValue',
      headerName: l.colValue,
      width: 120,
      renderCell: (params) => formatMoney(params.value),
    },
    {
      field: 'status',
      headerName: l.colStatus,
      width: 110,
      renderCell: (params) => {
        const color =
          params.value === 'ACTIVE' ? 'success' : params.value === 'REDEEMED' ? 'warning' : 'error';
        const text =
          params.value === 'ACTIVE' ? l.active : params.value === 'REDEEMED' ? l.redeemed : l.cancelled;
        return <Chip label={text} color={color} size="small" />;
      },
    },
    {
      field: 'expiresAt',
      headerName: l.colExpiry,
      width: 130,
      renderCell: (params) =>
        params.value
          ? new Date(params.value as string).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')
          : l.noExpiry,
    },
    {
      field: 'createdAt',
      headerName: l.colCreated,
      width: 140,
      renderCell: (params) => new Date(params.value as string).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US'),
    },
    {
      field: 'actions',
      headerName: l.colActions,
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const card = params.row as GiftCard;
        return (
          <Stack direction="row" spacing={0}>
            <IconButton
              size="small"
              disabled={!canWrite || card.status === 'REDEEMED'}
              onClick={() => void handleStatusChange(card)}
              color={card.status === 'ACTIVE' ? 'error' : 'success'}
            >
              {card.status === 'ACTIVE' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
            </IconButton>
            <IconButton
              size="small"
              color="error"
              disabled={!canWrite}
              onClick={() => setDeleteTarget(card)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader title={l.title} />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label={l.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="small"
          sx={{ width: 260 }}
        />
        <Box sx={{ flexGrow: 1 }} />
        {canWrite && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {l.add}
          </Button>
        )}
      </Stack>

      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoPageSize
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: l.noData }}
        />
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{l.add}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={l.value}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={!!valueError}
              helperText={valueError}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>{l.client}</InputLabel>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)} label={l.client}>
                <MenuItem value="">-</MenuItem>
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label={l.expiry}
              value={expiry}
              onChange={(d) => setExpiry(d)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{l.cancel}</Button>
          <Button variant="contained" onClick={() => void handleCreate()}>
            {l.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{l.delete}</DialogTitle>
        <DialogContent>
          <Alert severity="warning">{l.deleteConfirm}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{l.cancel}</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
            {l.delete}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} sx={{ width: '100%' }} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}