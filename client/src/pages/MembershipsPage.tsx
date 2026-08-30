import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  listMemberships,
  assignMembership,
  cancelMembership,
  type MembershipPlan,
  type ClientMembership,
  type PlanInput,
} from '../api/memberships';
import { listClients, type Client } from '../api/clients';
import { listServices, type Service } from '../api/services';
import { useAuthStore } from '../stores/authStore';
import { isArabicText, isLatinText } from '../utils/languageValidation';
import { toHijri } from '../utils/hijri';
import PageHeader from '../components/PageHeader';

const L = {
  ar: {
    title: 'العضويات والباقات',
    plans: 'الباقات',
    memberships: 'العضويات',
    addPlan: 'إضافة باقة',
    editPlan: 'تعديل الباقة',
    nameAr: 'الاسم (عربي)',
    nameEn: 'الاسم (إنجليزي)',
    price: 'السعر',
    durationDays: 'المدة (أيام)',
    discountPercent: 'نسبة الخصم %',
    services: 'الخدمات المشمولة',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    deleteConfirm: 'هل أنت متأكد من حذف هذه الباقة؟',
    noData: 'لا توجد بيانات',
    loading: 'جارٍ التحميل...',
    created: 'تم إنشاء الباقة بنجاح',
    updated: 'تم تحديث الباقة بنجاح',
    deleted: 'تم حذف الباقة بنجاح',
    assigned: 'تم تعيين العضوية للعميلة',
    cancelled: 'تم إلغاء العضوية',
    assign: 'تعيين عضوية',
    assignTitle: 'تعيين عضوية لعميلة',
    client: 'العميلة',
    plan: 'الباقة',
    clientName: 'العميلة',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    status: 'الحالة',
    active: 'نشطة',
    expired: 'منتهية',
    cancelledSt: 'ملغاة',
    actions: 'إجراءات',
    members: 'العضويات',
    remaining: 'متبقي',
    required: 'هذا الحقل مطلوب',
    nameArError: 'يجب أن يُكتب الاسم بالحروف العربية فقط',
    nameEnError: 'يجب أن يُكتب الاسم بالحروف الإنجليزية فقط',
  },
  en: {
    title: 'Memberships & Plans',
    plans: 'Plans',
    memberships: 'Memberships',
    addPlan: 'Add Plan',
    editPlan: 'Edit Plan',
    nameAr: 'Name (Arabic)',
    nameEn: 'Name (English)',
    price: 'Price',
    durationDays: 'Duration (days)',
    discountPercent: 'Discount %',
    services: 'Included Services',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this plan?',
    noData: 'No data',
    loading: 'Loading...',
    created: 'Plan created successfully',
    updated: 'Plan updated successfully',
    deleted: 'Plan deleted successfully',
    assigned: 'Membership assigned',
    cancelled: 'Membership cancelled',
    assign: 'Assign Membership',
    assignTitle: 'Assign Membership to Client',
    client: 'Client',
    plan: 'Plan',
    clientName: 'Client',
    startDate: 'Start Date',
    endDate: 'End Date',
    status: 'Status',
    active: 'Active',
    expired: 'Expired',
    cancelledSt: 'Cancelled',
    actions: 'Actions',
    members: 'Memberships',
    remaining: 'Remaining',
    required: 'This field is required',
    nameArError: 'Name must be written in Arabic letters only',
    nameEnError: 'Name must be written in English letters only',
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

interface PlanForm {
  nameAr: string;
  nameEn: string;
  price: string;
  durationDays: string;
  discountPercent: string;
  serviceIds: number[];
}

const emptyPlanForm = (): PlanForm => ({
  nameAr: '',
  nameEn: '',
  price: '',
  durationDays: '30',
  discountPercent: '0',
  serviceIds: [],
});

export default function MembershipsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const canWrite = useAuthStore((s) => s.hasPermission('memberships'));
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tab, setTab] = useState(0);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [planDialog, setPlanDialog] = useState<{ open: boolean; editing: MembershipPlan | null }>({
    open: false,
    editing: null,
  });
  const [planForm, setPlanForm] = useState<PlanForm>(emptyPlanForm());
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});
  const [assignDialog, setAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({ clientId: '', planId: '' });
  const [deleteTarget, setDeleteTarget] = useState<MembershipPlan | null>(null);

  const nameOf = (plan?: { nameAr: string; nameEn: string } | null): string =>
    plan ? (lang === 'ar' ? plan.nameAr : plan.nameEn) : '-';

  const load = async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([listPlans(), listMemberships()]);
      setPlans(p);
      setMemberships(m);
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const loadClients = async () => {
    try {
      const res = await listClients({ limit: 100 });
      setClients(res.items);
    } catch {
      /* ignore */
    }
  };

  const loadServices = async () => {
    try {
      const res = await listServices({});
      setServices(res);
    } catch {
      /* ignore */
    }
  };

  const openPlanDialog = (editing: MembershipPlan | null) => {
    setPlanForm(
      editing
        ? {
            nameAr: editing.nameAr,
            nameEn: editing.nameEn,
            price: String(Number(editing.price)),
            durationDays: String(editing.durationDays),
            discountPercent: String(Number(editing.discountPercent) || 0),
            serviceIds: editing.serviceIds ?? [],
          }
        : emptyPlanForm(),
    );
    setPlanErrors({});
    setPlanDialog({ open: true, editing });
    void loadServices();
  };

  const handlePlanSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!planForm.nameAr.trim()) errs.nameAr = l.required;
    else if (!isArabicText(planForm.nameAr)) errs.nameAr = l.nameArError;
    if (!planForm.nameEn.trim()) errs.nameEn = l.required;
    else if (!isLatinText(planForm.nameEn)) errs.nameEn = l.nameEnError;
    const price = Number(planForm.price);
    const durationDays = Number(planForm.durationDays);
    if (!price || price <= 0) errs.price = l.required;
    if (!durationDays || durationDays <= 0) errs.durationDays = l.required;
    setPlanErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload: PlanInput = {
      nameAr: planForm.nameAr.trim(),
      nameEn: planForm.nameEn.trim(),
      price,
      durationDays,
      discountPercent: Number(planForm.discountPercent) || 0,
      serviceIds: planForm.serviceIds,
    };

    try {
      if (planDialog.editing) {
        await updatePlan(planDialog.editing.id, payload);
        setSnack({ open: true, message: l.updated, severity: 'success' });
      } else {
        await createPlan(payload);
        setSnack({ open: true, message: l.created, severity: 'success' });
      }
      setPlanDialog({ open: false, editing: null });
      await load();
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlan(deleteTarget.id);
      setSnack({ open: true, message: l.deleted, severity: 'success' });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const openAssign = async () => {
    setAssignForm({ clientId: '', planId: '' });
    setAssignDialog(true);
    void loadClients();
    void loadServices();
  };

  const handleAssign = async () => {
    try {
      await assignMembership(Number(assignForm.clientId), Number(assignForm.planId));
      setSnack({ open: true, message: l.assigned, severity: 'success' });
      setAssignDialog(false);
      await load();
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const handleCancelMembership = async (id: number) => {
    try {
      await cancelMembership(id);
      setSnack({ open: true, message: l.cancelled, severity: 'success' });
      await load();
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const planColumns: GridColDef[] = [
    { field: 'nameAr', headerName: l.nameAr, flex: 1, minWidth: 150 },
    { field: 'nameEn', headerName: l.nameEn, flex: 1, minWidth: 150 },
    {
      field: 'price',
      headerName: l.price,
      width: 110,
      renderCell: (params) => formatMoney(params.value),
    },
    { field: 'durationDays', headerName: l.durationDays, width: 110 },
    {
      field: 'discountPercent',
      headerName: l.discountPercent,
      width: 110,
      renderCell: (params) => `${Number(params.value) || 0}%`,
    },
    {
      field: 'membersCount',
      headerName: l.members,
      width: 110,
      renderCell: (params) => params.value ?? 0,
    },
    {
      field: 'actions',
      headerName: l.actions,
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0}>
          <IconButton
            size="small"
            disabled={!canWrite}
            onClick={() => openPlanDialog(params.row as MembershipPlan)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            disabled={!canWrite}
            onClick={() => setDeleteTarget(params.row as MembershipPlan)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const membershipColumns: GridColDef[] = [
    {
      field: 'client',
      headerName: l.clientName,
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.value?.name ?? '-',
    },
    {
      field: 'plan',
      headerName: l.plan,
      flex: 1,
      minWidth: 140,
      renderCell: (params) => nameOf(params.value),
    },
    {
      field: 'startDate',
      headerName: l.startDate,
      width: 130,
      renderCell: (params) => new Date(params.value as string).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US'),
    },
    {
      field: 'endDate',
      headerName: l.endDate,
      width: 190,
      renderCell: (params) => {
        const d = new Date(params.value as string).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
        const hijri = toHijri(params.value as string);
        return (
          <Stack direction="column" spacing={0}>
            <span>{d}</span>
            {hijri && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{hijri}</span>}
          </Stack>
        );
      },
    },
    {
      field: 'remainingDays',
      headerName: l.remaining,
      width: 100,
      renderCell: (params) => (params.value !== undefined ? `${params.value} ${lang === 'ar' ? 'يوم' : 'd'}` : '-'),
    },
    {
      field: 'status',
      headerName: l.status,
      width: 110,
      renderCell: (params) => {
        const color =
          params.value === 'ACTIVE' ? 'success' : params.value === 'EXPIRED' ? 'warning' : 'error';
        const text =
          params.value === 'ACTIVE'
            ? l.active
            : params.value === 'EXPIRED'
              ? l.expired
              : l.cancelledSt;
        return <Chip label={text} color={color} size="small" />;
      },
    },
    {
      field: 'actions',
      headerName: l.actions,
      width: 110,
      sortable: false,
      renderCell: (params: GridRenderCellParams) =>
        params.row.status === 'ACTIVE' ? (
          <Button size="small" color="error" disabled={!canWrite} onClick={() => void handleCancelMembership(params.row.id)}>
            {l.cancelledSt}
          </Button>
        ) : null,
    },
  ];

  return (
    <Box>
      <PageHeader title={l.title} />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={l.plans} />
          <Tab label={l.memberships} />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        {canWrite && tab === 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openPlanDialog(null)}>
            {l.addPlan}
          </Button>
        )}
        {canWrite && tab === 1 && (
          <Button variant="contained" startIcon={<CardMembershipIcon />} onClick={() => void openAssign()}>
            {l.assign}
          </Button>
        )}
      </Stack>

      {tab === 0 ? (
        <Box sx={{ height: 520 }}>
          <DataGrid
            rows={plans}
            columns={planColumns}
            loading={loading}
            autoPageSize
            disableRowSelectionOnClick
            localeText={{ noRowsLabel: l.noData }}
          />
        </Box>
      ) : (
        <Box sx={{ height: 520 }}>
          <DataGrid
            rows={memberships}
            columns={membershipColumns}
            loading={loading}
            autoPageSize
            disableRowSelectionOnClick
            localeText={{ noRowsLabel: l.noData }}
          />
        </Box>
      )}

      <Dialog open={planDialog.open} onClose={() => setPlanDialog({ open: false, editing: null })} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{planDialog.editing ? l.editPlan : l.addPlan}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={l.nameAr}
              value={planForm.nameAr}
              onChange={(e) => setPlanForm({ ...planForm, nameAr: e.target.value })}
              error={!!planErrors.nameAr}
              helperText={planErrors.nameAr}
              fullWidth
            />
            <TextField
              label={l.nameEn}
              value={planForm.nameEn}
              onChange={(e) => setPlanForm({ ...planForm, nameEn: e.target.value })}
              error={!!planErrors.nameEn}
              helperText={planErrors.nameEn}
              fullWidth
            />
            <TextField
              label={l.price}
              type="number"
              value={planForm.price}
              onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
              error={!!planErrors.price}
              helperText={planErrors.price}
              fullWidth
            />
            <TextField
              label={l.durationDays}
              type="number"
              value={planForm.durationDays}
              onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
              error={!!planErrors.durationDays}
              helperText={planErrors.durationDays}
              fullWidth
            />
            <TextField
              label={l.discountPercent}
              type="number"
              inputProps={{ min: 0, max: 100, step: '0.01' }}
              value={planForm.discountPercent}
              onChange={(e) => setPlanForm({ ...planForm, discountPercent: e.target.value })}
              helperText={lang === 'ar' ? 'نسبة الخصم عند الفوترة (0 = لا خصم)' : 'Discount applied at invoicing (0 = no discount)'}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>{l.services}</InputLabel>
              <Select
                multiple
                value={planForm.serviceIds}
                onChange={(e: SelectChangeEvent<number[]>) =>
                  setPlanForm({ ...planForm, serviceIds: e.target.value as number[] })
                }
                label={l.services}
                renderValue={(selected) =>
                  (selected as number[])
                    .map((id) => {
                      const svc = services.find((s) => s.id === id);
                      return svc ? (lang === 'ar' ? svc.nameAr : svc.nameEn) : String(id);
                    })
                    .join(', ')
                }
              >
                {services.map((svc) => (
                  <MenuItem key={svc.id} value={svc.id}>
                    {lang === 'ar' ? svc.nameAr : svc.nameEn}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDialog({ open: false, editing: null })}>{l.cancel}</Button>
          <Button variant="contained" onClick={() => void handlePlanSubmit()}>
            {l.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{l.assignTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>{l.client}</InputLabel>
              <Select
                value={assignForm.clientId}
                onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value })}
                label={l.client}
              >
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{l.plan}</InputLabel>
              <Select
                value={assignForm.planId}
                onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                label={l.plan}
              >
                {plans.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {nameOf(p)} - {formatMoney(p.price)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>{l.cancel}</Button>
          <Button
            variant="contained"
            onClick={() => void handleAssign()}
            disabled={!assignForm.clientId || !assignForm.planId}
          >
            {l.assign}
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