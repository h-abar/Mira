import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { publicApi, type ServiceItem, type EmployeeItem, type SalonInfo, type DayHours } from '../../api/public';
import { useTranslation } from 'react-i18next';

const DAY_LABELS_AR: Record<string, string> = {
  Sat: 'السبت',
  Sun: 'الأحد',
  Mon: 'الإثنين',
  Tue: 'الثلاثاء',
  Wed: 'الأربعاء',
  Thu: 'الخميس',
  Fri: 'الجمعة',
};

export default function BookingPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [perServiceEmployee, setPerServiceEmployee] = useState<Record<number, number | ''>>({});

  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<{ time: string; available?: boolean; availableEmployeeId?: number; availableEmployeeName?: string }[]>([]);
  const [selectedTime, setSelectedTime] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    bookingCode: string;
    appointments: {
      id: number;
      date: string;
      startTime: string;
      endTime: string;
      service: { nameAr: string; nameEn: string };
      employee: { nameAr: string; nameEn: string };
    }[];
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingServices(true);
        const [sRes, eRes, infoRes] = await Promise.all([
          publicApi.getServices(),
          publicApi.getEmployees(),
          publicApi.getInfo(),
        ]);
        setServices(sRes.data ?? []);
        setEmployees(eRes.data ?? []);
        setSalonInfo(infoRes.data ?? null);
      } catch {
        setErrorMsg(isAr ? 'تعذر تحميل بيانات الصالون' : 'Could not load salon data');
      } finally {
        setLoadingServices(false);
      }
    };
    load();
  }, [isAr]);

  const selectedServiceObjects = useMemo(
    () => services.filter((s) => selectedServices.includes(s.id)),
    [services, selectedServices],
  );

  const totalDuration = useMemo(
    () => selectedServiceObjects.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
    [selectedServiceObjects],
  );

  const closedDays = useMemo(() => salonInfo?.closedDays ?? [], [salonInfo]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const isDateClosed = useMemo(() => {
    if (!date) return false;
    const [y, m, d] = date.split('-').map(Number);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(y, m - 1, d).getDay()];
    return closedDays.includes(dayName);
  }, [date, closedDays]);

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setPerServiceEmployee((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelectedTime('');
  };

  const setServiceEmployee = (serviceId: number, employeeId: number | '') => {
    setPerServiceEmployee((prev) => ({ ...prev, [serviceId]: employeeId }));
    setSelectedTime('');
  };

  // Effective employee per service: explicit assignment falls back to global preference
  const effectiveEmployeeFor = (serviceId: number): number | undefined => {
    const per = perServiceEmployee[serviceId];
    if (per !== undefined && per !== '') return Number(per);
    if (selectedEmployee !== '') return Number(selectedEmployee);
    return undefined;
  };

  const fetchSlots = async () => {
    if (!date || selectedServices.length === 0) return;
    try {
      setLoadingSlots(true);
      setSelectedTime('');
      // Prefer the first explicit per-service employee; otherwise the global preference
      const preferredEmployee =
        selectedServices
          .map((sid) => perServiceEmployee[sid])
          .find((v) => v !== undefined && v !== '') ?? selectedEmployee;
      const res = await publicApi.getAvailableSlots(
        date,
        selectedServices,
        preferredEmployee ? Number(preferredEmployee) : undefined,
      );
      setSlots(res.data ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (step === 3 && date && selectedServices.length > 0) {
      fetchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, date, selectedEmployee, perServiceEmployee]);

  const handleSubmit = async () => {
    if (!date || !selectedTime || selectedServices.length === 0) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const payload = {
        name: clientName,
        phone: clientPhone,
        employeeId: selectedEmployee ? Number(selectedEmployee) : undefined,
        items: selectedServices.map((sid) => ({
          serviceId: sid,
          employeeId: effectiveEmployeeFor(sid),
        })),
        date,
        startTime: selectedTime,
        notes,
      };
      const res = await publicApi.createBooking(payload);
      setBookingResult({
        bookingCode: res.data.bookingCode,
        appointments: (res.data.appointments ?? []).map((a) => ({
          id: a.id,
          date: a.date,
          startTime: a.startTime,
          endTime: a.endTime,
          service: a.service,
          employee: a.employee,
        })),
      });
      setStep(5);
    } catch (err: any) {
      setErrorMsg(err?.message || (isAr ? 'تعذر إتمام الحجز' : 'Booking failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [isAr ? 'اختيار الخدمات' : 'Select Services', isAr ? 'الخبيرة' : 'Specialist', isAr ? 'الموعد' : 'Date & Time', isAr ? 'بياناتك' : 'Your Details'];

  const renderWorkingHours = () => {
    if (!salonInfo) return null;
    const dayOrder: DayHours[] = [...salonInfo.hours];
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', backgroundColor: '#fff0f6', border: '1px solid #fce4ec', mb: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <EventAvailableIcon sx={{ color: '#c2185b' }} />
          <Typography variant="subtitle1" fontWeight={800} color="#880e4f">
            {isAr ? 'ساعات العمل' : 'Working Hours'}
          </Typography>
        </Stack>
        <Grid container spacing={1.5}>
          {dayOrder.map((h) => {
            const closed = closedDays.includes(h.day);
            return (
              <Grid item xs={6} sm={4} md={3} key={h.day}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    backgroundColor: closed ? '#f3f4f6' : '#ffffff',
                    border: '1px solid #f1f5f9',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <Typography variant="body2" fontWeight={700} color="#1e293b">
                    {DAY_LABELS_AR[h.day] ?? h.day}
                  </Typography>
                  <Typography variant="caption" color={closed ? '#ef4444' : '#64748b'}>
                    {closed ? (isAr ? 'مغلق' : 'Closed') : `${h.opening} – ${h.closing}`}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  if (bookingResult) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#faf7f9', pb: 10 }}>
        <PublicNavbar />
        <Container maxWidth="sm" sx={{ pt: 8, pb: 8 }}>
          <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: '24px', textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#16a34a', mb: 2 }} />
            <Typography variant="h5" fontWeight={800} color="#1e293b" mb={1}>
              {isAr ? 'تم تأكيد حجزكِ' : 'Booking Confirmed'}
            </Typography>
            <Typography variant="body2" color="#64748b" mb={3}>
              {isAr ? 'رمز الحجز الخاص بكِ' : 'Your booking reference'}
            </Typography>
            <Chip label={bookingResult.bookingCode} color="primary" sx={{ fontWeight: 800, fontSize: 18, px: 2, py: 2.5, backgroundColor: '#c2185b' }} />

            <Stack spacing={2} mt={4} textAlign="right">
              {bookingResult.appointments.map((a) => (
                <Box key={a.id} sx={{ p: 2, borderRadius: '14px', border: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                  <Typography variant="body1" fontWeight={700}>
                    {isAr ? a.service.nameAr : a.service.nameEn}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.date.split('T')[0]} | {a.startTime} – {a.endTime} | {isAr ? a.employee.nameAr : a.employee.nameEn}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 4, borderRadius: '16px', fontWeight: 700 }}
              onClick={() => {
                setBookingResult(null);
                setStep(1);
                setSelectedServices([]);
                setSelectedEmployee('');
                setSelectedTime('');
                setDate('');
                setClientName('');
                setClientPhone('');
                setNotes('');
              }}
            >
              {isAr ? 'حجز جديد' : 'New Booking'}
            </Button>
          </Paper>
        </Container>
        <PublicFooter />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#faf7f9', pb: 10 }}>
      <PublicNavbar />

      <Container maxWidth="md" sx={{ pt: 6, pb: 6 }}>
        <Typography variant="h4" textAlign="center" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
          {isAr ? 'احجزي موعدكِ' : 'Book Your Appointment'}
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ color: '#64748b', mb: 4 }}>
          {isAr ? 'اختاري أكثر من خدمة واحجزي في وقت واحد' : 'Choose multiple services and book them together'}
        </Typography>

        {renderWorkingHours()}

        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: '24px', backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
          <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: '12px', mb: 3 }}>
              {errorMsg}
            </Alert>
          )}

          {loadingServices ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {step === 1 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    {isAr ? 'اختاري الخدمات المطلوبة' : 'Select the services you need'}
                  </Typography>
                  <Grid container spacing={2}>
                    {services.map((s) => {
                      const selected = selectedServices.includes(s.id);
                      return (
                        <Grid item xs={12} sm={6} key={s.id}>
                          <Card
                            onClick={() => toggleService(s.id)}
                            sx={{
                              cursor: 'pointer',
                              borderRadius: '16px',
                              border: selected ? '2px solid #c2185b' : '1px solid #f1f5f9',
                              backgroundColor: selected ? '#fff0f6' : '#ffffff',
                              transition: 'all .15s',
                            }}
                          >
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography fontWeight={700}>{isAr ? s.nameAr : s.nameEn}</Typography>
                                {selected && <Chip size="small" color="primary" label={isAr ? 'مختارة' : 'Selected'} sx={{ backgroundColor: '#c2185b' }} />}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {s.durationMinutes} {isAr ? 'دقيقة' : 'min'} · {s.price} {isAr ? 'ر.س' : 'SAR'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                  {selectedServiceObjects.length > 0 && (
                    <Alert severity="info" sx={{ borderRadius: '12px', mt: 3 }}>
                      {isAr
                        ? `إجمالي المدة التقديرية: ${totalDuration} دقيقة (${selectedServiceObjects.length} خدمات)`
                        : `Estimated total duration: ${totalDuration} min (${selectedServiceObjects.length} services)`}
                    </Alert>
                  )}
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={selectedServices.length === 0}
                    sx={{ mt: 3, borderRadius: '16px', py: 1.3, fontWeight: 700, backgroundColor: '#c2185b', '&:hover': { backgroundColor: '#880e4f' } }}
                    onClick={() => setStep(2)}
                  >
                    {isAr ? 'التالي' : 'Next'}
                  </Button>
                </Box>
              )}

              {step === 2 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    {isAr ? 'اختاري الخبيرة لكل خدمة' : 'Choose a specialist per service'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" mb={2} display="block">
                    {isAr
                      ? 'يمكنكِ تعيين خبيرة مختلفة لكل خدمة، أو اختيار "أي خبيرة متاحة" لترك الأمر للصالون.'
                      : 'You can assign a different specialist per service, or pick "Any available" to let the salon decide.'}
                  </Typography>

                  {/* Global preference (applies to services without an explicit choice) */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>{isAr ? 'تفضيل عام (للخدمات بدون اختيار)' : 'General preference (for unselected)'}</InputLabel>
                    <Select
                      value={selectedEmployee}
                      label={isAr ? 'تفضيل عام (للخدمات بدون اختيار)' : 'General preference (for unselected)'}
                      onChange={(e) => setSelectedEmployee(e.target.value as number | '')}
                    >
                      <MenuItem value="">
                        <em>{isAr ? 'أي خبيرة متاحة' : 'Any available'}</em>
                      </MenuItem>
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {isAr ? emp.nameAr : emp.nameEn}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Divider sx={{ mb: 2 }} />

                  {/* Per-service specialist selection */}
                  <Stack spacing={2}>
                    {selectedServiceObjects.map((s) => {
                      const value = perServiceEmployee[s.id] ?? '';
                      return (
                        <Box key={s.id} sx={{ p: 2, borderRadius: '14px', border: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                          <Typography fontWeight={700} mb={1}>
                            {isAr ? s.nameAr : s.nameEn}
                          </Typography>
                          <FormControl fullWidth size="small">
                            <InputLabel>{isAr ? 'الخبيرة' : 'Specialist'}</InputLabel>
                            <Select
                              value={value}
                              label={isAr ? 'الخبيرة' : 'Specialist'}
                              onChange={(e) => setServiceEmployee(s.id, e.target.value as number | '')}
                            >
                              <MenuItem value="">
                                <em>{isAr ? 'استخدام التفضيل العام' : 'Use general preference'}</em>
                              </MenuItem>
                              {employees.map((emp) => (
                                <MenuItem key={emp.id} value={emp.id}>
                                  {isAr ? emp.nameAr : emp.nameEn}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      );
                    })}
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Button variant="outlined" sx={{ borderRadius: '16px', flex: 1 }} onClick={() => setStep(1)}>
                      {isAr ? 'السابق' : 'Back'}
                    </Button>
                    <Button
                      variant="contained"
                      sx={{ borderRadius: '16px', flex: 1, fontWeight: 700, backgroundColor: '#c2185b', '&:hover': { backgroundColor: '#880e4f' } }}
                      onClick={() => setStep(3)}
                    >
                      {isAr ? 'التالي' : 'Next'}
                    </Button>
                  </Stack>
                </Box>
              )}

              {step === 3 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    {isAr ? 'اختاري التاريخ والوقت' : 'Choose date and time'}
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    label={isAr ? 'التاريخ' : 'Date'}
                    value={date}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: todayStr }}
                    onChange={(e) => setDate(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                  />
                  {isDateClosed && (
                    <Alert severity="warning" sx={{ borderRadius: '12px', mb: 2 }}>
                      {isAr ? 'الصالون مغلق في هذا اليوم' : 'Salon is closed on this day'}
                    </Alert>
                  )}
                  {loadingSlots ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={1.5}>
                      {slots.map((slot) => {
                        const taken = slot.available === false;
                        return (
                        <Grid item xs={4} sm={3} key={slot.time}>
                          <Button
                            variant={selectedTime === slot.time ? 'contained' : 'outlined'}
                            disabled={taken}
                            onClick={() => setSelectedTime(slot.time)}
                            sx={{
                              borderRadius: '12px',
                              width: '100%',
                              fontWeight: 700,
                              backgroundColor: selectedTime === slot.time ? '#c2185b' : 'transparent',
                              color: taken ? '#94a3b8' : selectedTime === slot.time ? '#fff' : '#c2185b',
                              borderColor: '#f1f5f9',
                            }}
                          >
                            {slot.time}
                          </Button>
                        </Grid>
                        );
                      })}
                      {date && !isDateClosed && slots.length === 0 && (
                        <Grid item xs={12}>
                          <Alert severity="info" sx={{ borderRadius: '12px' }}>
                            {isAr ? 'لا توجد مواعيد متاحة لهذا التاريخ' : 'No available slots for this date'}
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  )}
                  <Stack direction="row" spacing={2} mt={3}>
                    <Button variant="outlined" sx={{ borderRadius: '16px', flex: 1 }} onClick={() => setStep(2)}>
                      {isAr ? 'السابق' : 'Back'}
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!selectedTime || isDateClosed}
                      sx={{ borderRadius: '16px', flex: 1, fontWeight: 700, backgroundColor: '#c2185b', '&:hover': { backgroundColor: '#880e4f' } }}
                      onClick={() => setStep(4)}
                    >
                      {isAr ? 'التالي' : 'Next'}
                    </Button>
                  </Stack>
                </Box>
              )}

              {step === 4 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    {isAr ? 'بياناتك' : 'Your details'}
                  </Typography>
                  <TextField
                    fullWidth
                    label={isAr ? 'الاسم' : 'Name'}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                  />
                  <TextField
                    fullWidth
                    label={isAr ? 'رقم الهاتف' : 'Phone'}
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label={isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                    <Typography variant="body2" color="text.secondary">
                      {isAr ? 'الخدمات' : 'Services'}:
                    </Typography>
                    {selectedServiceObjects.map((s) => (
                      <Chip key={s.id} size="small" label={isAr ? s.nameAr : s.nameEn} />
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" sx={{ borderRadius: '16px', flex: 1 }} onClick={() => setStep(3)}>
                      {isAr ? 'السابق' : 'Back'}
                    </Button>
                    <Button
                      variant="contained"
                      disabled={submitting || !clientName || !clientPhone}
                      startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
                      sx={{ borderRadius: '16px', flex: 1, fontWeight: 700, backgroundColor: '#c2185b', '&:hover': { backgroundColor: '#880e4f' } }}
                      onClick={handleSubmit}
                    >
                      {isAr ? 'تأكيد الحجز' : 'Confirm Booking'}
                    </Button>
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>

      <PublicFooter />
    </Box>
  );
}
