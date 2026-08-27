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
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  type Client,
  type ClientInput,
} from '../api/clients';
import {
  listClientTransactions,
  adjustClientPoints,
  type LoyaltyTransaction,
  type LoyaltyType,
} from '../api/loyalty';
import { useAuthStore } from '../stores/authStore';
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

interface ClientForm {
  name: string;
  phone: string;
  email: string;
  birthdate: string;
  notes: string;
}

const emptyForm: ClientForm = { name: '', phone: '', email: '', birthdate: '', notes: '' };

export default function ClientsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const canWrite = useAuthStore((s) => s.hasPermission('clients.write'));
  const canDelete = useAuthStore((s) => s.hasPermission('clients.write'));
  const canAdjustPoints = useAuthStore((s) => s.hasPermission('loyalty'));

  const labels = useMemo(
    () =>
      lang === 'ar'
        ? {
            title: 'العملاء',
            searchPlaceholder: 'بحث بالاسم أو الهاتف أو البريد الإلكتروني...',
            add: 'إضافة عميل',
            addTitle: 'إضافة عميل جديد',
            editTitle: 'تعديل بيانات العميل',
            colName: 'الاسم',
            colPhone: 'الهاتف',
            colWhatsapp: 'واتساب',
            birthdate: 'تاريخ الميلاد',
            colEmail: 'البريد الإلكتروني',
            colTotalSpent: 'إجمالي الإنفاق',
            colPoints: 'النقاط',
            colActions: 'إجراءات',
            colVisits: 'الزيارات',
            colLastVisit: 'آخر زيارة',
            visitsLabel: 'عدد الزيارات',
            lastVisitLabel: 'آخر زيارة',
            favoriteServiceLabel: 'الخدمة المفضلة',
            pointsAction: 'النقاط',
            pointsTitle: 'نقاط الولاء',
            currentPoints: 'النقاط الحالية',
            pointsHistory: 'سجل النقاط',
            noTransactions: 'لا توجد حركات',
            transactionType: 'النوع',
            transactionPoints: 'النقاط',
            balanceAfter: 'الرصيد بعد',
            transactionNote: 'ملاحظة',
            earn: 'إضافة',
            redeem: 'استبدال',
            adjustPoints: 'تعديل النقاط',
            adjustType: 'نوع التعديل',
            adjustAmount: 'العدد',
            adjustNote: 'ملاحظة',
            adjustSave: 'حفظ',
            pointsAdjusted: 'تم تعديل النقاط بنجاح',
            invalidPoints: 'أدخل عدداً صحيحاً موجباً',
            name: 'الاسم',
            nameRequired: 'الاسم مطلوب',
            phone: 'الهاتف',
            whatsapp: 'واتساب',
            email: 'البريد الإلكتروني',
            notes: 'ملاحظات',
            save: 'حفظ',
            cancel: 'إلغاء',
            delete: 'حذف',
            confirmDeleteTitle: 'تأكيد الحذف',
            confirmDeleteMessage:
              'هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.',
            deleteYes: 'حذف',
            noData: 'لا توجد بيانات',
            loading: 'جارٍ التحميل...',
            profileTitle: 'ملف العميل',
            totalSpentLabel: 'إجمالي الإنفاق',
            appointments: 'أحدث المواعيد',
            noAppointments: 'لا توجد مواعيد',
            date: 'التاريخ',
            service: 'الخدمة',
            status: 'الحالة',
            created: 'تم إنشاء العميل بنجاح',
            updated: 'تم تحديث العميل بنجاح',
            deleted: 'تم حذف العميل بنجاح',
          }
        : {
            title: 'Clients',
            searchPlaceholder: 'Search by name, phone or email...',
            add: 'Add Client',
            addTitle: 'Add New Client',
            editTitle: 'Edit Client',
            colName: 'Name',
            colPhone: 'Phone',
            colWhatsapp: 'WhatsApp',
            birthdate: 'Birthdate',
            colEmail: 'Email',
            colTotalSpent: 'Total Spent',
            colPoints: 'Points',
            colActions: 'Actions',
            colVisits: 'Visits',
            colLastVisit: 'Last Visit',
            visitsLabel: 'Total Visits',
            lastVisitLabel: 'Last Visit',
            favoriteServiceLabel: 'Favorite Service',
            pointsAction: 'Points',
            pointsTitle: 'Loyalty Points',
            currentPoints: 'Current Points',
            pointsHistory: 'Points History',
            noTransactions: 'No transactions',
            transactionType: 'Type',
            transactionPoints: 'Points',
            balanceAfter: 'Balance After',
            transactionNote: 'Note',
            earn: 'Earn',
            redeem: 'Redeem',
            adjustPoints: 'Adjust Points',
            adjustType: 'Adjust Type',
            adjustAmount: 'Amount',
            adjustNote: 'Note',
            adjustSave: 'Save',
            pointsAdjusted: 'Points adjusted successfully',
            invalidPoints: 'Enter a positive integer',
            name: 'Name',
            nameRequired: 'Name is required',
            phone: 'Phone',
            whatsapp: 'WhatsApp',
            email: 'Email',
            notes: 'Notes',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            confirmDeleteTitle: 'Confirm Delete',
            confirmDeleteMessage:
              'Are you sure you want to delete this client? This action cannot be undone.',
            deleteYes: 'Delete',
            noData: 'No data',
            loading: 'Loading...',
            profileTitle: 'Client Profile',
            totalSpentLabel: 'Total Spent',
            appointments: 'Recent Appointments',
            noAppointments: 'No appointments',
            date: 'Date',
            service: 'Service',
            status: 'Status',
            created: 'Client created successfully',
            updated: 'Client updated successfully',
            deleted: 'Client deleted successfully',
          },
    [lang],
  );

  const statusLabel = (status: string): string => {
    if (lang === 'ar') {
      const map: Record<string, string> = {
        BOOKED: 'محجوز',
        ARRIVED: 'حضرت',
        DONE: 'مكتمل',
        CANCELLED: 'ملغي',
      };
      return map[status] ?? status;
    }
    return status;
  };

  const formatDate = (value: string): string => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB');
  };

  const nameOfService = (service: { nameAr: string; nameEn: string }): string =>
    lang === 'ar' ? service.nameAr : service.nameEn;

  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [profile, setProfile] = useState<Client | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pointsClient, setPointsClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [adjustType, setAdjustType] = useState<LoyaltyType>('EARN');
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);
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
    listClients({ q: search || undefined, page: 1, limit: 100 })
      .then((data) => {
        if (!cancelled) setRows(data.items);
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
  }, [search, refresh]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      name: client.name ?? '',
      phone: client.phone ?? '',
      email: client.email ?? '',
      birthdate: client.birthdate ? String(client.birthdate).slice(0, 10) : '',
      notes: client.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload: ClientInput = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      birthdate: form.birthdate || undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editing) {
        await updateClient(editing.id, payload);
        setSnackbar({ message: labels.updated, severity: 'success' });
      } else {
        await createClient(payload);
        setSnackbar({ message: labels.created, severity: 'success' });
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
      await deleteClient(deleteTarget.id);
      setSnackbar({ message: labels.deleted, severity: 'success' });
      setDeleteTarget(null);
      setRefresh((n) => n + 1);
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
      setDeleteTarget(null);
    }
  };

  const handleRowClick = async (client: Client) => {
    setProfile(client);
    setProfileLoading(true);
    try {
      const full = await getClient(client.id);
      setProfile(full);
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const openPointsDialog = async (client: Client) => {
    setPointsClient(client);
    setAdjustType('EARN');
    setAdjustPoints('');
    setAdjustNote('');
    setTransactions([]);
    setTransactionsLoading(true);
    try {
      const data = await listClientTransactions(client.id, { limit: 20 });
      setTransactions(data.items);
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (!pointsClient) return;
    const points = Number(adjustPoints);
    if (!Number.isInteger(points) || points <= 0) {
      setSnackbar({ message: labels.invalidPoints, severity: 'error' });
      return;
    }
    setAdjusting(true);
    try {
      await adjustClientPoints(pointsClient.id, {
        type: adjustType,
        points,
        note: adjustNote.trim() || undefined,
      });
      setSnackbar({ message: labels.pointsAdjusted, severity: 'success' });
      setAdjustPoints('');
      setAdjustNote('');
      const data = await listClientTransactions(pointsClient.id, { limit: 20 });
      setTransactions(data.items);
      setRefresh((n) => n + 1);
      setPointsClient((prev) =>
        prev
          ? {
              ...prev,
              loyaltyPoints: Math.max(
                0,
                (prev.loyaltyPoints ?? 0) + (adjustType === 'EARN' ? points : -points),
              ),
            }
          : prev,
      );
    } catch (err) {
      setSnackbar({ message: getErrorMessage(err), severity: 'error' });
    } finally {
      setAdjusting(false);
    }
  };

  const actionsColumn: GridColDef = {
    field: 'actions',
    headerName: labels.colActions,
    width: 150,
    sortable: false,
    disableColumnMenu: true,
    renderCell: (params: GridRenderCellParams) => (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title={labels.pointsAction}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              void openPointsDialog(params.row as Client);
            }}
          >
            <LoyaltyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {canWrite && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(params.row as Client);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {canDelete && (
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(params.row as Client);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    ),
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: labels.colName, flex: 1, minWidth: 140 },
    { field: 'phone', headerName: labels.colPhone, flex: 1, minWidth: 120 },
    {
      field: 'birthdate',
      headerName: labels.birthdate,
      flex: 1,
      minWidth: 120,
      valueFormatter: (value?: string | null) => (value ? String(value).slice(0, 10) : '—'),
    },
    { field: 'email', headerName: labels.colEmail, flex: 1, minWidth: 180 },
    {
      field: 'totalSpent',
      headerName: labels.colTotalSpent,
      width: 130,
      renderCell: (params: GridRenderCellParams) => formatMoney(params.value),
    },
    {
      field: 'loyaltyPoints',
      headerName: labels.colPoints,
      width: 90,
      renderCell: (params: GridRenderCellParams) => String(params.row.loyaltyPoints ?? 0),
    },
    {
      field: 'visitCount',
      headerName: labels.colVisits,
      width: 90,
      renderCell: (params: GridRenderCellParams) => String(params.row.visitCount ?? 0),
    },
    {
      field: 'lastVisitAt',
      headerName: labels.colLastVisit,
      width: 140,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? formatDate(params.value as string) : '—',
    },
    ...(canWrite || canDelete ? [actionsColumn] : []),
  ];

  return (
    <Box>
      <PageHeader title={labels.title} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder={labels.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          fullWidth
          size="small"
        />
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{ whiteSpace: 'nowrap', minWidth: 170 }}
          >
            {labels.add}
          </Button>
        )}
      </Stack>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        localeText={
          lang === 'ar'
            ? {
                noRowsLabel: labels.noData,
                noResultsOverlayLabel: labels.noData,
              }
            : undefined
        }
        onRowClick={(params) => {
          void handleRowClick(params.row as Client);
        }}
        disableRowSelectionOnClick
        sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? labels.editTitle : labels.addTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={labels.name}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={form.name.trim() === ''}
              helperText={form.name.trim() === '' ? labels.nameRequired : undefined}
              required
              fullWidth
            />
            <TextField
              label={labels.phone}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label={labels.email}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              type="email"
              fullWidth
            />
            <TextField
              label={labels.birthdate}
              value={form.birthdate}
              onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={lang === 'ar' ? 'للحملات الترويجية وعروض أعياد الميلاد' : 'For promotional campaigns and birthday offers'}
              fullWidth
            />
            <TextField
              label={labels.notes}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{labels.cancel}</Button>
          <Button
            onClick={() => void handleSave()}
            variant="contained"
            disabled={form.name.trim() === ''}
          >
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
              {deleteTarget.name}
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

      <Drawer
        anchor={lang === 'ar' ? 'left' : 'right'}
        open={!!profile}
        onClose={() => setProfile(null)}
      >
        <Box sx={{ width: { xs: '100vw', sm: 420 }, p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">{labels.profileTitle}</Typography>
            <IconButton onClick={() => setProfile(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          {profileLoading ? (
            <LinearProgress />
          ) : profile ? (
            <>
              <Typography variant="h5" gutterBottom>
                {profile.name}
              </Typography>
              {profile.phone && (
                <Typography color="text.secondary">
                  {labels.phone}: {profile.phone}
                </Typography>
              )}
              {profile.whatsapp && (
                <Typography color="text.secondary">
                  {labels.whatsapp}: {profile.whatsapp}
                </Typography>
              )}
              {profile.email && (
                <Typography color="text.secondary">
                  {labels.email}: {profile.email}
                </Typography>
              )}
              {profile.notes && (
                <Typography color="text.secondary">
                  {labels.notes}: {profile.notes}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                {labels.totalSpentLabel}: {formatMoney(profile.totalSpent)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={`${labels.visitsLabel}: ${profile.visitCount ?? 0}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${labels.lastVisitLabel}: ${profile.lastVisitAt ? formatDate(profile.lastVisitAt) : '—'}`}
                  variant="outlined"
                />
              </Stack>
              {profile.favoriteService && (
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  {labels.favoriteServiceLabel}: {nameOfService(profile.favoriteService)}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                {labels.appointments}
              </Typography>
              {(profile.appointments?.length ?? 0) === 0 ? (
                <Typography color="text.secondary">{labels.noAppointments}</Typography>
              ) : (
                <List dense disablePadding>
                  {profile.appointments?.map((appt) => (
                    <ListItem key={appt.id} sx={{ px: 0, py: 1 }}>
                      <Stack width="100%">
                        <Typography variant="body2">
                          {labels.date}: {formatDate(appt.date)}
                        </Typography>
                        <Typography variant="body2">
                          {labels.service}:{' '}
                          {appt.service ? nameOfService(appt.service) : '—'}
                        </Typography>
                        <Chip
                          label={`${labels.status}: ${statusLabel(appt.status)}`}
                          size="small"
                          sx={{ mt: 0.5, alignSelf: 'flex-start' }}
                        />
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          ) : null}
        </Box>
      </Drawer>

      <Dialog open={!!pointsClient} onClose={() => setPointsClient(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          {labels.pointsTitle}
          {pointsClient ? ` — ${pointsClient.name}` : ''}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {labels.currentPoints}: {pointsClient?.loyaltyPoints ?? 0}
            </Typography>
            <Divider />
            <Typography variant="h6">{labels.pointsHistory}</Typography>
            {transactionsLoading ? (
              <LinearProgress />
            ) : transactions.length === 0 ? (
              <Typography color="text.secondary">{labels.noTransactions}</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{labels.date}</TableCell>
                      <TableCell>{labels.transactionType}</TableCell>
                      <TableCell align="center">{labels.transactionPoints}</TableCell>
                      <TableCell align="center">{labels.balanceAfter}</TableCell>
                      <TableCell>{labels.transactionNote}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={tx.type === 'EARN' ? 'success' : 'error'}
                            label={tx.type === 'EARN' ? labels.earn : labels.redeem}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            color={tx.type === 'EARN' ? 'success.main' : 'error.main'}
                            fontWeight={600}
                          >
                            {tx.type === 'EARN' ? '+' : '-'}
                            {tx.points}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{tx.balanceAfter}</TableCell>
                        <TableCell>{tx.note ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {canAdjustPoints && (
              <>
                <Divider />
                <Typography variant="h6">{labels.adjustPoints}</Typography>
                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>{labels.adjustType}</InputLabel>
                    <Select
                      label={labels.adjustType}
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as LoyaltyType)}
                    >
                      <MenuItem value="EARN">{labels.earn}</MenuItem>
                      <MenuItem value="REDEEM">{labels.redeem}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={labels.adjustAmount}
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(e.target.value)}
                    fullWidth
                  />
                </Stack>
                <TextField
                  label={labels.adjustNote}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={() => void handleAdjustPoints()}
                  disabled={adjusting}
                  startIcon={
                    adjusting ? <CircularProgress size={18} color="inherit" /> : undefined
                  }
                >
                  {labels.adjustSave}
                </Button>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPointsClient(null)}>{labels.cancel}</Button>
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