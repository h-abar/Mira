import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageIcon from '@mui/icons-material/Language';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FaceIcon from '@mui/icons-material/Face';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Logo from './Logo';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SettingsIcon from '@mui/icons-material/Settings';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import RedeemIcon from '@mui/icons-material/Redeem';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { toggleLang } from '../i18n';
import { useAuthStore } from '../stores/authStore';
import { useBranchStore } from '../stores/branchStore';
import { listBranches, type Branch } from '../api/branches';
import { getSettings } from '../api/settings';
import ShiftStatusBar from './ShiftStatusBar';

const drawerWidth = 260;

interface NavItem {
  path: string;
  key: string;
  icon: ReactNode;
  permission?: string;
}

interface NavGroup {
  labelAr: string;
  labelEn: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelAr: 'الرئيسية',
    labelEn: 'Main',
    items: [
      { path: '/admin', key: 'dashboard', icon: <DashboardIcon /> },
      { path: '/admin/pos', key: 'pos', icon: <PointOfSaleIcon />, permission: 'pos' },
      { path: '/admin/appointments', key: 'appointments', icon: <CalendarMonthIcon />, permission: 'appointments.read' },
      { path: '/admin/clients', key: 'clients', icon: <PeopleIcon />, permission: 'clients.read' },
    ],
  },
  {
    labelAr: 'الخدمات والموارد',
    labelEn: 'Services & resources',
    items: [
      { path: '/admin/services', key: 'services', icon: <ContentCutIcon />, permission: 'services.read' },
      { path: '/admin/employees', key: 'employees', icon: <FaceIcon />, permission: 'employees.read' },
      { path: '/admin/inventory', key: 'inventory', icon: <InventoryIcon />, permission: 'inventory.read' },
      { path: '/admin/attendance', key: 'attendance', icon: <AccessTimeIcon />, permission: 'attendance' },
    ],
  },
  {
    labelAr: 'المالية',
    labelEn: 'Finance',
    items: [
      { path: '/admin/accounting', key: 'accounting', icon: <AccountBalanceIcon />, permission: 'accounting.read' },
      { path: '/admin/reports', key: 'reports', icon: <AssessmentIcon />, permission: 'reports.read' },
    ],
  },
  {
    labelAr: 'العلاقات والعرض',
    labelEn: 'Loyalty & outreach',
    items: [
      { path: '/admin/offers', key: 'offers', icon: <CardGiftcardIcon />, permission: 'offers' },
      { path: '/admin/memberships', key: 'memberships', icon: <CardMembershipIcon />, permission: 'memberships' },
      { path: '/admin/giftcards', key: 'giftcards', icon: <RedeemIcon />, permission: 'giftcards' },
      { path: '/admin/campaigns', key: 'campaigns', icon: <CampaignIcon />, permission: 'campaigns' },
      { path: '/admin/notifications', key: 'notifications', icon: <NotificationsIcon />, permission: 'notifications' },
    ],
  },
  {
    labelAr: 'المشتريات والإدارة',
    labelEn: 'Purchasing & admin',
    items: [
      { path: '/admin/suppliers', key: 'suppliers', icon: <LocalShippingIcon />, permission: 'suppliers' },
      { path: '/admin/purchases', key: 'purchases', icon: <ShoppingCartIcon />, permission: 'purchases' },
      { path: '/admin/users', key: 'users', icon: <ManageAccountsIcon />, permission: 'users' },
      { path: '/admin/branches', key: 'branches', icon: <StorefrontIcon />, permission: 'branches' },
      { path: '/admin/settings', key: 'settings', icon: <SettingsIcon />, permission: 'settings' },
    ],
  },
];

function BranchSelector() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const [branches, setBranches] = useState<Branch[]>([]);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useBranchStore((s) => s.setSelectedBranchId);

  useEffect(() => {
    let active = true;
    listBranches({ limit: 100 })
      .then((res) => {
        if (active) setBranches(res.data.items.filter((b) => b.isActive));
      })
      .catch(() => {
        if (active) setBranches([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (branches.length === 0) return null;

  const allLabel = lang === 'ar' ? 'كل الفروع' : 'All branches';

  return (
    <FormControl size="small" sx={{ minWidth: 140, mr: 1, ml: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' } }}>
      <Select
        value={selectedBranchId ?? 'all'}
        onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? null : (e.target.value as number))}
        variant="outlined"
        sx={{
          color: 'inherit',
          fontSize: '0.85rem',
          borderRadius: '20px',
          '& .MuiSelect-icon': { color: 'inherit' },
        }}
      >
        <MenuItem value="all">{allLabel}</MenuItem>
        {branches.map((branch) => (
          <MenuItem key={branch.id} value={branch.id}>
            {lang === 'ar' ? branch.nameAr : branch.nameEn}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function AppLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const lang = i18n.language === 'en' ? 'en' : 'ar';

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.permission || hasPermission(item.permission)) }))
    .filter((g) => g.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Salon logo from Settings — shown in the drawer brand.
  const [logoUrl, setLogoUrl] = useState<string>("");
  useEffect(() => {
    getSettings()
      .then((res) => {
        const url = res.items.find((it) => it.key === "SALON_LOGO_URL")?.value?.trim();
        if (url) setLogoUrl(url);
      })
      .catch(() => undefined);
  }, []);

  const drawer = (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {logoUrl ? (
            <Box
              component="img"
              src={logoUrl}
              alt="logo"
              sx={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', bgcolor: '#fff' }}
            />
          ) : (
            <Logo size={30} />
          )}
          <Typography variant="h6" noWrap>
            {t('general.appName')}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <Box sx={{ pb: 2 }}>
        {visibleGroups.map((group) => (
          <Box key={group.labelAr} sx={{ mt: 1 }}>
            <Typography
              variant="overline"
              sx={{ px: 2.5, py: 0.5, display: 'block', fontSize: '0.65rem', lineHeight: 1.8 }}
              color="text.secondary"
            >
              {lang === 'ar' ? group.labelAr : group.labelEn}
            </Typography>
            <List dense disablePadding>
              {group.items.map((item) => {
                const selected =
                  location.pathname === item.path ||
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <ListItem key={item.key} disablePadding>
                    <ListItemButton
                      selected={selected}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={t(`menu.${item.key}`)} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Logo size={30} />
            <Typography variant="h6" noWrap>
              {t('general.appName')}
            </Typography>
          </Box>

          <ShiftStatusBar />

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.name?.charAt(0) ?? user.username?.charAt(0) ?? '?'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" component="div" sx={{ lineHeight: 1.2 }}>
                  {user.name || user.username}
                </Typography>
                <Chip
                  label={t(`general.roles.${user.role}`)}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ mt: 0.5, height: 20 }}
                />
              </Box>
            </Box>
          )}

          <Button
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 1, borderRadius: '20px', border: '1px solid rgba(255,255,255,0.4)', fontSize: '0.85rem' }}
          >
            {lang === 'ar' ? 'موقع العميلات' : 'Public Site'}
          </Button>

          <BranchSelector />

          <Tooltip title={t('menu.language')}>
            <Button color="inherit" startIcon={<LanguageIcon />} onClick={() => void toggleLang()}>
              {lang === 'ar' ? 'English' : 'العربية'}
            </Button>
          </Tooltip>

          <Tooltip title={t('menu.logout')}>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}