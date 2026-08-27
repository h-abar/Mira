import { useState } from 'react';
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
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useTranslation } from 'react-i18next';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { publicApi, type BookingResponseData } from '../../api/public';

export default function BookingStatusPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [bookingCode, setBookingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingResponseData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال رمز الحجز' : 'Please enter booking code');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      setBookingData(null);
      const res = await publicApi.getBookingByCode(bookingCode.trim());
      if (res.data) {
        setBookingData(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isAr ? 'لم يتم العثور على الحجز برمز الاستعلام المدخل' : 'Booking not found'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return <Chip label={isAr ? 'مؤكد' : 'Booked'} color="primary" sx={{ fontWeight: 700 }} />;
      case 'ARRIVED':
        return <Chip label={isAr ? 'وصلت الصالون' : 'Arrived'} color="info" sx={{ fontWeight: 700 }} />;
      case 'DONE':
        return <Chip label={isAr ? 'مكتمل' : 'Done'} color="success" sx={{ fontWeight: 700 }} />;
      case 'CANCELLED':
        return <Chip label={isAr ? 'ملغي' : 'Cancelled'} color="error" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={status} />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#faf7f9', pb: 10 }}>
      <PublicNavbar />

      <Container maxWidth="sm" sx={{ pt: 8, pb: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: '24px',
            backgroundColor: '#ffffff',
            border: '1px solid #f1f5f9',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Typography variant="h5" textAlign="center" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
            {isAr ? 'الاستعلام عن حالة الحجز' : 'Check Appointment Status'}
          </Typography>
          <Typography variant="body2" textAlign="center" sx={{ color: '#64748b', mb: 4 }}>
            {isAr ? 'أدخلي كود الحجز المكون من الأحرف والأرقام لتفاصيل موعدكِ' : 'Enter your reference code to view booking details'}
          </Typography>

          <form onSubmit={handleSearch}>
            <Stack direction="row" spacing={1.5} mb={3}>
              <TextField
                fullWidth
                placeholder={isAr ? 'مثال: SLN-104-582' : 'e.g. SLN-104-582'}
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{
                  borderRadius: '16px',
                  px: 3,
                  fontWeight: 700,
                  backgroundColor: '#c2185b',
                  '&:hover': { backgroundColor: '#880e4f' },
                }}
              >
                {isAr ? 'بحث' : 'Search'}
              </Button>
            </Stack>
          </form>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: '12px', mb: 3 }}>
              {errorMsg}
            </Alert>
          )}

          {bookingData && bookingData.appointment && (
            (() => {
              const appt = bookingData.appointment;
              return (
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="subtitle1" fontWeight={800} color="#c2185b">
                  {bookingData.bookingCode}
                </Typography>
                {getStatusChip(appt.status)}
              </Stack>

              <Grid container spacing={2.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {isAr ? 'اسم العميلة' : 'Client Name'}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {appt.client.name}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {isAr ? 'رقم الهاتف' : 'Phone'}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {appt.client.phone}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {isAr ? 'الخدمة' : 'Service'}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {isAr ? appt.service.nameAr : appt.service.nameEn}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {isAr ? 'الخبيرة' : 'Specialist'}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {isAr ? appt.employee.nameAr : appt.employee.nameEn}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {isAr ? 'التاريخ' : 'Date'}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {appt.date.split('T')[0]}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {isAr ? 'الوقت' : 'Time'}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {appt.startTime} – {appt.endTime}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Button
                fullWidth
                variant="contained"
                startIcon={<WhatsAppIcon />}
                component="a"
                href={`https://wa.me/966500000000?text=${encodeURIComponent(
                  `استفسار عن حجز برمز: ${bookingData.bookingCode}`,
                )}`}
                target="_blank"
                sx={{
                  borderRadius: '16px',
                  py: 1.2,
                  backgroundColor: '#25D366',
                  '&:hover': { backgroundColor: '#1eaa53' },
                  fontWeight: 700,
                }}
              >
                {isAr ? 'مراسلة الاستقبال عبر WhatsApp' : 'Contact Reception'}
              </Button>
            </Box>
              );
            })()
          )}
        </Paper>
      </Container>

      <PublicFooter />
    </Box>
  );
}
