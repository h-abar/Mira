import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LanguageIcon from '@mui/icons-material/Language';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState<null | HTMLElement>(null);

  const toggleLanguage = () => {
    const nextLang = isAr ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('lang', nextLang);
    document.documentElement.setAttribute('lang', nextLang);
    document.documentElement.setAttribute('dir', nextLang === 'ar' ? 'rtl' : 'ltr');
  };

  const navItems = [
    { label: isAr ? 'الرئيسية' : 'Home', path: '/' },
    { label: isAr ? 'خدماتنا' : 'Services', path: '/#services' },
    { label: isAr ? 'خبراء التجميل' : 'Stylists', path: '/#stylists' },
    { label: isAr ? 'ساعات العمل' : 'Hours', path: '/#hours' },
  ];

  const handleNavClick = (path: string) => {
    setMobileMenuAnchor(null);
    if (path.startsWith('/#')) {
      const elementId = path.replace('/#', '');
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(194, 24, 91, 0.08)',
        color: '#2d3748',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo & Brand */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c2185b 0%, #e91e63 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(194, 24, 91, 0.3)',
              }}
            >
              <ContentCutIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  background: 'linear-gradient(45deg, #880e4f 30%, #c2185b 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                }}
              >
                MIRA BEAUTY
              </Typography>

            </Box>
          </Box>

          {/* Desktop Nav Items */}
          <Stack
            direction="row"
            spacing={3}
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
          >
            {navItems.map((item) => (
              <Button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                sx={{
                  color: '#4a5568',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  '&:hover': { color: '#c2185b', backgroundColor: 'transparent' },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          {/* Actions & CTA */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              size="small"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/booking-status')}
              sx={{
                color: '#64748b',
                display: { xs: 'none', sm: 'inline-flex' },
                fontWeight: 600,
              }}
            >
              {isAr ? 'استعلام عن حجز' : 'Check Booking'}
            </Button>

            <IconButton onClick={toggleLanguage} size="small" title={isAr ? 'Switch to English' : 'التحويل للعربية'}>
              <LanguageIcon fontSize="small" sx={{ color: '#c2185b' }} />
              <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 700, color: '#c2185b' }}>
                {isAr ? 'EN' : 'عربي'}
              </Typography>
            </IconButton>

            <Button
              variant="contained"
              size="medium"
              startIcon={<CalendarMonthIcon />}
              onClick={() => navigate('/booking')}
              sx={{
                borderRadius: '24px',
                px: 3,
                py: 0.9,
                fontWeight: 700,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #c2185b 0%, #d81b60 100%)',
                boxShadow: '0 6px 18px rgba(194, 24, 91, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ad1457 0%, #c2185b 100%)',
                  boxShadow: '0 8px 24px rgba(194, 24, 91, 0.45)',
                },
              }}
            >
              {isAr ? 'احجزي موعدكِ' : 'Book Now'}
            </Button>

            <IconButton
              onClick={() => navigate('/login')}
              size="small"
              title={isAr ? 'دخول الموظفات' : 'Staff Login'}
              sx={{ border: '1px solid #e2e8f0', borderRadius: '50%', p: 1 }}
            >
              <LockIcon fontSize="small" sx={{ color: '#64748b' }} />
            </IconButton>

            {/* Mobile menu button */}
            <IconButton
              onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </Container>

      {/* Mobile Dropdown Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={() => setMobileMenuAnchor(null)}
        PaperProps={{
          sx: { width: 220, borderRadius: 3, mt: 1 },
        }}
      >
        {navItems.map((item) => (
          <MenuItem key={item.label} onClick={() => handleNavClick(item.path)}>
            <Typography sx={{ fontWeight: 600 }}>{item.label}</Typography>
          </MenuItem>
        ))}
        <MenuItem onClick={() => { setMobileMenuAnchor(null); navigate('/booking-status'); }}>
          <Typography sx={{ fontWeight: 600, color: '#c2185b' }}>
            {isAr ? 'استعلام عن حجز' : 'Check Booking'}
          </Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
