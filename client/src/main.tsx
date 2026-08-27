import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { I18nextProvider } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

import i18n, { getSavedLang, type Lang } from './i18n';
import { createAppTheme } from './theme';
import App from './App';

const initialLang: Lang = getSavedLang();

dayjs.locale(initialLang);

const cacheRtl = createCache({ key: 'muirtl', stylisPlugins: [rtlPlugin] });
const cacheLtr = createCache({ key: 'muiltr' });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemedApp() {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const handler = (lng: string) => setLangState(lng === 'ar' ? 'ar' : 'en');
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, []);

  const theme = useMemo(() => createAppTheme(lang), [lang]);
  const cache = lang === 'ar' ? cacheRtl : cacheLtr;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
              <CssBaseline />
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </LocalizationProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>,
);
