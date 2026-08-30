import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

const DAY_KEYS = ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'] as const;
const DAY_LABEL_AR: Record<string, string> = {
  SAT: 'السبت',
  SUN: 'الأحد',
  MON: 'الاثنين',
  TUE: 'الثلاثاء',
  WED: 'الأربعاء',
  THU: 'الخميس',
  FRI: 'الجمعة',
};
const DAY_LABEL_EN: Record<string, string> = {
  SAT: 'Saturday',
  SUN: 'Sunday',
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
};

const daySettingDefs: Record<string, { defaultValue: string; labelAr: string; labelEn: string }> = {};
for (const d of DAY_KEYS) {
  daySettingDefs[`${d}_OPENING`] = {
    defaultValue: '10:00',
    labelAr: `ساعات العمل ${DAY_LABEL_AR[d]} (البداية)`,
    labelEn: `${DAY_LABEL_EN[d]} Opening`,
  };
  daySettingDefs[`${d}_CLOSING`] = {
    defaultValue: '21:00',
    labelAr: `ساعات العمل ${DAY_LABEL_AR[d]} (النهاية)`,
    labelEn: `${DAY_LABEL_EN[d]} Closing`,
  };
}
daySettingDefs.CLOSED_DAYS = {
  defaultValue: '',
  labelAr: 'أيام الإغلاق (مفصولة بفاصلة)',
  labelEn: 'Closed Days (comma separated)',
};

export const SETTINGS_DEFINITIONS = {
  VAT_RATE: {
    defaultValue: '15',
    labelAr: 'نسبة الضريبة (VAT)',
    labelEn: 'VAT Rate',
  },
  ...daySettingDefs,
  LOYALTY_POINTS_PER_CURRENCY: {
    defaultValue: '1',
    labelAr: 'نقاط الولاء لكل عملة',
    labelEn: 'Loyalty Points Per Currency',
  },
  LOYALTY_POINT_VALUE: {
    defaultValue: '0.10',
    labelAr: 'قيمة نقطة الولاء',
    labelEn: 'Loyalty Point Value',
  },
  SALON_NAME_AR: {
    defaultValue: 'ميرا',
    labelAr: 'اسم الصالون (عربي)',
    labelEn: 'Salon Name (Arabic)',
  },
  SALON_NAME_EN: {
    defaultValue: 'Mira',
    labelAr: 'اسم الصالون (إنجليزي)',
    labelEn: 'Salon Name (English)',
  },
  SALON_LOGO_URL: {
    defaultValue: '',
    labelAr: 'شعار الصالون (رابط صورة)',
    labelEn: 'Salon Logo (image URL)',
  },
  WHATSAPP_TOKEN: {
    defaultValue: '',
    labelAr: 'رمز واتساب (Token)',
    labelEn: 'WhatsApp Token',
  },
  WHATSAPP_PHONE_ID: {
    defaultValue: '',
    labelAr: 'معرف هاتف واتساب (Phone ID)',
    labelEn: 'WhatsApp Phone ID',
  },
  WHATSAPP_ENABLED: {
    defaultValue: 'false',
    labelAr: 'تفعيل واتساب',
    labelEn: 'WhatsApp Enabled',
  },
  PAYMENT_METHOD: {
    defaultValue: '',
    labelAr: 'طريقة الدفع',
    labelEn: 'Payment Method',
  },
  PAYMENT_API_KEY: {
    defaultValue: '',
    labelAr: 'مفتاح API للدفع',
    labelEn: 'Payment API Key',
  },
  PAYMENT_PUBLIC_KEY: {
    defaultValue: '',
    labelAr: 'المفتاح العام للدفع',
    labelEn: 'Payment Public Key',
  },
  ZATCA_VAT_NUMBER: {
    defaultValue: '310123456700003',
    labelAr: 'رقم ضريبة القيمة المضافة (ZATCA)',
    labelEn: 'ZATCA VAT Number',
  },
  ZATCA_ENV: {
    defaultValue: 'sandbox',
    labelAr: 'بيئة ZATCA',
    labelEn: 'ZATCA Environment',
  },
  QR_DISPLAY_MODE: {
    defaultValue: 'square',
    labelAr: 'نوع عرض رمز QR (مربع/نص)',
    labelEn: 'QR Display Mode (square/text)',
  },
  WELCOME_MESSAGE: {
    defaultValue: 'شكرًا لزيارتكم! نتمنى لكم يوماً سعيداً',
    labelAr: 'الرسالة الترحيبية (تظهر أسفل الفاتورة)',
    labelEn: 'Welcome Message (shown on the invoice)',
  },
  SALON_POLICY: {
    defaultValue: '',
    labelAr: 'سياسة الصالون (تظهر في الفاتورة)',
    labelEn: 'Salon Policy (shown on the invoice)',
  },
  SERVICES_CATEGORIES: {
    defaultValue: '',
    labelAr: 'فئات الخدمات (مفصولة بفاصلة)',
    labelEn: 'Service Categories (comma separated)',
  },
  INVENTORY_CATEGORIES: {
    defaultValue: '',
    labelAr: 'فئات المخزون (مفصولة بفاصلة)',
    labelEn: 'Inventory Categories (comma separated)',
  },
  ZATCA_INVOICE_TYPE: {
    defaultValue: 'simplified',
    labelAr: 'نوع الفاتورة (مبسطة B2C / ضريبية B2B)',
    labelEn: 'Invoice Type (simplified B2C / standard B2B)',
  },
  ZATCA_PHASE: {
    defaultValue: 'phase1',
    labelAr: 'مرحلة الفاتورة الإلكترونية (المرحلة الأولى / التكامل)',
    labelEn: 'E-invoicing Phase (Phase 1 / Integration)',
  },
  ZATCA_SELLER_NAME_AR: {
    defaultValue: '',
    labelAr: 'الاسم القانوني للبائع (عربي) — ZATCA',
    labelEn: 'Seller Legal Name (Arabic) — ZATCA',
  },
  ZATCA_SELLER_NAME_EN: {
    defaultValue: '',
    labelAr: 'الاسم القانوني للبائع (إنجليزي) — ZATCA',
    labelEn: 'Seller Legal Name (English) — ZATCA',
  },
  ZATCA_ADDRESS_STREET: {
    defaultValue: '',
    labelAr: 'العنوان: الشارع — ZATCA',
    labelEn: 'Address: Street — ZATCA',
  },
  ZATCA_ADDRESS_CITY: {
    defaultValue: '',
    labelAr: 'العنوان: المدينة — ZATCA',
    labelEn: 'Address: City — ZATCA',
  },
  ZATCA_ADDRESS_DISTRICT: {
    defaultValue: '',
    labelAr: 'العنوان: الحي — ZATCA',
    labelEn: 'Address: District — ZATCA',
  },
  ZATCA_ADDRESS_POSTAL: {
    defaultValue: '',
    labelAr: 'العنوان: الرمز البريدي — ZATCA',
    labelEn: 'Address: Postal Code — ZATCA',
  },
} as const;

