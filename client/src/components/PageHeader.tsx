import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  actionsNextToTitle?: boolean;
  gutterBottom?: boolean;
}

import { useLocation } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  actions,
  actionsNextToTitle = false,
  gutterBottom = true,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';

  const path = location.pathname.replace('/admin/', '').replace('/admin', '');
  const crumbMap: Record<string, { ar: string; en: string }> = {
    '': { ar: 'الرئيسية', en: 'Dashboard' },
    pos: { ar: 'نقطة البيع', en: 'Point of Sale' },
    clients: { ar: 'العملاء', en: 'Clients' },
    appointments: { ar: 'المواعيد', en: 'Appointments' },
    services: { ar: 'الخدمات', en: 'Services' },
    employees: { ar: 'الموظفون', en: 'Employees' },
    inventory: { ar: 'المخزون', en: 'Inventory' },
    accounting: { ar: 'الحسابات', en: 'Accounting' },
    reports: { ar: 'التقارير', en: 'Reports' },
    offers: { ar: 'العروض', en: 'Offers' },
    memberships: { ar: 'العضويات', en: 'Memberships' },
    giftcards: { ar: 'بطاقات الهدايا', en: 'Gift Cards' },
    campaigns: { ar: 'الحملات', en: 'Campaigns' },
    notifications: { ar: 'الإشعارات', en: 'Notifications' },
    suppliers: { ar: 'الموردون', en: 'Suppliers' },
    purchases: { ar: 'المشتريات', en: 'Purchases' },
    attendance: { ar: 'الحضور', en: 'Attendance' },
    users: { ar: 'المستخدمون', en: 'Users' },
    branches: { ar: 'الفروع', en: 'Branches' },
    settings: { ar: 'الإعدادات', en: 'Settings' },
  };
  const crumbLabel = crumbMap[path] ? (lang === 'ar' ? crumbMap[path].ar : crumbMap[path].en) : (typeof title === 'string' ? title : '');

  return (
    <Box sx={{ mb: gutterBottom ? 3 : 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 0.5, letterSpacing: 1 }}
          >
            {crumbLabel || t('general.appName')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #c2185b 0%, #880e4f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('general.appName')}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" rowGap={1}>
            <Typography variant="h4">{title}</Typography>
            {actions && actionsNextToTitle && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>{actions}</Box>
            )}
          </Stack>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && !actionsNextToTitle && <Box>{actions}</Box>}
      </Stack>
    </Box>
  );
}