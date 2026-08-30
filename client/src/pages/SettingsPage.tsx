import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import BackupIcon from '@mui/icons-material/Backup';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LinkIcon from '@mui/icons-material/Link';
import LockIcon from '@mui/icons-material/Lock';
import InputAdornment from '@mui/material/InputAdornment';
import { useSettings, useUpdateSettings } from '../api/settingsHooks';
import {
  downloadJsonBackup,
  downloadSqlBackup,
  downloadCsvBackup,
  getBackupSchedule,
  triggerBackupNow,
  type BackupScheduleStatus,
} from '../api/backup';
import { getZatcaStatus, zatcaSetup, zatcaTest, type ZatcaStatus } from '../api/zatca';
import { sendWhatsAppTest } from '../api/notifications';
import { api } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

const LOYALTY_KEYS = ['LOYALTY_POINTS_PER_CURRENCY', 'LOYALTY_POINT_VALUE'] as const;
const PAYMENT_KEYS = ['PAYMENT_GATEWAY', 'PAYMENT_METHOD', 'PAYMENT_API_KEY', 'PAYMENT_PUBLIC_KEY', 'PAYMENT_MERCHANT_ID', 'PAYMENT_WEBHOOK_URL', 'PAYMENT_CURRENCY'] as const;
const WHATSAPP_SAVE_KEYS = ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'WHATSAPP_ENABLED', 'WHATSAPP_BUSINESS_ACCOUNT_ID', 'WHATSAPP_WEBHOOK_SECRET', 'WHATSAPP_PUBLIC_PHONE'] as const;
const SOCIAL_KEYS = ['SOCIAL_INSTAGRAM', 'SOCIAL_FACEBOOK', 'SOCIAL_WHATSAPP', 'SOCIAL_SNAPCHAT', 'SOCIAL_TIKTOK'] as const;

const ZATCA_KEYS = [
  'ZATCA_VAT_NUMBER',
  'ZATCA_INVOICE_TYPE',
  'ZATCA_PHASE',
  'ZATCA_SELLER_NAME_AR',
  'ZATCA_SELLER_NAME_EN',
  'ZATCA_ADDRESS_STREET',
  'ZATCA_ADDRESS_CITY',
  'ZATCA_ADDRESS_DISTRICT',
  'ZATCA_ADDRESS_POSTAL',
  'QR_DISPLAY_MODE',
] as const;

const ZATCA_SELECT_OPTIONS: Record<string, { value: string; ar: string; en: string }[]> = {
  ZATCA_INVOICE_TYPE: [
    { value: 'simplified', ar: 'مبسطة (B2C) — تناسب الصالونات', en: 'Simplified (B2C) — fits salons' },
    { value: 'standard', ar: 'ضريبية (B2B)', en: 'Standard tax (B2B)' },
  ],
  ZATCA_PHASE: [
    { value: 'phase1', ar: 'المرحلة الأولى — الإصدار والفوترة', en: 'Phase 1 — Generation' },
    { value: 'phase2', ar: 'المرحلة الثانية — التكامل مع منظومة فاتورة', en: 'Phase 2 — Integration (Fatoora)' },
  ],
};

const DAY_ORDER = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
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

interface DayHoursRow {
  day: string;
  opening: string;
  closing: string;
  isOpen: boolean;
}

