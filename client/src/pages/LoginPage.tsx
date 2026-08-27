import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LanguageIcon from '@mui/icons-material/Language';
import { api, type ApiError } from '../api/client';
import { useAuthStore, type AuthUser } from '../stores/authStore';
import Logo from '../components/Logo';
import { toggleLang } from '../i18n';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const lang = i18n.language === 'en' ? 'en' : 'ar';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await api.post<{
        success: boolean;
        data: { token: string; user: AuthUser };
      }>('/auth/login', { username, password });
      login(response.data.user, response.data.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const features = lang === 'ar'
    ? [
        { icon: <CalendarMonthIcon />, text: 'إدارة المواعيد والحجوزات' },
        { icon: <ContentCutIcon />, text: 'نقطة البيع والفوترة' },
        { icon: <FaceRetouchingNaturalIcon />, text: 'إدارة العملاء والولاء' },
        { icon: <AssessmentIcon />, text: 'تقارير وتحليلات متقدمة' },
      ]
    : [
        { icon: <CalendarMonthIcon />, text: 'Appointments & bookings' },
        { icon: <ContentCutIcon />, text: 'Point of sale & invoicing' },
        { icon: <FaceRetouchingNaturalIcon />, text: 'Clients & loyalty' },
        { icon: <AssessmentIcon />, text: 'Reports & analytics' },
      ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Brand panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(150deg, #c2185b 0%, #6d0f3a 60%, #2e0521 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            insetInlineEnd: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(247,201,72,0.25) 0%, transparent 70%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -120,
            insetInlineStart: -60,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Logo size={120} />
          <Typography
            variant="h3"
            sx={{ mt: 2, fontWeight: 900, color: '#fff', letterSpacing: 1 }}
          >
            {t('general.appName')}
          </Typography>
          <Typography variant="h6" sx={{ mt: 1, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            {lang === 'ar' ? 'نظام إدارة الصالونات المتكامل' : 'All-in-one salon management'}
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 5, alignItems: 'flex-start', maxWidth: 360, mx: 'auto' }}>
            {features.map((f) => (
              <Stack
                key={f.text}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  px: 2,
                  py: 1,
                  width: '100%',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Box sx={{ color: '#f7c948' }}>{f.icon}</Box>
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>{f.text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          bgcolor: 'background.default',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 5 },
            width: '100%',
            maxWidth: 420,
            borderRadius: 4,
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute', top: 14, insetInlineEnd: 14 }}>
            <Button
              size="small"
              startIcon={<LanguageIcon />}
              onClick={() => void toggleLang()}
              sx={{ borderRadius: 20 }}
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: { md: 'none' }, justifyContent: 'center' }}>
              <Logo size={76} />
            </Box>
            <Typography
              variant="h4"
              sx={{ mt: 1, fontWeight: 900, background: 'linear-gradient(135deg, #c2185b 0%, #880e4f 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {t('general.appName')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('login.subtitle')}
            </Typography>
          </Box>
          <Typography variant="h5" align="center" gutterBottom>
            {t('login.title')}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              label={t('login.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              fullWidth
              autoFocus
            />
            <TextField
              label={t('login.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{ py: 1.2, fontSize: '1rem', borderRadius: 10 }}
            >
              {t('login.submit')}
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
            {lang === 'ar' ? '© 2026 ميرا — جميع الحقوق محفوظة' : '© 2026 Mira — All rights reserved'}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
