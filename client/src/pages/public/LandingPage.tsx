import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  Paper,
  Rating,
  Divider,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShieldCheckmarkIcon from '@mui/icons-material/Verified';
import SpaIcon from '@mui/icons-material/Spa';
import BrushIcon from '@mui/icons-material/Brush';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { publicApi, type ServiceItem, type EmployeeItem, type SalonInfo } from '../../api/public';

export default function LandingPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [servicesRes, employeesRes, infoRes] = await Promise.all([
          publicApi.getServices(),
          publicApi.getEmployees(),
          publicApi.getInfo(),
        ]);
        if (servicesRes.data) {
          setServices(servicesRes.data);
        }
        if (employeesRes.data) {
          setEmployees(employeesRes.data);
        }
        if (infoRes.data) {
          setSalonInfo(infoRes.data);
        }
      } catch (err) {
        console.error('Failed to load public data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const DAY_AR: Record<string, string> = {
    Sat: 'السبت',
    Sun: 'الأحد',
    Mon: 'الاثنين',
    Tue: 'الثلاثاء',
    Wed: 'الأربعاء',
    Thu: 'الخميس',
    Fri: 'الجمعة',
  };
  const DAY_EN: Record<string, string> = {
    Sat: 'Saturday',
    Sun: 'Sunday',
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
  };

  const formatTime12 = (time: string): string => {
    const [hRaw, mRaw] = time.split(':');
    const h = Number(hRaw);
    const m = mRaw ?? '00';
    const period = h >= 12 ? (isAr ? 'مساءً' : 'PM') : isAr ? 'صباحاً' : 'AM';
    let hour = h % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${m} ${period}`;
  };

  const hoursRows = (salonInfo?.hours ?? []).map((row) => ({
    dayLabel: isAr ? DAY_AR[row.day] ?? row.day : DAY_EN[row.day] ?? row.day,
    closed: (salonInfo?.closedDays ?? []).includes(row.day),
    range: `${formatTime12(row.opening || '10:00')} - ${formatTime12(row.closing || '21:00')}`,
  }));

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices =
    selectedCategory === 'all'
      ? services
      : services.filter((s) => s.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'شعر':
      case 'hair':
        return <ContentCutIcon fontSize="small" />;
      case 'مكياج':
      case 'makeup':
        return <BrushIcon fontSize="small" />;
      case 'أظافر':
      case 'nails':
        return <FaceRetouchingNaturalIcon fontSize="small" />;
      case 'عناية':
      case 'skincare':
      case 'سبا':
        return <SpaIcon fontSize="small" />;
      default:
        return <StarIcon fontSize="small" />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#faf7f9', color: '#1e293b' }}>
      <PublicNavbar />

      {/* --- HERO SECTION --- */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1b0a15 0%, #3b0f2a 50%, #68113e 100%)',
          color: '#ffffff',
          py: { xs: 8, md: 14 },
        }}
      >
        {/* Glow overlays */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(233,30,99,0.3) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(194,24,91,0.25) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<LocalOfferIcon sx={{ color: '#f48fb1 !important', fontSize: 16 }} />}
                label={isAr ? '✨ صالون التجميل والأناقة الأول' : '✨ Premium Beauty & Hair Salon'}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8bbd0',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(248, 187, 208, 0.3)',
                  fontWeight: 600,
                  mb: 3,
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.4rem', sm: '3.2rem', md: '3.8rem' },
                  lineHeight: 1.25,
                  mb: 2.5,
                  background: 'linear-gradient(45deg, #ffffff 30%, #f48fb1 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {isAr
                  ? 'عالم من الفخامة والعناية لجمالكِ الاستثنائي'
                  : 'Exquisite Luxury & Pampering For Your Radiance'}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#e2e8f0',
                  fontSize: { xs: '1.05rem', md: '1.2rem' },
                  lineHeight: 1.8,
                  maxWidth: 620,
                  mb: 4,
                }}
              >
                {isAr
                  ? 'اكتشفي أرقى خدمات العناية بالشعر، البشرة، والأظافر مع أمهر الخبيرات المعتمدات. احجزي موعدكِ أونلاين بكل سهولة في الوقت المناسب لكِ.'
                  : 'Experience top-tier hair styling, makeup, nail care, and spa treatments. Book your online appointment effortlessly within seconds.'}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => navigate('/booking')}
                  sx={{
                    borderRadius: '30px',
                    px: 4,
                    py: 1.6,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
                    boxShadow: '0 8px 25px rgba(233, 30, 99, 0.45)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d81b60 0%, #ad1457 100%)',
                      boxShadow: '0 10px 30px rgba(233, 30, 99, 0.6)',
                    },
                  }}
                >
                  {isAr ? 'احجزي موعدكِ الآن' : 'Book Your Appointment'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{
                    borderRadius: '30px',
                    px: 3.5,
                    py: 1.6,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(5px)',
                    '&:hover': {
                      borderColor: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {isAr ? 'استكشاف الخدمات والأسعار' : 'View Services & Rates'}
                </Button>
              </Stack>
            </Grid>

            {/* Visual Hero Banner */}
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Paper
                elevation={10}
                sx={{
                  position: 'relative',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #4a154b 0%, #c2185b 100%)',
                  p: 4,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#fff' }}>
                  {isAr ? '⭐ تجربة صالون فاخرة' : '⭐ Premium Experience'}
                </Typography>
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                      <ShieldCheckmarkIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                        {isAr ? 'مواد معقمة وأدوات ذات جودة عالية' : '100% Hygienic & Top Brands'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#f1f5f9' }}>
                        {isAr ? 'أحدث المنتجات العالمية للعناية الفائقة' : 'Using international professional products'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                      <AccessTimeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                        {isAr ? 'تأكيد الحجز الفوري' : 'Instant Slot Confirmation'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#f1f5f9' }}>
                        {isAr ? 'اختاري وقتكِ المناسب بدون انتظار' : 'No wait time, exact schedule guarantee'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                      <StarIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
                        {isAr ? 'خبيرات محترفات وبخبرة واسعة' : 'Certified Expert Stylists'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#f1f5f9' }}>
                        {isAr ? 'فريق كادر متخصص لكل نوع خدمة' : 'Dedicated specialists for every treatment'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* --- SERVICES SECTION --- */}
      <Container id="services" maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, color: '#c2185b', letterSpacing: 1.5, fontSize: '0.9rem' }}
          >
            {isAr ? 'قائمة الخدمات والأسعار' : 'SERVICES & PRICING'}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#1e293b' }}>
            {isAr ? 'اختر خيار الجمال الخاص بكِ' : 'Tailored Treatments For You'}
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mt: 1.5, maxWidth: 600, mx: 'auto' }}>
            {isAr
              ? 'تصفحي باقة الخدمات المتنوعة وقومي باختيار ما يناسبكِ للحجز المباشر'
              : 'Browse our complete service catalog with transparent pricing and service durations'}
          </Typography>
        </Box>

        {/* Category Tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, val) => setSelectedCategory(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: '#c2185b', height: 3, borderRadius: 2 },
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '1rem',
                color: '#64748b',
                '&.Mui-selected': { color: '#c2185b' },
              },
            }}
          >
            {categories.map((cat) => (
              <Tab
                key={cat}
                value={cat}
                label={
                  cat === 'all'
                    ? isAr
                      ? 'جميع الخدمات'
                      : 'All Services'
                    : cat
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Services Cards Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#c2185b' }} />
          </Box>
        ) : (
          <Grid container spacing={3.5}>
            {filteredServices.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '20px',
                    border: '1px solid #f1f5f9',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 15px 30px rgba(194, 24, 91, 0.12)',
                      borderColor: '#f8bbd0',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Chip
                        icon={getCategoryIcon(service.category)}
                        label={service.category}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: '#fce4ec',
                          color: '#c2185b',
                          borderRadius: '8px',
                        }}
                      />
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <AccessTimeIcon fontSize="small" sx={{ color: '#94a3b8', fontSize: 16 }} />
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          {service.durationMinutes} {isAr ? 'دقيقة' : 'min'}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
                      {isAr ? service.nameAr : service.nameEn}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                      {isAr
                        ? `جلسة متكاملة لعناية فائقة بأيدي كادرنا المتخصص مع مراعاة أدق التفاصيل.`
                        : `Professional treatment using top premium salon care products.`}
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 3, pt: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                          {isAr ? 'السعر' : 'Price'}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#c2185b' }}>
                          {service.price} {isAr ? 'ر.س' : 'SAR'}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/booking?serviceId=${service.id}`)}
                        sx={{
                          borderRadius: '16px',
                          px: 2.5,
                          py: 1,
                          fontWeight: 700,
                          backgroundColor: '#c2185b',
                          '&:hover': { backgroundColor: '#880e4f' },
                        }}
                      >
                        {isAr ? 'احجزي الآن' : 'Book'}
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* --- STYLISTS SECTION --- */}
      <Box id="stylists" sx={{ backgroundColor: '#ffffff', py: 10, borderTop: '1px solid #f1f5f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: '#c2185b', letterSpacing: 1.5, fontSize: '0.9rem' }}
            >
              {isAr ? 'طاقم العمل والخبرات' : 'OUR BEAUTY STYLISTS'}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#1e293b' }}>
              {isAr ? 'نخبة من خبيرات التجميل' : 'Meet Our Certified Artists'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mt: 1.5, maxWidth: 600, mx: 'auto' }}>
              {isAr
                ? 'فريقنا مكوّن من خبيرات متخصصات في أحدث صيحات القص والصبغات والمكياج والعناية'
                : 'Passionate stylists delivering bespoke beauty looks for every occasion'}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {employees.length > 0 ? (
              employees.map((emp, idx) => (
                <Grid item xs={12} sm={6} md={3} key={emp.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '20px',
                      textAlign: 'center',
                      backgroundColor: '#faf7f9',
                      border: '1px solid #f1f5f9',
                      transition: 'transform 0.3s ease',
                      '&:hover': { transform: 'translateY(-5px)' },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: ['#c2185b', '#e91e63', '#880e4f', '#d81b60'][idx % 4],
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        boxShadow: '0 8px 20px rgba(194, 24, 91, 0.25)',
                      }}
                    >
                      {(isAr ? emp.nameAr : emp.nameEn).charAt(0)}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {isAr ? emp.nameAr : emp.nameEn}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#c2185b', fontWeight: 600, mt: 0.5 }}>
                      {emp.role === 'STYLIST'
                        ? isAr
                          ? 'خبيرة كوافير وتسريحات'
                          : 'Senior Stylist'
                        : isAr
                        ? 'أخصائية عناية ومكياج'
                        : 'Beauty Specialist'}
                    </Typography>
                    <Stack direction="row" justifyContent="center" mt={1}>
                      <Rating value={5} readOnly size="small" precision={0.5} />
                    </Stack>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography textAlign="center" color="text.secondary">
                  {isAr ? 'جاري تحميل قائمة الموظفات...' : 'Loading stylists...'}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* --- BUSINESS HOURS SECTION --- */}
      <Box id="hours" sx={{ backgroundColor: '#fdf3f7', py: 10, borderTop: '1px solid #f1f5f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: '#c2185b', letterSpacing: 1.5, fontSize: '0.9rem' }}
            >
              {isAr ? 'ساعات العمل' : 'BUSINESS HOURS'}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#1e293b' }}>
              {isAr ? 'نستقبل العميلات يومياً' : 'Open Every Day'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', mt: 1 }}>
              {isAr ? 'احجزي موعدكِ في الوقت الذي يناسبك' : 'Book your appointment at the time that suits you'}
            </Typography>
          </Box>

          <Grid container spacing={3.5} justifyContent="center">
            {hoursRows.map((row, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '18px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <AccessTimeIcon sx={{ color: row.closed ? '#94a3b8' : '#c2185b', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {row.dayLabel}
                    </Typography>
                    <Typography variant="body2" sx={{ color: row.closed ? '#94a3b8' : '#475569', dir: 'ltr' }}>
                      {row.closed ? (isAr ? 'مغلق' : 'Closed') : row.range}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* --- REVIEWS / TESTIMONIALS SECTION --- */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, color: '#c2185b', letterSpacing: 1.5, fontSize: '0.9rem' }}
          >
            {isAr ? 'آراء العملاء' : 'CLIENT REVIEWS'}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, color: '#1e293b' }}>
            {isAr ? 'ماذا تقول عميلاتنا السعيدات؟' : 'Loved By Hundreds Of Clients'}
          </Typography>
        </Box>

        <Grid container spacing={3.5}>
          {[
            {
              name: 'سارة العتيبي',
              comment: 'أفضل تجربة صالون في الرياض! الموعد كان دقيق جداً والخدمة فوق الممتازة وخبيرات الصبغات مبدعات.',
              rating: 5,
            },
            {
              name: 'نورة الشمري',
              comment: 'حجزت أونلاين بكل سهولة وصلني كود الحجز ولم أنتظر دقيقة واحدة بالاستقبال. تجربة راقية بحق!',
              rating: 5,
            },
            {
              name: 'منى الحكيم',
              comment: 'عناية الأظافر والمساج عندهم خرافية! هدوء ونظافة واهتمام أدق التفاصيل.',
              rating: 5,
            },
          ].map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                }}
              >
                <Rating value={item.rating} readOnly sx={{ mb: 2, color: '#ffb300' }} />
                <Typography variant="body1" sx={{ color: '#475569', fontStyle: 'italic', mb: 3, lineHeight: 1.7 }}>
                  "{item.comment}"
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {item.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* --- CTA BANNER --- */}
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Paper
          sx={{
            p: { xs: 5, md: 8 },
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #c2185b 0%, #880e4f 100%)',
            color: '#fff',
            textAlign: 'center',
            boxShadow: '0 15px 35px rgba(194, 24, 91, 0.3)',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>
            {isAr ? 'جاهزة للحصول على إطلالة متميزة؟' : 'Ready For Your Gorgeous Look?'}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, maxWidth: 650, mx: 'auto', mb: 4 }}>
            {isAr
              ? 'احجزي موعدكِ الآن أونلاين بدقيقة واحدة واحفظي موعدكِ المفضل مع الخبيرة المناسبة لكِ.'
              : 'Secure your spot online within a minute with your favorite specialist.'}
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<CalendarMonthIcon />}
            onClick={() => navigate('/booking')}
            sx={{
              backgroundColor: '#ffffff',
              color: '#c2185b',
              borderRadius: '30px',
              px: 5,
              py: 1.8,
              fontSize: '1.1rem',
              fontWeight: 800,
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
              '&:hover': {
                backgroundColor: '#f8bbd0',
                color: '#880e4f',
              },
            }}
          >
            {isAr ? 'احجزي الموعد الآن' : 'Book Appointment Now'}
          </Button>
        </Paper>
      </Container>

      <PublicFooter />
    </Box>
  );
}
