import { useCallback, useEffect, useMemo, useState } from 'react';
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
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  listMemberships,
  assignMembership,
  cancelMembership,
  searchMembershipClients,
  type MembershipPlan,
  type ClientMembership,
  type PlanInput,
  type MembershipClientOption,
} from '../api/memberships';
import { listServices, type Service } from '../api/services';
import { useAuthStore } from '../stores/authStore';
import { isArabicText, isLatinText } from '../utils/languageValidation';
import { toHijri } from '../utils/hijri';
import PageHeader from '../components/PageHeader';
import ExportButtons from '../components/ExportButtons';

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
    services: 'الخدمات المشمولة (اختياري)',
    servicesOptionalHint: 'اترك فارغاً لتطبيق الخصم على جميع الخدمات. اختر خدمات محددة لربط الباقة بها فقط.',
    allServices: 'كل الخدمات',
    servicesLinked: 'خدمات مرتبطة',
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
    assignToClient: 'تعيين لعميلة',
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
    planPreview: 'معاينة الباقة',
    activeMembershipWarning: 'هذه العميلة لديها عضوية نشطة — ألغِها أولاً أو انتظر انتهاءها',
    hasActiveMembership: 'عضوية نشطة',
    filterByPlan: 'فلترة حسب الباقة',
    allPlans: 'كل الباقات',
    viewMembers: 'عرض العضويات',
    searchClientHint: 'ابحث بالاسم أو الجوال',
    days: 'يوم',
    inactive: 'غير نشطة',
    selectActivePlan: 'اختر باقة نشطة',
    noClients: 'لا توجد عميلات',
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
    services: 'Included Services (optional)',
    servicesOptionalHint: 'Leave empty to apply discount to all services. Select specific services to link the plan to them only.',
    allServices: 'All services',
    servicesLinked: 'Linked services',
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
    assignToClient: 'Assign to client',
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
    planPreview: 'Plan preview',
    activeMembershipWarning: 'This client already has an active membership — cancel it first or wait until it expires',
    hasActiveMembership: 'Active membership',
    filterByPlan: 'Filter by plan',
    allPlans: 'All plans',
    viewMembers: 'View memberships',
    searchClientHint: 'Search by name or phone',
    days: 'days',
    inactive: 'Inactive',
    selectActivePlan: 'Select an active plan',
    noClients: 'No clients found',
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignClientOptions, setAssignClientOptions] = useState<MembershipClientOption[]>([]);
  const [assignClientsLoading, setAssignClientsLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState<number | ''>('');
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
  const [assignClient, setAssignClient] = useState<MembershipClientOption | null>(null);
  const [assignPlanId, setAssignPlanId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MembershipPlan | null>(null);

  const nameOf = (plan?: { nameAr: string; nameEn: string } | null): string =>
    plan ? (lang === 'ar' ? plan.nameAr : plan.nameEn) : '-';

  const serviceName = useCallback(
    (id: number): string => {
      const svc = services.find((s) => s.id === id);
      return svc ? (lang === 'ar' ? svc.nameAr : svc.nameEn) : String(id);
    },
    [services, lang],
  );

  const selectedAssignPlan = useMemo(
    () => (assignPlanId ? plans.find((p) => p.id === Number(assignPlanId)) ?? null : null),
    [assignPlanId, plans],
  );

  const fetchAssignClients = useCallback(async () => {
    setAssignClientsLoading(true);
    try {
      const items = await searchMembershipClients(undefined, 500);
      setAssignClientOptions(items);
    } catch (err) {
      setAssignClientOptions([]);
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    } finally {
      setAssignClientsLoading(false);
    }
  }, []);

  const load = async (membershipFilters?: { planId?: number }) => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        listPlans(),
        listMemberships(membershipFilters?.planId ? { planId: membershipFilters.planId } : undefined),
      ]);
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
    void loadServices();
  }, []);

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
      await load(planFilter !== '' ? { planId: planFilter } : undefined);
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
      await load(planFilter !== '' ? { planId: planFilter } : undefined);
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const openAssign = async (preselectedPlanId?: number) => {
    setAssignClient(null);
    setAssignPlanId(preselectedPlanId ? String(preselectedPlanId) : '');
    setAssignDialog(true);
    void fetchAssignClients();
  };

  const handleAssign = async () => {
    if (!assignClient || !assignPlanId) return;
    if (assignClient.hasActiveMembership) {
      setSnack({ open: true, message: l.activeMembershipWarning, severity: 'error' });
      return;
    }
    try {
      await assignMembership(assignClient.id, Number(assignPlanId));
      setSnack({ open: true, message: l.assigned, severity: 'success' });
      setAssignDialog(false);
      await load(planFilter !== '' ? { planId: planFilter } : undefined);
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const handleCancelMembership = async (id: number) => {
    try {
      await cancelMembership(id);
      setSnack({ open: true, message: l.cancelled, severity: 'success' });
      await load(planFilter !== '' ? { planId: planFilter } : undefined);
    } catch (err) {
      setSnack({ open: true, message: getErrorMessage(err), severity: 'error' });
    }
  };

  const viewPlanMembers = (planId: number) => {
    setPlanFilter(planId);
    setTab(1);
    void load({ planId });
  };

  const handlePlanFilterChange = (value: number | '') => {
    setPlanFilter(value);
    void load(value !== '' ? { planId: value } : undefined);
  };

  const renderServicesCell = (serviceIds: number[] | undefined | null) => {
    if (!serviceIds || serviceIds.length === 0) {
      return <Chip label={l.allServices} size="small" color="default" variant="outlined" />;
    }
    const visible = serviceIds.slice(0, 2);
    const rest = serviceIds.length - visible.length;
    return (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {visible.map((id) => (
          <Chip key={id} label={serviceName(id)} size="small" variant="outlined" />
        ))}
        {rest > 0 && <Chip label={`+${rest}`} size="small" />}
      </Stack>
    );
  };

  const planColumns: GridColDef[] = [
    { field: 'nameAr', headerName: l.nameAr, flex: 1, minWidth: 130 },
    { field: 'nameEn', headerName: l.nameEn, flex: 1, minWidth: 130 },
    {
      field: 'price',
      headerName: l.price,
      width: 100,
      renderCell: (params) => formatMoney(params.value),
    },
    { field: 'durationDays', headerName: l.durationDays, width: 90 },
    {
      field: 'discountPercent',
      headerName: l.discountPercent,
      width: 90,
      renderCell: (params) => `${Number(params.value) || 0}%`,
    },
    {
      field: 'serviceIds',
      headerName: l.services,
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => renderServicesCell(params.value as number[]),
    },
    {
      field: 'membersCount',
      headerName: l.members,
      width: 100,
      renderCell: (params) => {
        const count = Number(params.value ?? 0);
        const plan = params.row as MembershipPlan;
        if (count === 0) return 0;
        return (
          <Button size="small" onClick={() => viewPlanMembers(plan.id)}>
            {count}
          </Button>
        );
      },
    },
    {
      field: 'actions',
      headerName: l.actions,
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const plan = params.row as MembershipPlan;
        return (
          <Stack direction="row" spacing={0}>
            {canWrite && (
              <Tooltip title={l.assignToClient}>
                <IconButton size="small" color="primary" onClick={() => void openAssign(plan.id)}>
                  <PersonAddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              size="small"
              disabled={!canWrite}
              onClick={() => openPlanDialog(plan)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              disabled={!canWrite}
              onClick={() => setDeleteTarget(plan)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      },
    },
  ];

  const membershipColumns: GridColDef[] = [
    {
      field: 'client',
      headerName: l.clientName,
      flex: 1,
      minWidth: 140,
      renderCell: (params) => {
        const client = params.value as ClientMembership['client'];
        if (!client) return '-';
        return (
          <Stack spacing={0}>
            <span>{client.name}</span>
          </Stack>
        );
      },
    },
    {
      field: 'plan',
      headerName: l.plan,
      flex: 1,
      minWidth: 130,
      renderCell: (params) => nameOf(params.value as MembershipPlan),
    },
    {
      field: 'planDiscount',
      headerName: l.discountPercent,
      width: 90,
      sortable: false,
      valueGetter: (_value, row) => Number((row as ClientMembership).plan?.discountPercent ?? 0),
      renderCell: (params) => `${Number(params.value) || 0}%`,
    },
    {
      field: 'planServices',
      headerName: l.services,
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => {
        const plan = (params.row as ClientMembership).plan;
        return renderServicesCell(plan?.serviceIds);
      },
    },
    {
      field: 'startDate',
      headerName: l.startDate,
      width: 110,
      renderCell: (params) => new Date(params.value as string).toLocaleDateString('en-GB'),
    },
    {
      field: 'endDate',
      headerName: l.endDate,
      width: 170,
      renderCell: (params) => {
        const d = new Date(params.value as string).toLocaleDateString('en-GB');
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
      width: 90,
      renderCell: (params) =>
        params.value !== undefined ? `${params.value} ${l.days}` : '-',
    },
    {
      field: 'status',
      headerName: l.status,
      width: 100,
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
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) =>
        params.row.status === 'ACTIVE' ? (
          <Button size="small" color="error" disabled={!canWrite} onClick={() => void handleCancelMembership(params.row.id)}>
            {l.cancelledSt}
          </Button>
        ) : null,
    },
  ];

  const assignBlocked =
    !assignClient ||
    !assignPlanId ||
    !selectedAssignPlan?.isActive ||
    assignClient.hasActiveMembership;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <PageHeader title={l.title} />
        <ExportButtons endpoint="/memberships/plans/export" />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={l.plans} />
          <Tab label={l.memberships} />
        </Tabs>
        {tab === 1 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{l.filterByPlan}</InputLabel>
            <Select
              value={planFilter}
              label={l.filterByPlan}
              onChange={(e) => handlePlanFilterChange(e.target.value as number | '')}
            >
              <MenuItem value="">{l.allPlans}</MenuItem>
              {plans.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {nameOf(p)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
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
                renderValue={(selected) => {
                  const ids = selected as number[];
                  if (ids.length === 0) return l.allServices;
                  return ids.map((id) => serviceName(id)).join(', ');
                }}
              >
                {services.map((svc) => (
                  <MenuItem key={svc.id} value={svc.id}>
                    {lang === 'ar' ? svc.nameAr : svc.nameEn}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {l.servicesOptionalHint}
              </Typography>
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
            <Autocomplete<MembershipClientOption>
              openOnFocus
              loading={assignClientsLoading}
              options={assignClientOptions}
              getOptionLabel={(c) => c.name}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              value={assignClient}
              onChange={(_e, value) => setAssignClient(value)}
              onOpen={() => {
                if (assignClientOptions.length === 0 && !assignClientsLoading) {
                  void fetchAssignClients();
                }
              }}
              filterOptions={(options, state) => {
                const q = state.inputValue.trim().toLowerCase();
                if (q === '') return options;
                return options.filter(
                  (c) =>
                    c.name.toLowerCase().includes(q) ||
                    (c.phone ?? '').toLowerCase().includes(q) ||
                    (c.whatsapp ?? '').toLowerCase().includes(q),
                );
              }}
              noOptionsText={assignClientsLoading ? l.loading : l.noClients}
              getOptionDisabled={(c) => c.hasActiveMembership}
              renderOption={(props, c) => {
                const { key, ...rest } = props as { key?: string };
                const phone = c.phone || c.whatsapp;
                return (
                  <Box component="li" key={key ?? c.id} {...rest}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography variant="body2" sx={{ flexGrow: 1, opacity: c.hasActiveMembership ? 0.5 : 1 }}>
                        {c.name}
                        {phone && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {phone}
                          </Typography>
                        )}
                      </Typography>
                      {c.hasActiveMembership && (
                        <Chip size="small" color="warning" label={l.hasActiveMembership} />
                      )}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={l.client}
                  placeholder={l.searchClientHint}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {assignClientsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {assignClient?.hasActiveMembership && (
              <Alert severity="warning">{l.activeMembershipWarning}</Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>{l.plan}</InputLabel>
              <Select
                value={assignPlanId}
                onChange={(e) => setAssignPlanId(e.target.value)}
                label={l.plan}
              >
                {plans.map((p) => (
                  <MenuItem key={p.id} value={p.id} disabled={!p.isActive}>
                    {nameOf(p)} — {formatMoney(p.price)}
                    {!p.isActive && ` (${l.inactive})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedAssignPlan && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {l.planPreview}
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    {nameOf(selectedAssignPlan)} — {formatMoney(selectedAssignPlan.price)} SAR
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {l.durationDays}: {selectedAssignPlan.durationDays} {l.days}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {l.discountPercent}: {Number(selectedAssignPlan.discountPercent) || 0}%
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{renderServicesCell(selectedAssignPlan.serviceIds)}</Box>
                </Stack>
              </Paper>
            )}

            {assignPlanId && !selectedAssignPlan?.isActive && (
              <Alert severity="error">{l.selectActivePlan}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>{l.cancel}</Button>
          <Button variant="contained" onClick={() => void handleAssign()} disabled={assignBlocked}>
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