const L = {
  ar: {
    title: 'الإعدادات', general: 'عام', workingHours: 'ساعات العمل', loyalty: 'الولاء',
    zatca: 'ZATCA', payments: 'المدفوعات', whatsapp: 'واتساب', backup: 'النسخ الاحتياطي',
    save: 'حفظ', saving: 'جارٍ الحفظ...', saved: 'تم حفظ الإعدادات بنجاح',
    saveFailed: 'فشل حفظ الإعدادات', loadFailed: 'تعذر تحميل الإعدادات',
    settingsNote: 'تُستخدم هذه الإعدادات في الفوترة ونقاط الولاء وعرض اسم الصالون.',
    socialTitle: 'حسابات وسائل التواصل الاجتماعي',
    socialNote: 'تُعرض هذه الروابط في صفحة الواجهة وبطاقة العميلة والفواتير المطبوعة.',
    saveSocialBtn: 'حفظ وسائل التواصل',
    hoursNote: 'حدد أيام وساعات العمل للصالون. الأيام المفعلة كـ (يوم عمل) تتاح لحجز المواعيد، والأيام غير المفعلة تعتبر إجازة أسبوعية مغلقة.',
    hoursOpen: 'وقت الفتح', hoursClose: 'وقت الإغلاق', hoursWorkDay: 'يوم عمل مفعّل', hoursDayOff: 'إجازة أسبوعية',
    hoursCopy: 'نسخ ساعات هذا اليوم لجميع الأيام المفتوحة',
    saveHoursBtn: 'حفظ ساعات وأيام العمل',
    saveIdentityBtn: 'حفظ هوية الصالون',
    saveInvoicingBtn: 'حفظ إعدادات الفوترة',
    backupNote: 'نزّل نسخة احتياطية من جميع البيانات. يوصى بالتنزيل بشكل دوري للحفاظ على بياناتك آمنة.',
    lastExport: 'آخر تصدير:', neverExported: 'لم يتم التصدير بعد',
    exported: 'تم تنزيل النسخة الاحتياطية بنجاح', exportFailed: 'فشل تنزيل النسخة الاحتياطية',
    adminOnly: 'هذه الإجراءات متاحة للمدير فقط',
    categoriesTitle: 'إدارة الفئات',
    servicesCat: 'فئات الخدمات', inventoryCat: 'فئات المخزون',
    renameHint: 'اضغط على أي فئة لتعديل اسمها — يُطبق على السجلات فورًا',
    updateBtn: 'تحديث',
    noCategories: 'لا توجد فئات بعد — أضف أول فئة أدناه',
    category: 'اسم الفئة', addCategory: 'إضافة فئة',
    vatRateHelper: 'تُطبق على قيمة الفاتورة كنسبة مئوية',
    welcomeHelper: 'تظهر أسفل الفاتورة المطبوعة — شكر أو رسالة للعميلة',
    policyHelper: 'مثال: يرجى الحجز قبل 24 ساعة — الإلغاء مجاني حتى 6 ساعات قبل الموعد',
    vatNumberHelper: 'الرقم الضريبي السعودي: 15 رقمًا ويبدأ وينتهي بالرقم 3',
    logoHelper: 'الصق رابط صورة الشعار (PNG/JPG) — يظهر أعلى الفاتورة المطبوعة. الأفضل عرض ~200px وخلفية بيضاء.',
    backupTitle: 'النسخ الاحتياطي والجدولة', backupSchedule: 'النسخ الاحتياطي المجدول',
    backupEnabled: 'مفعّل', backupDisabled: 'معطّل', backupCron: 'جدول التشغيل (Cron)',
    backupRetentionDays: 'الاحتفاظ بالنسخ (أيام)', backupDir: 'مجلد الحفظ',
    backupLastRun: 'آخر نسخ', backupNeverRun: 'لم يتم بعد',
    backupStatusSuccess: 'نجح', backupStatusFailed: 'فشل', backupExport: 'تصدير النسخ الاحتياطي',
    backupTrigger: 'تشغيل الآن', backupTriggered: 'تم تشغيل النسخ الاحتياطي بنجاح',
    backupJson: 'تصدير JSON', backupSql: 'تصدير SQL', backupCsv: 'تصدير CSV',
    backupLoading: 'جارٍ التحميل...',
    zatcaTitle: 'الفوترة الإلكترونية ZATCA', zatcaConfigured: 'حالة التهيئة',
    zatcaYes: 'مهيأة', zatcaNo: 'غير مهيأة', zatcaEnv: 'البيئة',
    zatcaVatNumber: 'الرقم الضريبي', zatcaSellerName: 'اسم البائع',
    zatcaCertValid: 'حالة الشهادة', zatcaCertActive: 'سارية', zatcaCertExpired: 'منتهية',
    zatcaCertExpiry: 'تاريخ الانتهاء', zatcaGenerateCert: 'توليد شهادة الامتثال',
    zatcaGenerating: 'جارٍ التوليد...', zatcaTest: 'اختبار', zatcaTesting: 'جارٍ الاختبار...',
    zatcaSetupSuccess: 'تم توليد شهادة الامتثال بنجاح',
    zatcaTestSuccess: 'نجح الاختبار: تم توليد رمز QR والتوقيع',
    qrModeTitle: 'نوع عرض رمز QR', qrModeSquare: 'QR مربع (صورة)', qrModeText: 'نص قديم (Base64)',
    paymentsTitle: 'المدفوعات الإلكترونية',
    paymentsNote: 'تُستخدم إعدادات الدفع عند إتمام العمليات. احتفظ بمفاتيحك سرية.',
    paymentMethod: 'طريقة الدفع', paymentApiKey: 'مفتاح API', paymentPublicKey: 'المفتاح العام',
    whatsappTitle: 'واتساب', whatsappToken: 'رمز الوصول (Token)',
    whatsappPhoneId: 'معرّف الهاتف (Phone ID)', whatsappEnabled: 'تفعيل واتساب',
    whatsappTest: 'اختبار', whatsappTestPhone: 'رقم الهاتف للاختبار',
    whatsappTestRunning: 'جارٍ الإرسال...', whatsappTestSimulated: 'تم الإرسال بنجاح (وضع المحاكاة)',
    whatsappTestReal: 'تم إرسال رسالة الاختبار بنجاح', whatsappTestFailed: 'فشل إرسال رسالة الاختبار',
  },
  en: {
    title: 'Settings', general: 'General', workingHours: 'Working Hours', loyalty: 'Loyalty',
    zatca: 'ZATCA', payments: 'Payments', whatsapp: 'WhatsApp', backup: 'Backup',
    save: 'Save', saving: 'Saving...', saved: 'Settings saved successfully',
    saveFailed: 'Failed to save settings', loadFailed: 'Failed to load settings',
    settingsNote: 'These settings are used for invoicing, loyalty points and the salon name.',
    socialTitle: 'Social Media Accounts',
    socialNote: 'These links appear on the client portal, receipts, and printed invoices.',
    saveSocialBtn: 'Save Social Media',
    hoursNote: 'Set salon working hours and active workdays. Active days allow bookings; inactive days are marked as weekly days off.',
    hoursOpen: 'Opening', hoursClose: 'Closing', hoursWorkDay: 'Work Day (Active)', hoursDayOff: 'Day Off',
    hoursCopy: 'Copy hours to all open days',
    saveHoursBtn: 'Save Working Hours',
    saveIdentityBtn: 'Save Salon Identity',
    saveInvoicingBtn: 'Save Invoicing Settings',
    backupNote: 'Download a backup of all data. We recommend downloading regularly to keep your data safe.',
    lastExport: 'Last export:', neverExported: 'No export yet',
    exported: 'Backup downloaded successfully', exportFailed: 'Failed to download backup',
    adminOnly: 'These actions are available to the admin only',
    categoriesTitle: 'Categories Management',
    servicesCat: 'Service Categories', inventoryCat: 'Inventory Categories',
    renameHint: 'Click a category to rename — applied to records instantly',
    updateBtn: 'Update',
    noCategories: 'No categories yet — add your first category below',
    category: 'Category name', addCategory: 'Add Category',
    vatRateHelper: 'Applied to the invoice total as a percentage',
    welcomeHelper: "Shown at the bottom of printed invoices — a thank-you note for the client",
    policyHelper: 'e.g. Please book 24h in advance — free cancellation up to 6h before appointment',
    vatNumberHelper: 'KSA VAT number: 15 digits, starting and ending with 3',
    logoHelper: 'Paste the logo image URL (PNG/JPG) — shown at the top of printed invoices. ~200px wide with a white background works best.',
    backupTitle: 'Backup & Schedule', backupSchedule: 'Scheduled Backup',
    backupEnabled: 'Enabled', backupDisabled: 'Disabled', backupCron: 'Schedule (Cron)',
    backupRetentionDays: 'Retention (days)', backupDir: 'Backup Directory',
    backupLastRun: 'Last Run', backupNeverRun: 'Never',
    backupStatusSuccess: 'Success', backupStatusFailed: 'Failed', backupExport: 'Export Backup',
    backupTrigger: 'Run Now', backupTriggered: 'Backup started successfully',
    backupJson: 'Export JSON', backupSql: 'Export SQL', backupCsv: 'Export CSV',
    backupLoading: 'Loading...',
    zatcaTitle: 'ZATCA E-Invoicing', zatcaConfigured: 'Setup Status',
    zatcaYes: 'Configured', zatcaNo: 'Not configured', zatcaEnv: 'Environment',
    zatcaVatNumber: 'VAT Number', zatcaSellerName: 'Seller Name',
    zatcaCertValid: 'Certificate Status', zatcaCertActive: 'Active', zatcaCertExpired: 'Expired',
    zatcaCertExpiry: 'Expiry Date', zatcaGenerateCert: 'Generate Compliance Certificate',
    zatcaGenerating: 'Generating...', zatcaTest: 'Test', zatcaTesting: 'Testing...',
    zatcaSetupSuccess: 'Compliance certificate generated successfully',
    zatcaTestSuccess: 'Test passed: QR and signature generated',
    qrModeTitle: 'QR Display Mode', qrModeSquare: 'Square QR (image)', qrModeText: 'Legacy text (Base64)',
    paymentsTitle: 'Electronic Payments',
    paymentsNote: 'Configure your Saudi payment gateway. Keep your secret keys confidential.',
    paymentGateway: 'Payment Gateway', paymentMethod: 'Default Payment Method', paymentApiKey: 'Secret API Key', paymentPublicKey: 'Publishable Key',
    paymentMerchantId: 'Merchant ID', paymentWebhook: 'Webhook URL', paymentCurrency: 'Currency',
    paymentApiNote: 'Find these keys in your payment gateway dashboard.',
    whatsappTitle: 'WhatsApp Business', whatsappToken: 'Access Token',
    whatsappPhoneId: 'Phone Number ID', whatsappEnabled: 'Enable WhatsApp',
    whatsappBizAccount: 'Business Account ID', whatsappWebhookSecret: 'Webhook Secret', whatsappPublicPhone: 'Public WhatsApp Number',
    whatsappTest: 'Test', whatsappTestPhone: 'Test phone number',
    whatsappTestRunning: 'Sending...', whatsappTestSimulated: 'Sent successfully (simulated)',
    whatsappTestReal: 'Test message sent successfully', whatsappTestFailed: 'Failed to send test message',
  },
};

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const l = L[lang];
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const settingsQuery = useSettings();
  const updateMutation = useUpdateSettings();

  const [tab, setTab] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [backupSchedule, setBackupSchedule] = useState<BackupScheduleStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [zatcaStatus, setZatcaStatus] = useState<ZatcaStatus | null>(null);
  const [zatcaLoading, setZatcaLoading] = useState(true);
  const [zatcaBusy, setZatcaBusy] = useState<'setup' | 'test' | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappTesting, setWhatsappTesting] = useState(false);
  // Independent input per card so editing one category never leaks into the other.
  const [catInputs, setCatInputs] = useState<Record<CatType2, string>>({
    services: '',
    inventory: '',
  });
  const setCatInput = (t: CatType2, v: string) =>
    setCatInputs((prev) => ({ ...prev, [t]: v }));
  const [catSaving, setCatSaving] = useState(false);
  const [editCat, setEditCat] = useState<{ t: CatType2; from: string } | null>(null);

  type CatType2 = 'services' | 'inventory';
  const [usedCats, setUsedCats] = useState<Record<CatType2, string[]>>({
    services: [],
    inventory: [],
  });

  useEffect(() => {
    void api
      .get<{ success: boolean; data: string[] }>('/services/categories')
      .then((r) => setUsedCats((prev) => ({ ...prev, services: r.data })))
      .catch(() => undefined);
    void api
      .get<{ success: boolean; data: string[] }>('/inventory/products/categories')
      .then((r) => setUsedCats((prev) => ({ ...prev, inventory: r.data })))
      .catch(() => undefined);
  }, []);

  // ---- Working hours state ----
  const [weekly, setWeekly] = useState<DayHoursRow[]>(
    DAY_ORDER.map((day) => ({ day, opening: '10:00', closing: '21:00', isOpen: true })),
  );

  // Sync values and working hours from settings ONCE when first loaded.
  // Seeding on every refetch would discard unsaved edits in other sections
  // (e.g. saving one tab would revert working-hours toggles back to the stored state).
  const settingsSyncedRef = useRef(false);
  useEffect(() => {
    if (settingsQuery.data && !settingsSyncedRef.current) {
      const byKey = settingsQuery.data.byKey;
      setValues({ ...byKey });
      const closedDays = (byKey.CLOSED_DAYS ?? '')
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      setWeekly(
        DAY_ORDER.map((day) => ({
          day,
          opening: byKey[`${day.toUpperCase()}_OPENING`] ?? '10:00',
          closing: byKey[`${day.toUpperCase()}_CLOSING`] ?? '21:00',
          isOpen: !closedDays.includes(day.toLowerCase()),
        })),
      );
      settingsSyncedRef.current = true;
    }
  }, [settingsQuery.data]);

  useEffect(() => {
    getBackupSchedule()
      .then(setBackupSchedule)
      .catch(() => undefined);
    getZatcaStatus()
      .then(setZatcaStatus)
      .catch(() => undefined)
      .finally(() => setZatcaLoading(false));
  }, []);

  const labelOf = (key: string) => {
    const item = settingsQuery.data?.items.find((it) => it.key === key);
    if (!item) return key;
    return lang === 'ar' ? item.labelAr ?? key : item.labelEn ?? key;
  };

  const isNumberKey = (key: string) => key === 'VAT_RATE';
  const MULTILINE_KEYS = new Set(['WELCOME_MESSAGE', 'SALON_POLICY']);

  const renderSettingField = (key: string) => {
    if (ZATCA_SELECT_OPTIONS[key]) {
      const options = ZATCA_SELECT_OPTIONS[key];
      return (
        <TextField
          key={key}
          select
          label={labelOf(key)}
          value={values[key] ?? options[0].value}
          onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
          disabled={!isAdmin}
          fullWidth
        >
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {lang === 'ar' ? o.ar : o.en}
            </MenuItem>
          ))}
        </TextField>
      );
    }
    return (
      <TextField
        key={key}
        label={labelOf(key)}
        value={values[key] ?? ''}
        onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
        type={isNumberKey(key) ? 'number' : 'text'}
        multiline={MULTILINE_KEYS.has(key)}
        rows={MULTILINE_KEYS.has(key) ? 3 : undefined}
        disabled={!isAdmin}
        fullWidth
        helperText={
          key === 'VAT_RATE'
            ? l.vatRateHelper
            : key === 'WELCOME_MESSAGE'
              ? l.welcomeHelper
                : key === 'SALON_POLICY'
                  ? l.policyHelper
                  : key === 'ZATCA_VAT_NUMBER'
                    ? l.vatNumberHelper
                    : key === 'SALON_LOGO_URL'
                      ? l.logoHelper
                      : undefined
        }
      />
    );
  };

  const renderSettingFields = (keys: readonly string[]) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 520 }}>
      {keys.map((key) => renderSettingField(key))}
    </Box>
  );

  const saveKeys = async (keys: readonly string[], section: string) => {
    const payload: Record<string, string> = {};
    for (const key of keys) payload[key] = values[key] ?? '';
    setSavingSection(section);
    setError(null);
    try {
      await updateMutation.mutateAsync(payload);
      setSnack(l.saved);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.saveFailed);
    } finally {
      setSavingSection(null);
    }
  };

  const updateDay = (day: string, patch: Partial<DayHoursRow>) =>
    setWeekly((prev) => prev.map((r) => (r.day === day ? { ...r, ...patch } : r)));

  const copyHoursToAll = (source: DayHoursRow) =>
    setWeekly((prev) =>
      prev.map((r) =>
        r.day === source.day
          ? r
          : { ...r, opening: source.opening, closing: source.closing },
      ),
    );

  const saveHours = async () => {
    const closedList = weekly.filter((r) => !r.isOpen).map((r) => r.day);
    const payload: Record<string, string> = {
      CLOSED_DAYS: closedList.join(','),
    };
    for (const r of weekly) {
      payload[`${r.day.toUpperCase()}_OPENING`] = r.opening;
      payload[`${r.day.toUpperCase()}_CLOSING`] = r.closing;
    }
    setSavingSection('hours');
    setError(null);
    try {
      await updateMutation.mutateAsync(payload);
      setSnack(l.saved);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.saveFailed);
    } finally {
      setSavingSection(null);
    }
  };

  // ---- Backup ----
  const handleExport = async (kind: string) => {
    setExporting(kind);
    setError(null);
    try {
      if (kind === 'json') await downloadJsonBackup();
      else if (kind === 'sql') await downloadSqlBackup();
      else await downloadCsvBackup();
      setLastExport(new Date().toLocaleString());
      setSnack(l.exported);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.exportFailed);
    } finally {
      setExporting(null);
    }
  };

  const handleTriggerBackup = async () => {
    setTriggering(true);
    setError(null);
    try {
      await triggerBackupNow();
      setBackupSchedule(await getBackupSchedule());
      setSnack(l.backupTriggered);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.saveFailed);
    } finally {
      setTriggering(false);
    }
  };

  // ---- ZATCA ----
  const handleZatcaSetup = async () => {
    setZatcaBusy('setup');
    setError(null);
    try {
      await zatcaSetup();
      setZatcaStatus(await getZatcaStatus());
      setSnack(l.zatcaSetupSuccess);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.saveFailed);
    } finally {
      setZatcaBusy(null);
    }
  };

  const handleZatcaTest = async () => {
    setZatcaBusy('test');
    setError(null);
    try {
      await zatcaTest();
      setSnack(l.zatcaTestSuccess);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.saveFailed);
    } finally {
      setZatcaBusy(null);
    }
  };

  // ---- WhatsApp ----
  const handleWhatsappToggle = (checked: boolean) =>
    setValues((prev) => ({ ...prev, WHATSAPP_ENABLED: String(checked) }));

  const handleSaveWhatsapp = async () => void saveKeys(WHATSAPP_SAVE_KEYS, 'whatsapp');

  const handleWhatsappTest = async () => {
    setWhatsappTesting(true);
    setError(null);
    try {
      const result = await sendWhatsAppTest(whatsappPhone);
      setSnack(result.simulated ? l.whatsappTestSimulated : l.whatsappTestReal);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.whatsappTestFailed);
    } finally {
      setWhatsappTesting(false);
    }
  };

  // ---- Categories ----
  const CAT_KEY: Record<CatType2, string> = {
    services: 'SERVICES_CATEGORIES',
    inventory: 'INVENTORY_CATEGORIES',
  };
  const catList = (t: CatType2): string[] =>
    Array.from(
      new Set([
        ...(values[CAT_KEY[t]] ?? '')
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        ...(usedCats[t] ?? []),
      ]),
    );
  const writeCats = (t: CatType2, list: string[]) => {
    const clean = Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)));
    setUsedCats((prev) => ({ ...prev, [t]: clean }));
    setValues((prev) => ({ ...prev, [CAT_KEY[t]]: clean.join(',') }));
  };
  const addCat = (t: CatType2) => {
    const v = catInputs[t].replace(/\s*>\s*/g, ' > ').trim();
    if (!v || catList(t).includes(v)) return;
    writeCats(t, [...catList(t), v]);
    setCatInput(t, '');
  };
  const removeCat = (t: CatType2, cat: string) => {
    writeCats(
      t,
      catList(t).filter((x) => x !== cat && !x.startsWith(`${cat} > `)),
    );
  };
  const applyRenameCat = async (t: CatType2, from: string, to: string) => {
    if (!to || to === from) return;
    setCatSaving(true);
    setError(null);
    try {
      await api.post(
        t === 'services' ? '/services/categories/rename' : '/inventory/products/categories/rename',
        { from, to },
      );
      writeCats(
        t,
        catList(t).map((x) =>
          x === from ? to : x.startsWith(`${from} > `) ? `${to}${x.slice(from.length)}` : x,
        ),
      );
      setEditCat(null);
      setSnack(l.saved);
    } catch (err) {
      setError((err as { message?: string }).message ?? l.saveFailed);
    } finally {
      setCatSaving(false);
    }
  };

  const renderCatManager = (t: CatType2) => (
    <Box
      sx={{
        border: 2,
        borderColor: t === 'services' ? 'primary.main' : 'secondary.main',
        borderRadius: 2,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        flexGrow: 1,
        bgcolor: 'background.paper',
        boxShadow: 1,
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight={800}
        color={t === 'services' ? 'primary.main' : 'secondary.main'}
      >
        {t === 'services' ? l.servicesCat : l.inventoryCat}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, minHeight: 40 }}>
        {catList(t).map((cat) =>
          editCat && editCat.t === t && editCat.from === cat ? (
            <Stack key={cat} direction="row" spacing={0.5} alignItems="center">
              <TextField
                size="small"
                value={catInputs[t]}
                onChange={(e) => setCatInput(t, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void applyRenameCat(t, cat, catInputs[t].trim());
                  if (e.key === 'Escape') setEditCat(null);
                }}
                autoFocus
                inputProps={{ dir: 'ltr' }}
                sx={{ width: 160 }}
              />
              <Button
                size="small"
                variant="contained"
                disabled={catSaving}
                onClick={() => void applyRenameCat(t, cat, catInputs[t].trim())}
              >
                {l.updateBtn}
              </Button>
              <IconButton size="small" onClick={() => setEditCat(null)}>
                <CloseIcon />
              </IconButton>
            </Stack>
          ) : (
            <Chip
              key={cat}
              size="small"
              color="primary"
              variant="outlined"
              label={
                <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  {cat}
                </span>
              }
              onClick={
                isAdmin
                  ? () => {
                      setEditCat({ t, from: cat });
                      setCatInput(t, cat);
                    }
                  : undefined
              }
              onDelete={isAdmin ? () => removeCat(t, cat) : undefined}
              deleteIcon={<CloseIcon />}
            />
          ),
        )}
        {catList(t).length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {l.noCategories}
          </Typography>
        )}
      </Box>
      {isAdmin && (
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            label={l.category}
            value={catInputs[t]}
            onChange={(e) => setCatInput(t, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addCat(t);
            }}
            inputProps={{ dir: 'ltr' }}
            fullWidth
          />
          <Tooltip title={l.addCategory}>
            <span>
              <Button
                size="small"
                variant="contained"
                disabled={!catInputs[t].trim()}
                onClick={() => addCat(t)}
                sx={{ minWidth: 0, px: 1.25, flexShrink: 0 }}
              >
                <AddIcon fontSize="small" />
              </Button>
            </span>
          </Tooltip>
        </Stack>
      )}
      {isAdmin && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            startIcon={savingSection === `cat-${t}` ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={() => void saveKeys([CAT_KEY[t]], `cat-${t}`)}
            disabled={savingSection !== null}
          >
            {savingSection === `cat-${t}` ? l.saving : l.save}
          </Button>
          <Typography variant="caption" color="text.secondary">
            {l.renameHint}
          </Typography>
        </Stack>
      )}
    </Box>
  );

  const loading = settingsQuery.isLoading;

  return (
    <Box>
      <PageHeader title={l.title} />

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
        <Tab label={l.general} />
        <Tab label={l.workingHours} />
        <Tab label={l.loyalty} />
        <Tab label={l.zatca} />
        <Tab label={l.payments} />
        <Tab label={l.whatsapp} />
        <Tab label={l.backup} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {l.adminOnly}
        </Alert>
      )}

      {loading ? (
        <CircularProgress sx={{ mt: 4 }} />
      ) : (
        <>
          {tab === 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {l.settingsNote}
              </Typography>

              {/* Salon identity — dedicated save */}
              <Box
                sx={{
                  border: 1.5,
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  p: 2,
                  maxWidth: 620,
                  mb: 3,
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 1.5 }}>
                  {lang === 'ar' ? 'هوية الصالون' : 'Salon Identity'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    {renderSettingField('SALON_NAME_AR')}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {renderSettingField('SALON_NAME_EN')}
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1, width: '100%' }}>
                        {renderSettingField('SALON_LOGO_URL')}
                      </Box>
                      {isAdmin && (
                        <Button
                          size="small"
                          variant="outlined"
                          component="label"
                          startIcon={<UploadFileIcon />}
                          sx={{ whiteSpace: 'nowrap', mt: 0.5 }}
                        >
                          {lang === 'ar' ? 'استعراض' : 'Browse'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              if (!file) return;
                              if (file.size > 1024 * 1024) {
                                setError(
                                  lang === 'ar'
                                    ? 'حجم الصورة كبير — الحد الأقصى 1MB'
                                    : 'Image too large — max 1MB',
                                );
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setValues((prev) => ({ ...prev, SALON_LOGO_URL: reader.result as string }));
                                  setSnack(null);
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                  {(values.SALON_LOGO_URL ?? '').trim() !== '' && (
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          component="img"
                          src={values.SALON_LOGO_URL}
                          alt="logo preview"
                          sx={{
                            width: 72,
                            height: 72,
                            objectFit: 'contain',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: '#fff',
                            p: 0.5,
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {lang === 'ar' ? 'معاينة الشعار' : 'Logo preview'}
                        </Typography>
                      </Stack>
                    </Grid>
                  )}
                </Grid>
                {isAdmin && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={savingSection === 'identity' ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={() =>
                      void saveKeys(['SALON_NAME_AR', 'SALON_NAME_EN', 'SALON_LOGO_URL'], 'identity')
                    }
                    disabled={savingSection !== null}
                    sx={{ mt: 2, alignSelf: 'flex-start' }}
                  >
                    {savingSection === 'identity' ? l.saving : lang === 'ar' ? 'حفظ هوية الصالون' : 'Save Salon Identity'}
                  </Button>
                )}
              </Box>

              {/* Invoicing & messages — dedicated save */}
              <Box
                sx={{
                  border: 1.5,
                  borderColor: 'secondary.main',
                  borderRadius: 2,
                  p: 2,
                  maxWidth: 620,
                  mb: 3,
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} color="secondary.main" sx={{ mb: 1.5 }}>
                  {lang === 'ar' ? 'الفوترة والرسائل' : 'Invoicing & Messages'}
                </Typography>
                {renderSettingFields(['VAT_RATE', 'WELCOME_MESSAGE', 'SALON_POLICY'])}
                {isAdmin && (
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    startIcon={savingSection === 'invoicing' ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={() => void saveKeys(['VAT_RATE', 'WELCOME_MESSAGE', 'SALON_POLICY'], 'invoicing')}
                    disabled={savingSection !== null}
                    sx={{ mt: 2, alignSelf: 'flex-start' }}
                  >
                    {savingSection === 'invoicing' ? l.saving : l.saveInvoicingBtn}
                  </Button>
                )}
              </Box>

              {/* Social Media Box */}
              <Box
                sx={{
                  border: 1.5,
                  borderColor: 'info.main',
                  borderRadius: 2,
                  p: 2,
                  maxWidth: 620,
                  mb: 3,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(2,136,209,0.08) 0%, rgba(0,0,0,0) 100%)'
                      : 'linear-gradient(135deg, rgba(2,136,209,0.05) 0%, rgba(255,255,255,0) 100%)',
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} color="info.main" sx={{ mb: 0.5 }}>
                  {l.socialTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  {l.socialNote}
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    label={lang === 'ar' ? 'إنستجرام' : 'Instagram'}
                    value={values['SOCIAL_INSTAGRAM'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, SOCIAL_INSTAGRAM: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    placeholder="https://instagram.com/yoursalon"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <InstagramIcon sx={{ color: '#E1306C', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    size="small"
                    label={lang === 'ar' ? 'فيسبوك' : 'Facebook'}
                    value={values['SOCIAL_FACEBOOK'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, SOCIAL_FACEBOOK: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    placeholder="https://facebook.com/yoursalon"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <FacebookIcon sx={{ color: '#1877F2', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    size="small"
                    label={lang === 'ar' ? 'واتساب (رقم التواصل)' : 'WhatsApp (contact number)'}
                    value={values['SOCIAL_WHATSAPP'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, SOCIAL_WHATSAPP: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    placeholder="966501234567"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <WhatsAppIcon sx={{ color: '#25D366', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      size="small"
                      label={lang === 'ar' ? 'سناب شات' : 'Snapchat'}
                      value={values['SOCIAL_SNAPCHAT'] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, SOCIAL_SNAPCHAT: e.target.value }))}
                      disabled={!isAdmin}
                      fullWidth
                      placeholder="https://snapchat.com/add/yoursalon"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LinkIcon sx={{ color: '#FFFC00', fontSize: 18, stroke: '#888', strokeWidth: 0.5 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      size="small"
                      label={lang === 'ar' ? 'تيك توك' : 'TikTok'}
                      value={values['SOCIAL_TIKTOK'] ?? ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, SOCIAL_TIKTOK: e.target.value }))}
                      disabled={!isAdmin}
                      fullWidth
                      placeholder="https://tiktok.com/@yoursalon"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LinkIcon sx={{ color: '#010101', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Stack>
                </Stack>
                {isAdmin && (
                  <Button
                    size="small"
                    variant="contained"
                    color="info"
                    startIcon={savingSection === 'social' ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={() => void saveKeys(SOCIAL_KEYS, 'social')}
                    disabled={savingSection !== null}
                    sx={{ mt: 2, alignSelf: 'flex-start' }}
                  >
                    {savingSection === 'social' ? l.saving : l.saveSocialBtn}
                  </Button>
                )}
              </Box>

              <Grid container spacing={3} sx={{ mt: 0, maxWidth: 920 }} alignItems="stretch">
                <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                  {renderCatManager('services')}
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                  {renderCatManager('inventory')}
                </Grid>
              </Grid>
            </>
          )}

          {tab === 1 && (
            <Box sx={{ maxWidth: 840 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {l.hoursNote}
              </Typography>
              <Stack spacing={1.5}>
                {weekly.map((row) => (
                  <Box
                    key={row.day}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: 1.5,
                      borderColor: row.isOpen ? 'primary.light' : 'divider',
                      bgcolor: row.isOpen ? 'background.paper' : 'action.hover',
                      boxShadow: row.isOpen ? 1 : 0,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      gap: 1.5,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box sx={{ minWidth: 140, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, minWidth: 70 }} variant="subtitle1">
                        {lang === 'ar' ? DAY_AR[row.day] : DAY_EN[row.day]}
                      </Typography>
                      <Chip
                        size="small"
                        color={row.isOpen ? 'success' : 'default'}
                        label={row.isOpen ? (lang === 'ar' ? 'مفتوح' : 'Open') : (lang === 'ar' ? 'إجازة' : 'Off')}
                        variant={row.isOpen ? 'filled' : 'outlined'}
                      />
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ width: { xs: '100%', md: 'auto' } }}>
                      <FormControlLabel
                        control={
                          <Switch
                            color="success"
                            checked={row.isOpen}
                            onChange={(e) => updateDay(row.day, { isOpen: e.target.checked })}
                            disabled={!isAdmin}
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={600} color={row.isOpen ? 'success.main' : 'text.secondary'}>
                            {row.isOpen ? l.hoursWorkDay : l.hoursDayOff}
                          </Typography>
                        }
                      />

                      <TextField
                        label={l.hoursOpen}
                        value={row.opening}
                        onChange={(e) => updateDay(row.day, { opening: e.target.value })}
                        size="small"
                        type="time"
                        slotProps={{ inputLabel: { shrink: true } }}
                        disabled={!isAdmin || !row.isOpen}
                        sx={{ width: 130 }}
                      />
                      <TextField
                        label={l.hoursClose}
                        value={row.closing}
                        onChange={(e) => updateDay(row.day, { closing: e.target.value })}
                        size="small"
                        type="time"
                        slotProps={{ inputLabel: { shrink: true } }}
                        disabled={!isAdmin || !row.isOpen}
                        sx={{ width: 130 }}
                      />

                      <Tooltip title={l.hoursCopy}>
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => copyHoursToAll(row)}
                            disabled={!isAdmin || !row.isOpen}
                          >
                            <ScheduleIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Box>
                ))}
              </Stack>
              {isAdmin && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={savingSection === 'hours' ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={() => void saveHours()}
                  disabled={savingSection !== null}
                  sx={{ mt: 3, px: 3 }}
                >
                  {savingSection === 'hours' ? l.saving : l.saveHoursBtn}
                </Button>
              )}
            </Box>
          )}

          {tab === 2 &&
            renderSettingFields(LOYALTY_KEYS) && (
              <>
                {renderSettingFields(LOYALTY_KEYS)}
                {isAdmin && (
                  <Button
                    variant="contained"
                    startIcon={savingSection === 'loyalty' ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    onClick={() => void saveKeys(LOYALTY_KEYS, 'loyalty')}
                    disabled={savingSection !== null}
                    sx={{ mt: 2 }}
                  >
                    {savingSection === 'loyalty' ? l.saving : l.save}
                  </Button>
                )}
              </>
            )}

          {tab === 3 && (
            <Box sx={{ maxWidth: 760 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                {lang === 'ar' ? 'هوية الفاتورة الضريبية' : 'Tax Invoice Identity'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_VAT_NUMBER')}</Grid>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_INVOICE_TYPE')}</Grid>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_PHASE')}</Grid>
                <Grid item xs={12} sm={6}>{renderSettingField('QR_DISPLAY_MODE')}</Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
                {lang === 'ar' ? 'الاسم القانوني للبائع' : 'Seller Legal Name'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_SELLER_NAME_AR')}</Grid>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_SELLER_NAME_EN')}</Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
                {lang === 'ar' ? 'عنوان البائع' : 'Seller Address'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_ADDRESS_STREET')}</Grid>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_ADDRESS_CITY')}</Grid>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_ADDRESS_DISTRICT')}</Grid>
                <Grid item xs={12} sm={6}>{renderSettingField('ZATCA_ADDRESS_POSTAL')}</Grid>
              </Grid>

              {isAdmin && (
                  <Button
                    variant="contained"
                    startIcon={savingSection === 'zatca' ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    onClick={() => void saveKeys(ZATCA_KEYS, 'zatca')}
                    disabled={savingSection !== null}
                    sx={{ mt: 3, alignSelf: 'flex-start' }}
                  >
                    {savingSection === 'zatca' ? l.saving : l.save}
                  </Button>
              )}

              <DividerLight />

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5 }}>
                <Typography variant="h6">{l.zatcaTitle}</Typography>
                {isAdmin && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" disabled={zatcaBusy !== null}
                      startIcon={zatcaBusy === 'setup' ? <CircularProgress size={14} /> : undefined}
                      onClick={() => void handleZatcaSetup()}>
                      {l.zatcaGenerateCert}
                    </Button>
                    <Button size="small" variant="outlined" disabled={zatcaBusy !== null}
                      startIcon={zatcaBusy === 'test' ? <CircularProgress size={14} /> : undefined}
                      onClick={() => void handleZatcaTest()}>
                      {l.zatcaTest}
                    </Button>
                  </Stack>
                )}
              </Stack>
              {zatcaLoading ? (
                <CircularProgress size={22} />
              ) : zatcaStatus ? (
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {zatcaStatus.configured ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <ErrorIcon color="error" fontSize="small" />
                    )}
                    <Typography variant="body2">
                      {l.zatcaConfigured}: {zatcaStatus.configured ? l.zatcaYes : l.zatcaNo}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{l.zatcaEnv}: {zatcaStatus.env}</Typography>
                  <Typography variant="body2">{l.zatcaVatNumber}: {zatcaStatus.vatNumber || '—'}</Typography>
                  <Typography variant="body2">{l.zatcaSellerName}: {zatcaStatus.sellerName || '—'}</Typography>
                  <Typography variant="body2">
                    {l.zatcaCertValid}:{' '}
                    {zatcaStatus.certificateValid ? l.zatcaCertActive : l.zatcaCertExpired}
                    {zatcaStatus.certificateNotAfter
                      ? ' (' + new Date(zatcaStatus.certificateNotAfter).toLocaleDateString() + ')'
                      : ''}
                  </Typography>
                </Stack>
              ) : null}
            </Box>
          )}

          {tab === 4 && (
            <Box sx={{ maxWidth: 700 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {l.paymentsNote}
              </Typography>

              {/* Gateway selector */}
              <Box sx={{ border: 1.5, borderColor: 'success.main', borderRadius: 2, p: 2, mb: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <CreditCardIcon color="success" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={800} color="success.main">
                    {lang === 'ar' ? 'بوابة الدفع' : 'Payment Gateway'}
                  </Typography>
                </Stack>
                <TextField
                  select
                  label={l.paymentGateway}
                  value={values['PAYMENT_GATEWAY'] ?? 'moyasar'}
                  onChange={(e) => setValues((prev) => ({ ...prev, PAYMENT_GATEWAY: e.target.value }))}
                  disabled={!isAdmin}
                  fullWidth
                  sx={{ mb: 1.5 }}
                >
                  {PAYMENT_GATEWAY_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {lang === 'ar' ? o.labelAr : o.labelEn}
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    size="small"
                    label={l.paymentMerchantId}
                    value={values['PAYMENT_MERCHANT_ID'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, PAYMENT_MERCHANT_ID: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label={l.paymentCurrency}
                    value={values['PAYMENT_CURRENCY'] ?? 'SAR'}
                    onChange={(e) => setValues((prev) => ({ ...prev, PAYMENT_CURRENCY: e.target.value }))}
                    disabled={!isAdmin}
                    sx={{ maxWidth: 140 }}
                  />
                </Stack>
              </Box>

              {/* API keys */}
              <Box sx={{ border: 1.5, borderColor: 'warning.main', borderRadius: 2, p: 2, mb: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <LockIcon color="warning" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={800} color="warning.main">
                    {lang === 'ar' ? 'مفاتيح API' : 'API Keys'}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                  {l.paymentApiNote}
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    label={l.paymentApiKey}
                    type="password"
                    value={values['PAYMENT_API_KEY'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, PAYMENT_API_KEY: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    autoComplete="new-password"
                  />
                  <TextField
                    size="small"
                    label={l.paymentPublicKey}
                    value={values['PAYMENT_PUBLIC_KEY'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, PAYMENT_PUBLIC_KEY: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label={l.paymentWebhook}
                    value={values['PAYMENT_WEBHOOK_URL'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, PAYMENT_WEBHOOK_URL: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    placeholder="https://your-server.com/api/payments/webhook"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Stack>
              </Box>

              {isAdmin && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={savingSection === 'payments' ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={() => void saveKeys(PAYMENT_KEYS, 'payments')}
                  disabled={savingSection !== null}
                  sx={{ mt: 1 }}
                >
                  {savingSection === 'payments' ? l.saving : l.save}
                </Button>
              )}
            </Box>
          )}

          {tab === 5 && (
            <Box sx={{ maxWidth: 680 }}>
              {/* Connection Credentials */}
              <Box sx={{ border: 1.5, borderColor: 'success.light', borderRadius: 2, p: 2, mb: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <WhatsAppIcon sx={{ color: '#25D366', fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={800} color="success.dark">
                    {lang === 'ar' ? 'بيانات الاتصال بواتساب بيزنس' : 'WhatsApp Business API Credentials'}
                  </Typography>
                </Stack>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    label={l.whatsappToken}
                    type="password"
                    value={values['WHATSAPP_TOKEN'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, WHATSAPP_TOKEN: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    autoComplete="new-password"
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment> } }}
                  />
                  <TextField
                    size="small"
                    label={l.whatsappPhoneId}
                    value={values['WHATSAPP_PHONE_ID'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, WHATSAPP_PHONE_ID: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    placeholder="1234567890"
                  />
                  <TextField
                    size="small"
                    label={l.whatsappBizAccount}
                    value={values['WHATSAPP_BUSINESS_ACCOUNT_ID'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, WHATSAPP_BUSINESS_ACCOUNT_ID: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    placeholder="1234567890123456"
                  />
                  <TextField
                    size="small"
                    label={l.whatsappWebhookSecret}
                    type="password"
                    value={values['WHATSAPP_WEBHOOK_SECRET'] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, WHATSAPP_WEBHOOK_SECRET: e.target.value }))}
                    disabled={!isAdmin}
                    fullWidth
                    autoComplete="new-password"
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment> } }}
                  />
                </Stack>
              </Box>

              {/* Public contact & toggle */}
              <Box sx={{ border: 1.5, borderColor: 'divider', borderRadius: 2, p: 2, mb: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  {lang === 'ar' ? 'إعدادات العرض والتفعيل' : 'Display & Activation'}
                </Typography>
                <TextField
                  size="small"
                  label={l.whatsappPublicPhone}
                  value={values['WHATSAPP_PUBLIC_PHONE'] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, WHATSAPP_PUBLIC_PHONE: e.target.value }))}
                  disabled={!isAdmin}
                  fullWidth
                  placeholder="+966501234567"
                  sx={{ mb: 1.5 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <WhatsAppIcon sx={{ color: '#25D366', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      color="success"
                      checked={(values.WHATSAPP_ENABLED ?? 'false') === 'true'}
                      onChange={(e) => handleWhatsappToggle(e.target.checked)}
                      disabled={!isAdmin}
                    />
                  }
                  label={<Typography variant="body2" fontWeight={600}>{l.whatsappEnabled}</Typography>}
                />
              </Box>

              {/* Test */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  label={l.whatsappTestPhone}
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  fullWidth
                  placeholder="+966501234567"
                />
                <Button
                  variant="outlined"
                  color="success"
                  disabled={whatsappTesting || !whatsappPhone.trim()}
                  startIcon={whatsappTesting ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
                  onClick={() => void handleWhatsappTest()}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {l.whatsappTest}
                </Button>
              </Stack>

              {isAdmin && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={savingSection === 'whatsapp' ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={() => void handleSaveWhatsapp()}
                  disabled={savingSection !== null}
                >
                  {savingSection === 'whatsapp' ? l.saving : l.save}
                </Button>
              )}
            </Box>
          )}

          {tab === 6 && (
            <Box sx={{ maxWidth: 720 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {l.backupNote}
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    disabled={exporting !== null}
                    onClick={() => void handleExport('json')}
                  >
                    {exporting === 'json' ? <CircularProgress size={14} /> : l.backupJson}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    disabled={exporting !== null}
                    onClick={() => void handleExport('sql')}
                  >
                    {exporting === 'sql' ? <CircularProgress size={14} /> : l.backupSql}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    disabled={exporting !== null}
                    onClick={() => void handleExport('csv')}
                  >
                    {exporting === 'csv' ? <CircularProgress size={14} /> : l.backupCsv}
                  </Button>
                </Stack>
                {lastExport && (
                  <Typography variant="caption" color="text.secondary">
                    {l.lastExport} {lastExport}
                  </Typography>
                )}
                <DividerLight />
                <Typography variant="subtitle2" fontWeight={700}>
                  <BackupIcon fontSize="inherit" sx={{ verticalAlign: 'middle', me: 0.5 }} />{' '}
                  {l.backupSchedule}
                </Typography>
                {backupSchedule ? (
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      {backupSchedule.enabled ? `✅ ${l.backupEnabled}` : `⛔ ${l.backupDisabled}`}
                    </Typography>
                    <Typography variant="body2">
                      {l.backupCron}: {backupSchedule.cronExpression}
                    </Typography>
                    <Typography variant="body2">
                      {l.backupRetentionDays}: {backupSchedule.retentionDays}
                    </Typography>
                    <Typography variant="body2">
                      {l.backupDir}: {backupSchedule.backupDir}
                    </Typography>
                    <Typography variant="body2">
                      {l.backupLastRun}:{' '}
                      {backupSchedule.lastRunAt
                        ? new Date(backupSchedule.lastRunAt).toLocaleString()
                        : l.backupNeverRun}
                      {backupSchedule.lastRunStatus
                        ? ` — ${backupSchedule.lastRunStatus === 'success' ? l.backupStatusSuccess : l.backupStatusFailed}`
                        : ''}
                    </Typography>
                    {isAdmin && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={triggering ? <CircularProgress size={14} color="inherit" /> : <BackupIcon />}
                        disabled={triggering}
                        onClick={() => void handleTriggerBackup()}
                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                      >
                        {l.backupTrigger}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <CircularProgress size={20} />
                )}
              </Stack>
            </Box>
          )}
        </>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

function DividerLight() {
  return <Box sx={{ height: 1, bgcolor: 'divider', my: 1, maxWidth: 520 }} />;
}