export type SettingKey = keyof typeof SETTINGS_DEFINITIONS;

const KNOWN_KEYS = Object.keys(SETTINGS_DEFINITIONS) as SettingKey[];

// Keys that contain secrets — their values are masked in normal GET responses
const SECRET_KEYS = new Set([
  'WHATSAPP_TOKEN',
  'PAYMENT_API_KEY',
  'PAYMENT_PUBLIC_KEY',
  'ZATCA_PRIVATE_KEY',
  'ZATCA_CERTIFICATE',
]);

async function getAll() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: KNOWN_KEYS } },
  });

  const stored = new Map(rows.map((row) => [row.key, row.value]));

  const items = KNOWN_KEYS.map((key) => {
    const def = SETTINGS_DEFINITIONS[key];
    const rawValue = stored.get(key) ?? def.defaultValue;
    // Mask secrets: show whether set, but never the actual value
    const value = SECRET_KEYS.has(key) && rawValue
      ? '••••••••'
      : rawValue;
    return {
      key,
      value,
      isSecret: SECRET_KEYS.has(key),
      labelAr: def.labelAr,
      labelEn: def.labelEn,
    };
  });

  return { items };
}

async function update(values: Record<string, string>) {
  const entries = Object.entries(values)
    .filter(([key]) => key in SETTINGS_DEFINITIONS)
    .map(([key, value]) => [key, value.trim()] as [string, string]);

  const TIME_RE = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const VALID_DAYS = new Set(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const valueMap = new Map(entries);

  for (const [key, trimmed] of entries) {
    if (key.endsWith('_OPENING') || key.endsWith('_CLOSING')) {
      if (!TIME_RE.test(trimmed)) {
        throw new ApiError(400, 'Invalid time format — use HH:MM (e.g. 10:00)');
      }
    }
    if (key === 'CLOSED_DAYS' && trimmed) {
      const invalid = trimmed
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d && !VALID_DAYS.has(d));
      if (invalid.length > 0) {
        throw new ApiError(400, `Invalid day name(s): ${invalid.join(', ')} — use Sun, Mon, Tue, Wed, Thu, Fri, Sat`);
      }
    }
    if (key === 'QR_DISPLAY_MODE' && trimmed !== 'square' && trimmed !== 'text') {
      throw new ApiError(400, 'QR display mode must be "square" or "text"');
    }
    if (key === 'ZATCA_VAT_NUMBER' && trimmed) {
      // KSA VAT registration number: exactly 15 digits, starts and ends with 3.
      if (!/^\d{15}$/.test(trimmed)) {
        throw new ApiError(400, 'ZATCA VAT number must be exactly 15 digits.');
      }
      if (!trimmed.startsWith('3') || !trimmed.endsWith('3')) {
        throw new ApiError(400, 'KSA VAT number must start and end with the digit 3.');
      }
    }
    if (key === 'ZATCA_INVOICE_TYPE' && trimmed !== 'simplified' && trimmed !== 'standard') {
      throw new ApiError(400, 'Invoice type must be "simplified" or "standard"');
    }
    if (key === 'ZATCA_PHASE' && trimmed !== 'phase1' && trimmed !== 'phase2') {
      throw new ApiError(400, 'ZATCA phase must be "phase1" or "phase2"');
    }
  }

  for (const day of DAY_KEYS) {
    const opening = valueMap.get(`${day}_OPENING`);
    const closing = valueMap.get(`${day}_CLOSING`);
    if (opening && closing && timeToMinutes(opening) >= timeToMinutes(closing)) {
      throw new ApiError(400, `Opening time must be before closing time (${DAY_LABEL_EN[day]})`);
    }
  }

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );

  return getAll();
}

export const settingsService = {
  getAll,
  update,
};
