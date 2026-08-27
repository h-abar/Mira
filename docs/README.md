# نظام إدارة صالون حلاقة نسائي — دليل المشروع

نظام ويب متكامل لإدارة صالون نسائي (مواعيد، عملاء، خدمات، موظفات، فواتير، مخزون، محاسبة، ولاء، عروض، حضور، مشتريات، إشعارات، إعدادات ونسخ احتياطي) بواجهة ثنائية اللغة (عربية/إنجليزية).

---

## 1. البنية (Monorepo)

```
saloon/
├── client/                        # الواجهة الأمامية (React + Vite + TypeScript + MUI)
│   └── src/
│       ├── api/                   # استدعاءات API (axios)
│       ├── components/            # مكونات مشتركة (AppLayout, ShiftStatusBar ...)
│       ├── i18n/                  # ملفات الترجمة (ar.json, en.json)
│       ├── pages/                 # صفحات النظام
│       ├── router/                # التوجيه (AppRoutes.tsx)
│       ├── stores/                # حالة Zustand (authStore)
│       ├── theme/                 # تنسيقات MUI + RTL
│       └── utils/                 # أدوات مساعدة (languageValidation)
├── server/                        # الباكند (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma          # مخطط قاعدة البيانات
│   │   └── seed.ts                # بيانات أولية (admin + موظفات + خدمات)
│   └── src/
│       ├── config/                # env.ts, database.ts
│       ├── middleware/            # auth, errorHandler, i18n
│       ├── modules/               # كل وحدة: controller + service + routes + validation
│       └── utils/                 # ApiError, languageValidation
├── docs/                          # هذه الوثائق
├── docker-compose.yml             # تشغيل PostgreSQL
├── start.bat                      # تشغيل سريع
└── خطة-بناء-نظام-إدارة-صالون.md   # خطة البناء
```

---

## 2. المتطلبات

| المتطلب | الإصدار |
|---------|---------|
| Node.js | 20+ |
| PostgreSQL | 16+ (أو عبر Docker) |
| Docker + Docker Compose | اختياري (لقاعدة البيانات) |
| أداة `pg_dump` | مطلوبة لتصدير النسخة الاحتياطية SQL (تأتي مع PostgreSQL) |

---

## 3. التشغيل

### قاعدة البيانات
```bash
docker compose up -d
```
(المستخدم/كلمة المرور/اسم القاعدة: `saloon` — من `docker-compose.yml`)

### الباكند (server)
```bash
cd server
npm install
npx prisma db push          # أو: npx prisma migrate dev --name init
npm run prisma:seed         # إنشاء مستخدم admin والبيانات الأولية
npm run dev
```
يعمل على: `http://localhost:4000`

### الواجهة الأمامية (client)
```bash
cd client
npm install
npm run dev
```
تعمل على: `http://localhost:5173` (الوكيل يمرر `/api` إلى الخادم).

### المنافذ
| الخدمة | المنفذ |
|--------|--------|
| الواجهة الأمامية (Vite) | 5173 |
| الباكند (Express) | 4000 |
| PostgreSQL | 5432 |

---

## 4. بيانات الدخول الافتراضية

| اسم المستخدم | كلمة المرور | الدور |
|--------------|--------------|-------|
| `admin` | `admin123` | ADMIN |

(يمكن التعديل في `server/prisma/seed.ts` أو من شاشة المستخدمين بعد الدخول)

---

## 5. متغيرات البيئة

نسخ `.env.example` إلى `.env` داخل `server/`:

| المتغير | الوصف | الافتراضي |
|---------|-------|-----------|
| `NODE_ENV` | بيئة التشغيل | `development` |
| `DATABASE_URL` | اتصال PostgreSQL | `postgresql://saloon:saloon@localhost:5432/saloon` |
| `JWT_SECRET` | سر التوكنات | `saloon-super-secret-change-me` |
| `JWT_EXPIRES_IN` | مدة صلاحية التوكن | `7d` |
| `PORT` | منفذ الخادم | `4000` |
| `CORS_ORIGIN` | نطاقات مسموح بها | `*` |
| `PG_HOST` | مضيف PostgreSQL (لـ pg_dump) | `localhost` |
| `PG_PORT` | منفذ PostgreSQL (لـ pg_dump) | `5432` |
| `PG_USER` | مستخدم PostgreSQL (لـ pg_dump) | `saloon` |
| `PG_PASSWORD` | كلمة مرور PostgreSQL (لـ pg_dump) | `saloon` |
| `PG_DATABASE` | اسم قاعدة البيانات (لـ pg_dump) | `saloon` |
| `BACKUP_CRON` | جدول النسخ الاحتياطي التلقائي (node-cron) | `0 2 * * *` |
| `BACKUP_DIR` | مجلد حفظ النسخ الاحتياطية | `./backups` |
| `BACKUP_RETENTION_DAYS` | عدد أيام الاحتفاظ بالنسخ قبل التنظيف التلقائي | `30` |
| `REMINDER_ENABLED` | تفعيل تذكير المواعيد (WhatsApp) عبر الجدولة | `true` |
| `REMINDER_CRON` | جدول تشغيل التذكيرات (node-cron) | `0 20 * * *` |
| `REMINDER_HOURS_BEFORE` | كم ساعة قبل الموعد يُرسل التذكير | `24` |
| `ZATCA_ENV` | بيئة الفوترة الإلكترونية ZATCA (`sandbox`/`production`) | `sandbox` |
| `ZATCA_VAT_NUMBER` | الرقم الضريبي ZATCA | `""` |
| `WHATSAPP_TOKEN` | توكن WhatsApp Cloud API | `""` |
| `WHATSAPP_PHONE_ID` | معرف هاتف WhatsApp | `""` |

---

## 6. الوحدات

| الوحدة | المسار |
|--------|--------|
| المصادقة والأدوار | `server/src/modules/auth` |
| العموم (بوابة العميلات) | `server/src/modules/public` |
| العملاء + نقاط الولاء | `server/src/modules/clients`, `loyalty` |
| المواعيد + كشف التعارض | `server/src/modules/appointments` |
| الخدمات | `server/src/modules/services` |
| الموظفات | `server/src/modules/employees` |
| الحضور والانصراف | `server/src/modules/attendance` |
| الورديات | `server/src/modules/shifts` |
| المخزون + الموردون + المشتريات | `server/src/modules/inventory`, `suppliers`, `purchases` |
| المحاسبة (فواتير/مصروفات/عروض) | `server/src/modules/accounting`, `offers` |
| التقارير | `server/src/modules/reports` |
| المستخدمون والصلاحيات | `server/src/modules/users` |
| الإشعارات (WhatsApp) | `server/src/modules/notifications` |
| الإعدادات | `server/src/modules/settings` |
| النسخ الاحتياطي | `server/src/modules/backup` |

---

## 7. روابط مفيدة

- [الميزات](features.md)
- [دليل الاستخدام (عربي)](user-manual.md)
- [مرجع API](api.md)
- [البنية التقنية](architecture.md)
- [خطة البناء](../خطة-بناء-نظام-إدارة-صالون.md)

---

## 8. الأوامر المفيدة

```bash
# بناء الإنتاج (باكند)
cd server && npm run build

# بناء الإنتاج (فرونت)
cd client && npm run build

# التحقق من الأنواع
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit

# إعادة تهيئة قاعدة البيانات
docker compose down -v && docker compose up -d && cd server && npx prisma migrate dev
```