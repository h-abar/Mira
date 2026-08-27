import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import {
  closeShift,
  getActiveShift,
  openShift,
  type ShiftSession,
} from '../api/shifts';
import { listEmployees, type Employee } from '../api/employees';
import type { ApiError } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function ShiftStatusBar() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const canReadShifts = useAuthStore((s) => s.hasPermission('shifts.read'));

  const [activeShift, setActiveShift] = useState<ShiftSession | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [openingBalance, setOpeningBalance] = useState<string>('0');
  const [openNotes, setOpenNotes] = useState<string>('');

  const [actualCash, setActualCash] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const shift = await getActiveShift();
      setActiveShift(shift);
    } catch (err) {
      console.error('Failed to load shift status:', err);
    }
    try {
      const emps = await listEmployees();
      setEmployees(emps.filter((e) => e.isActive));
      if (emps.length > 0 && selectedEmployeeId === '') {
        setSelectedEmployeeId(emps[0].id);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleOpenShift = async () => {
    if (!selectedEmployeeId) {
      setError(isAr ? 'يرجى اختيار الموظفة' : 'Please select an employee');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await openShift({
        employeeId: Number(selectedEmployeeId),
        openingBalance: Number(openingBalance) || 0,
        notes: openNotes.trim() || undefined,
      });
      setOpenDialogOpen(false);
      setOpenNotes('');
      await loadStatus();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    if (actualCash === '' || Number.isNaN(Number(actualCash))) {
      setError(isAr ? 'يرجى إدخال المبلغ الفعلي بعد الجرد' : 'Please enter actual cash counted');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await closeShift(activeShift.id, {
        actualCash: Number(actualCash),
        notes: closeNotes.trim() || undefined,
      });
      setCloseDialogOpen(false);
      setActualCash('');
      setCloseNotes('');
      await loadStatus();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatMoney = (amount: number | string | null | undefined) =>
    `${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${
      isAr ? 'ر.س' : 'SAR'
    }`;

  const liveTotals = activeShift?.liveTotals;
  const expectedCash = liveTotals?.expectedCash ?? Number(activeShift?.expectedCash ?? 0);
  const countedCashNumber = actualCash !== '' ? Number(actualCash) : 0;
  const difference = actualCash !== '' ? countedCashNumber - expectedCash : 0;

  if (!canReadShifts) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
      {loading ? (
        <CircularProgress size={20} sx={{ color: '#fff' }} />
      ) : activeShift ? (
        <Button
          variant="contained"
          size="small"
          startIcon={<PointOfSaleIcon />}
          onClick={() => {
            setError(null);
            setActualCash(String(expectedCash));
            setCloseDialogOpen(true);
          }}
          sx={{
            bgcolor: 'success.dark',
            color: '#fff',
            borderRadius: '20px',
            textTransform: 'none',
            fontSize: '0.82rem',
            px: 1.8,
            boxShadow: '0 2px 8px rgba(46, 125, 50, 0.4)',
            '&:hover': { bgcolor: 'success.main' },
          }}
        >
          {isAr
            ? `🟢 وردية مفتوحة: ${activeShift.employee.nameAr} | ${formatMoney(expectedCash)}`
            : `🟢 Shift Open: ${activeShift.employee.nameEn} | ${formatMoney(expectedCash)}`}
        </Button>
      ) : (
        <Button
          variant="outlined"
          size="small"
          startIcon={<LockOpenIcon />}
          onClick={() => {
            setError(null);
            setOpenDialogOpen(true);
          }}
          sx={{
            color: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '20px',
            textTransform: 'none',
            fontSize: '0.82rem',
            px: 1.8,
            '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)' },
          }}
        >
          {isAr ? '🔴 الوردية مغلقة (فتح وردية)' : '🔴 Shift Closed (Open Shift)'}
        </Button>
      )}

      {/* Dialog: Open Shift */}
      <Dialog open={openDialogOpen} onClose={() => setOpenDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockOpenIcon color="primary" />
          {isAr ? 'فتح وردية كاشير جديدة' : 'Open New Cashier Shift'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth>
              <InputLabel>{isAr ? 'الموظفة المسؤولة عن الوردية' : 'Responsible Employee'}</InputLabel>
              <Select
                value={selectedEmployeeId}
                label={isAr ? 'الموظفة المسؤولة عن الوردية' : 'Responsible Employee'}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {isAr ? emp.nameAr : emp.nameEn} ({emp.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={isAr ? 'الرصيد الافتتاحي في الدرج (ر.س)' : 'Opening Drawer Balance (SAR)'}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              helperText={isAr ? 'المبلغ النقدي المتوفر بالدرج عند بدء الوردية' : 'Cash amount in drawer at start'}
              fullWidth
            />

            <TextField
              label={isAr ? 'ملاحظات' : 'Notes'}
              value={openNotes}
              onChange={(e) => setOpenNotes(e.target.value)}
              placeholder={isAr ? 'أي ملاحظات عند بدء الدوام' : 'Any opening shift notes'}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button
            variant="contained"
            onClick={handleOpenShift}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <LockOpenIcon />}
          >
            {isAr ? 'بدء الوردية' : 'Start Shift'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Shift Details & Close Shift */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PointOfSaleIcon color="primary" />
            <Typography variant="h6">
              {isAr ? 'تفاصيل الوردية وإغلاق الصندوق' : 'Shift Details & Close Drawer'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => void loadStatus()}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {activeShift && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {isAr ? 'الموظفة:' : 'Employee:'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {isAr ? activeShift.employee.nameAr : activeShift.employee.nameEn}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {isAr ? 'وقت البدء:' : 'Started At:'}
                    </Typography>
                    <Typography variant="body2">
                      {new Date(activeShift.startTime).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      - {new Date(activeShift.startTime).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {isAr ? 'فتحت بواسطة:' : 'Opened By:'}
                    </Typography>
                    <Typography variant="body2">{activeShift.openedByUser.username}</Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{isAr ? 'الرصيد الافتتاحي:' : 'Opening Balance:'}</Typography>
                    <Typography variant="body2">{formatMoney(activeShift.openingBalance)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{isAr ? 'مبيعات الكاش (نقدي):' : 'Cash Sales:'}</Typography>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                      +{formatMoney(liveTotals?.totalCashSales ?? 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{isAr ? 'مبيعات البطاقة (شبكة):' : 'Card Sales:'}</Typography>
                    <Typography variant="body2">+{formatMoney(liveTotals?.totalCardSales ?? 0)}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{isAr ? 'مصروفات الوردية (نقدية):' : 'Shift Expenses:'}</Typography>
                    <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                      -{formatMoney(liveTotals?.totalExpenses ?? 0)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'primary.50',
                      border: '1px solid',
                      borderColor: 'primary.200',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {isAr ? 'المبلغ النقدي المتوقع بالدرج:' : 'Expected Cash in Drawer:'}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                      {formatMoney(expectedCash)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            <TextField
              label={isAr ? 'المبلغ النقدي الفعلي بالدرج (بعد الجرد)' : 'Actual Cash Counted in Drawer'}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              helperText={isAr ? 'قم بعد النقود بالدرج وأدخل المبلغ هنا' : 'Count physical cash and enter total'}
              fullWidth
              required
            />

            {actualCash !== '' && (
              <Box>
                {Math.abs(difference) < 0.01 ? (
                  <Alert severity="success">
                    {isAr ? '✅ الصندوق متطابق تماماً مع المبيعات' : '✅ Drawer is perfectly balanced!'}
                  </Alert>
                ) : difference > 0 ? (
                  <Alert severity="info">
                    {isAr
                      ? `🟢 يوجد فائض نقدي في الصندوق بقيمة: ${formatMoney(difference)}`
                      : `🟢 Cash surplus in drawer: ${formatMoney(difference)}`}
                  </Alert>
                ) : (
                  <Alert severity="warning">
                    {isAr
                      ? `⚠️ يوجد عجز نقدي في الصندوق بقيمة: ${formatMoney(Math.abs(difference))}`
                      : `⚠️ Cash deficit in drawer: ${formatMoney(Math.abs(difference))}`}
                  </Alert>
                )}
              </Box>
            )}

            <TextField
              label={isAr ? 'ملاحظات الإغلاق والتسليم' : 'Closing & Handover Notes'}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder={isAr ? 'أي ملاحظات بخصوص الإغلاق أو الفروقات' : 'Any closing or reconciliation notes'}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCloseShift}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <LockIcon />}
          >
            {isAr ? 'تقفيل الوردية وإغلاق الصندوق' : 'Close & Reconcile Shift'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
