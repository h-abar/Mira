import { createTheme, type Theme } from '@mui/material/styles';

const brandPrimary = {
  main: '#c2185b',
  light: '#e91e63',
  dark: '#880e4f',
  contrastText: '#ffffff',
};

const brandSecondary = {
  main: '#9c27b0',
  light: '#ba68c8',
  dark: '#7b1fa2',
  contrastText: '#ffffff',
};

const brandGold = '#d4a017';

export const createAppTheme = (lang: string): Theme => {
  const isAr = lang === 'ar';

  return createTheme({
    direction: isAr ? 'rtl' : 'ltr',
    palette: {
      mode: 'light',
      primary: brandPrimary,
      secondary: brandSecondary,
      background: {
        default: '#faf6f8',
        paper: '#ffffff',
      },
      success: { main: '#2e7d32', light: '#4caf50' },
      info: { main: '#0288d1' },
      warning: { main: '#ed6c02' },
      error: { main: '#c62828' },
    },
    typography: {
      fontFamily: isAr
        ? "'Cairo', 'Segoe UI', sans-serif"
        : "'Inter', 'Segoe UI', sans-serif",
      h3: { fontWeight: 800 },
      h4: { fontWeight: 800 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
      overline: { letterSpacing: isAr ? 0 : 1 },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0 1px 2px rgba(194,24,91,0.06)',
      '0 2px 6px rgba(194,24,91,0.07)',
      '0 4px 10px rgba(194,24,91,0.08)',
      '0 6px 14px rgba(194,24,91,0.09)',
      '0 8px 18px rgba(194,24,91,0.1)',
      '0 10px 22px rgba(194,24,91,0.11)',
      '0 12px 26px rgba(194,24,91,0.12)',
      '0 14px 30px rgba(194,24,91,0.13)',
      '0 16px 34px rgba(194,24,91,0.14)',
      '0 18px 38px rgba(194,24,91,0.15)',
      '0 20px 42px rgba(194,24,91,0.16)',
      '0 22px 46px rgba(194,24,91,0.17)',
      '0 24px 50px rgba(194,24,91,0.18)',
      '0 26px 54px rgba(194,24,91,0.19)',
      '0 28px 58px rgba(194,24,91,0.2)',
      '0 30px 62px rgba(194,24,91,0.21)',
      '0 32px 66px rgba(194,24,91,0.22)',
      '0 34px 70px rgba(194,24,91,0.23)',
      '0 36px 74px rgba(194,24,91,0.24)',
      '0 38px 78px rgba(194,24,91,0.25)',
      '0 40px 82px rgba(194,24,91,0.26)',
      '0 42px 86px rgba(194,24,91,0.27)',
      '0 44px 90px rgba(194,24,91,0.28)',
      '0 46px 94px rgba(194,24,91,0.29)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: isAr
              ? "'Cairo', 'Segoe UI', sans-serif"
              : "'Inter', 'Segoe UI', sans-serif",
            ...(isAr ? { fontFeatureSettings: '"kern" 1' } : {}),
          },
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(194,24,91,0.3) transparent',
          },
          '::-webkit-scrollbar': { width: 8, height: 8 },
          '::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            background: 'rgba(194,24,91,0.25)',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(194,24,91,0.45)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'linear-gradient(135deg, #c2185b 0%, #880e4f 100%)',
            boxShadow: '0 2px 12px rgba(136,14,79,0.35)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderInlineEnd: '1px solid #f3e1e8',
            backgroundColor: '#fff',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            transition: 'box-shadow .2s ease, transform .2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: { borderColor: '#f3e1e8' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10 },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 6px 14px rgba(194,24,91,0.25)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            '&.Mui-selected': {
              backgroundImage: 'linear-gradient(135deg, rgba(194,24,91,0.12) 0%, rgba(136,14,79,0.08) 100%)',
              fontWeight: 600,
            },
            '&.Mui-selected .MuiListItemIcon-root': { color: 'primary.main' },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: { fontWeight: 700 },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: '0.78rem' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
    },
  });
};

export default createAppTheme;

export const brandAccentGold = brandGold;
