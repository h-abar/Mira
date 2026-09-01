# ميرا — نظام إدارة صالون نسائي (Mira Salon Management System)

نظام ويب متكامل لإدارة صالون نسائي: المواعيد، العملاء، الخدمات، الموظفات، الفوترة (POS)، المخزون، المحاسبة والتقارير — بواجهة ثنائية اللغة (عربية/إنجليزية) وقابل للاستخدام كتطبيق جوال (PWA).

## المزايا
- **نقاط البيع (POS)**: فواتير سريعة، طباعة فواتير، إكراميات (tips)، رسوم إلغاء المواعيد.
- **المواعيد**: حجز مع كشف التعارض + دعم التقويم الهجري، وتذكيرات واتساب مجدولة.
- **العضويات وبطاقات الهدايا**: باقات اشتراك، بطاقات هدايا بالكود.
- **الولاء والعروض**: نقاط ولاء، أكواد خصم، حملات تسويقية (Campaigns).
- **الفوترة الإلكترونية ZATCA**: توافق مع هيئة الزكاة والضريبة والجمارك (توليد CSR، XML وQR للفواتير).
- **فروع متعددة**: إدارة فروع مستقلة وتقارير لكل فرع (`branchId`).
- **المدفوعات الإلكترونية**: بوابة دفع محاكاة (simulated) مع استرداد (Refund).
- **لوحة تحكم وتحليلات**: مبيعات، أرباح وخسائر، إنتاجية الموظفات، وأكثر.
- **واتساب**: إشعارات عبر WhatsApp Cloud API (رسائل اختبار، إعادة محاولة الإرسال).
- **نسخ احتياطي مجدول**: تصدير JSON/SQL/CSV عبر cron مع سياسة احتفاظ.

## التقنيات
- **الواجهة الأمامية**: React + Vite + TypeScript + MUI (يدعم RTL)
- **الباكند**: Node.js + Express + TypeScript
- **قاعدة البيانات**: PostgreSQL 16 + Prisma ORM
- **المصادقة**: JWT + bcrypt (صلاحيات دقيقة لكل وحدة)
- **التقارير**: ExcelJS / PDFKit

## البدء السريع

### 1) تشغيل قاعدة البيانات (PostgreSQL عبر Docker)
```
docker compose up -d
```
(المستخدم/كلمة المرور/اسم القاعدة: `saloon` — من `docker-compose.yml`)

### 2) تجهيز الباكند
```
cd server
npm install
cp ../.env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```
الخادم يعمل على `http://localhost:4000`.

### 3) تجهيز الواجهة الأمامية
```
cd client
npm install
npm run dev
```
الواجهة تعمل على `http://localhost:5173` (الوكيل ينقل `/api` إلى الخادم).

## التشغيل الإنتاجي عبر Docker | Production deployment with Docker

تشغيل كامل للنظام (قاعدة البيانات + الخادم + الواجهة) بحاويات Docker:
Run the full stack (database + API + web UI) with Docker:

```
docker compose up -d --build
```

لأول مرة فقط، طبّق الترحيلات وأدخل البيانات الافتراضية:
On first run, apply migrations and seed default data:

```
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

افتح الواجهة: | Open the web UI: http://localhost:8080
(الخادم مباشرة: | API directly: http://localhost:4000)

ملاحظة: تأكد من وجود `server/.env` قبل التشغيل (انسخ من `.env.example`).
Note: make sure `server/.env` exists before running (copy from `.env.example`).

## بيانات الدخول الافتراضية
- اسم المستخدم: `admin`
- كلمة المرور: `admin1234`
- **إنتاج:** https://mira-production-296a.up.railway.app/login
- **ملف Excel:** `docs/بيانات-الدخول.xlsx` (بيانات الدخول + روابط سريعة)
- (يمكن تغييرهما بعد تسجيل الدخول أو في `server/prisma/seed.ts`)

## متغيرات البيئة
انسخ `.env.example` (في جذر المشروع) إلى `server/.env` وعدّل القيم. تشمل: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `PG_*`, `BACKUP_*`, `REMINDER_*`, `ZATCA_*`.

## بنية المشروع
```
saloon/
├── client/          # React frontend (PWA)
├── server/          # Node.js backend (Express + Prisma)
├── docs/            # الوثائق (مرجع API ...)
├── .env.example     # قالب متغيرات البيئة
├── docker-compose.yml
└── خطة-بناء-نظام-إدارة-صالون.md
```

## الموديولات
| الوحدة | المسار |
|--------|--------|
| المصادقة والأدوار | `server/src/modules/auth` |
| بوابة العميلات (عام) | `server/src/modules/public` |
| العملاء ونقاط الولاء | `server/src/modules/clients`, `loyalty` |
| الخدمات | `server/src/modules/services` |
| المواعيد (كشف التعارض) | `server/src/modules/appointments` |
| الموظفات والحضور | `server/src/modules/employees`, `attendance` |
| الورديات | `server/src/modules/shifts` |
| الفروع | `server/src/modules/branches` |
| المخزون والموردون والمشتريات | `server/src/modules/inventory`, `suppliers`, `purchases` |
| الفوترة والمحاسبة (POS) | `server/src/modules/accounting` |
| العروض والعضويات وبطاقات الهدايا | `server/src/modules/offers`, `memberships`, `giftcards` |
| المدفوعات الإلكترونية | `server/src/modules/payments` |
| الفوترة الإلكترونية ZATCA | `server/src/modules/zatca` |
| الإشعارات وواتساب | `server/src/modules/notifications` |
| التقارير والتحليلات | `server/src/modules/reports` |
| المستخدمون والصلاحيات | `server/src/modules/users` |
| الإعدادات | `server/src/modules/settings` |
| النسخ الاحتياطي | `server/src/modules/backup` |

## الأوامر المفيدة
- بناء الإنتاج (باكند): `cd server && npm run build`
- بناء الإنتاج (فرونت): `cd client && npm run build`
- تشغيل الإنتاج (باكند): `cd server && npm run start`
- التحقق من الأنواع: `cd server && npx tsc --noEmit` و `cd client && npx tsc --noEmit`
- إعادة تهيئة قاعدة البيانات: `docker compose down -v && docker compose up -d && cd server && npm run prisma:migrate`