import { Box, Container, Grid, Typography, Stack, Divider } from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { publicApi, type SalonInfo } from '../../api/public';
import SocialLinks from './SocialLinks';

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
  Sat: 'Sat',
  Sun: 'Sun',
  Mon: 'Mon',
  Tue: 'Tue',
  Wed: 'Wed',
  Thu: 'Thu',
  Fri: 'Fri',
};

export default function PublicFooter() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [groups, setGroups] = useState<{ label: string; range: string }[]>([]);
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);

  useEffect(() => {
    let active = true;
    const formatTime12 = (time: string): string => {
      const [hRaw, mRaw] = time.split(':');
      const h = Number(hRaw);
      const m = mRaw ?? '00';
      const period = h >= 12 ? (isAr ? 'مساءً' : 'PM') : isAr ? 'صباحاً' : 'AM';
      let hour = h % 12;
      if (hour === 0) hour = 12;
      return `${hour}:${m} ${period}`;
    };
    const dayName = (abbr: string): string => (isAr ? DAY_AR[abbr] ?? abbr : DAY_EN[abbr] ?? abbr);
    publicApi
      .getInfo()
      .then((res) => {
        if (!active || !res.data) return;
        const info: SalonInfo = res.data;
        setSalonInfo(info);
        const closedSet = new Set(info.closedDays ?? []);
        const schedule = info.hours ?? [];
        const keyOf = (day: string, opening: string, closing: string) =>
          closedSet.has(day) ? 'closed' : `${opening || '10:00'}-${closing || '21:00'}`;
        const out: { label: string; range: string }[] = [];
        for (let i = 0; i < schedule.length; i++) {
          const current = schedule[i];
          const range = closedSet.has(current.day)
            ? isAr
              ? 'مغلق'
              : 'Closed'
            : `${formatTime12(current.opening || '10:00')} - ${formatTime12(current.closing || '21:00')}`;
          const currentKey = keyOf(current.day, current.opening, current.closing);
          let j = i;
          while (j + 1 < schedule.length && keyOf(schedule[j + 1].day, schedule[j + 1].opening, schedule[j + 1].closing) === currentKey) {
            j++;
          }
          const label =
            i === j ? dayName(current.day) : `${dayName(schedule[i].day)} - ${dayName(schedule[j].day)}`;
          out.push({ label, range });
          i = j;
        }
        setGroups(out);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1a1016',
        color: '#f8fafc',
        pt: 8,
        pb: 4,
        mt: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          {/* Brand Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c2185b 0%, #e91e63 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ContentCutIcon sx={{ color: '#fff' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
                MIRA BEAUTY SALON
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.8, mb: 3 }}>
              {isAr
                ? 'صالون ميرا للتجميل والعناية المتكاملة بالأناقة والجمال. نمنحكِ تجربة استثنائية من الاسترخاء والجاذبية بأيدي أمهر الخبيرات في عالم التجميل.'
                : 'Mira Salon offers top-tier beauty and luxury pampering services tailored to highlight your radiance and inner elegance.'}
            </Typography>
            <SocialLinks social={salonInfo?.social} variant="dark" isAr={isAr} />
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, color: '#f1f5f9' }}>
              {isAr ? 'روابط سريعة' : 'Quick Links'}
            </Typography>
            <Stack spacing={1.5}>
              <Typography component="a" href="#services" variant="body2" sx={{ color: '#cbd5e1', textDecoration: 'none', '&:hover': { color: '#e91e63' } }}>
                {isAr ? '• خدمات العناية بالشعر والتسريحات' : '• Hair Styling & Care'}
              </Typography>
              <Typography component="a" href="#services" variant="body2" sx={{ color: '#cbd5e1', textDecoration: 'none', '&:hover': { color: '#e91e63' } }}>
                {isAr ? '• المكياج والعرائس' : '• Bridal & Event Makeup'}
              </Typography>
              <Typography component="a" href="#services" variant="body2" sx={{ color: '#cbd5e1', textDecoration: 'none', '&:hover': { color: '#e91e63' } }}>
                {isAr ? '• الأظافر والمانيكير والبديكير' : '• Nails, Manicure & Pedicure'}
              </Typography>
              <Typography component="a" href="#services" variant="body2" sx={{ color: '#cbd5e1', textDecoration: 'none', '&:hover': { color: '#e91e63' } }}>
                {isAr ? '• جلسات العناية بالبشرة والمساج' : '• Skincare & Spa Massage'}
              </Typography>
            </Stack>
          </Grid>

          {/* Contact & Hours */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, color: '#f1f5f9' }}>
              {isAr ? 'تواصل معنا وساعات العمل' : 'Contact & Business Hours'}
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <LocationOnIcon sx={{ color: '#e91e63', fontSize: 20, mt: 0.3 }} />
                <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                  {isAr ? 'شارع الأمير سلطان، الرياض، المملكة العربية السعودية' : 'Prince Sultan St, Riyadh, Saudi Arabia'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <PhoneIcon sx={{ color: '#e91e63', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#cbd5e1', dir: 'ltr' }}>
                  +966 50 123 4567 / +966 11 987 6543
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <AccessTimeIcon sx={{ color: '#e91e63', fontSize: 20, mt: 0.3 }} />
                <Stack spacing={0.5}>
                  {groups.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                      {isAr ? 'يومياً من 10:00 صباحاً - 9:00 مساءً' : 'Daily: 10:00 AM - 09:00 PM'}
                    </Typography>
                  ) : (
                    groups.map((g, index) => (
                      <Typography key={index} variant="body2" sx={{ color: '#cbd5e1' }}>
                        {isAr ? `${g.label}: ${g.range}` : `${g.label}: ${g.range}`}
                      </Typography>
                    ))
                  )}
                </Stack>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            © {new Date().getFullYear()} Mira Beauty Salon. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {isAr ? 'يعمل بنظام ميرا Mira لإدارة الصالونات' : 'Powered by Mira Salon Management System'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
