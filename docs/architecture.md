# البنية التقنية (Architecture)

---

## 1. التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| الواجهة الأمامية | React 18 + Vite + TypeScript |
| مكتبة الواجهة | MUI (Material UI v6) + @mui/x-data-grid + @mui/x-date-pickers |
| حالة الواجهة | Zustand (حالة محلية) + TanStack Query (بيانات الخادم) |
| التوجيه | React Router v6 |
| اللغة | react-i18next (عربي/إنجليزي + RTL عبر stylis-plugin-rtl) |
| الباكند | Node.js + Express + TypeScript |
| قاعدة البيانات | PostgreSQL 16 + Prisma ORM |
| المصادقة | JWT + bcrypt |
| التحقق | Zod |
| التقارير | ExcelJS + PDFKit |
| النسخ الاحتياطي | pg_dump (child_process) |

---

## 2. بنية المجلدات

### server/
```
server/
├── prisma/
│   ├── schema.prisma          # المخطط الكامل لقاعدة البيانات
│   └── seed.ts                # البيانات الأولية (admin، موظفات، خدمات، عميلة)
└── src/
    ├── index.ts               # نقطة الدخول (listen)
    ├── app.ts                 # إعداد Express + تسجيل الوحدات
    ├── config/
    │   ├── env.ts             # قراءة متغيرات البيئة مع قيم افتراضية
    │   └── database.ts        # إنشاء PrismaClient (Singleton)
    ├── middleware/
    │   ├── auth.ts            # auth, requireRole, requirePermission
    │   ├── errorHandler.ts    # معالجة الأخطاء (ApiError / Zod / Prisma)
    │   └── i18n.ts            # لغة الاستجابة
    ├── modules/
    │   ├── <module>/
    │   │   ├── <module>.routes.ts       # تعريف المسارات
    │   │   ├── <module>.controller.ts   # التعامل مع الطلبات (zod parse)
    │   │   ├── <module>.service.ts      # منطق الأعمال + Prisma
    │   │   └── <module>.validation.ts   # مخططات Zod
    └── utils/
        ├── ApiError.ts
        └── languageValidation.ts
```

الوحدات: `auth`, `public`, `clients`, `appointments`, `services`, `employees`, `attendance`, `shifts`, `inventory`, `suppliers`, `purchases`, `accounting`, `offers`, `loyalty`, `reports`, `users`, `notifications`, `settings`, `backup`.

### client/
```
client/src/
├── api/                # استدعاءات axios لكل وحدة (client.ts يحمل التوكن تلقائياً)
├── components/         # AppLayout, ShiftStatusBar ...
├── i18n/               # ar.json, en.json, index.ts
├── pages/              # صفحة لكل شاشة (Dashboard, Clients, ... Settings)
├── pages/public/       # Landing, Booking, BookingStatus
├── router/             # AppRoutes.tsx + ProtectedRoute
├── stores/             # authStore (Zustand)
├── theme/              # إعدادات MUI + RTL
└── utils/              # languageValidation
```

---

## 3. نظرة على مخطط قاعدة البيانات (Prisma)

القائمة الكاملة للنماذج (models) مع أهم الحقول والعلاقات:

| النموذج | الجدول | أهم الحقول | العلاقات |
|---------|--------|------------|----------|
| `User` | users | username، passwordHash، role، **permissions[]**، employeeId، isActive | employee، expenses، shiftSessions، purchaseOrders |
| `Client` | clients | name، phone، whatsapp، email، birthdate، notes، totalSpent، **loyaltyPoints** | appointments، invoices، loyaltyTransactions |
| `Service` | services | nameAr، nameEn، category، price، durationMinutes، cost، isActive | appointments، invoiceItems |
| `Employee` | employees | nameAr، nameEn، phone، role، commissionRate، hireDate، isActive، shiftName/Start/End، workDays | users، appointments، invoices، shiftSessions، attendance |
| `ShiftSession` | shift_sessions | employeeId، openedByUserId، startTime، endTime، openingBalance، expectedCash، actualCash، difference، totalSales/Cash/Card، totalExpenses، status | employee، openedByUser، invoices، expenses |
| `Appointment` | appointments | clientId، employeeId، serviceId، date، startTime، endTime، status، notes | client، employee، service |
| `Invoice` | invoices | invoiceNo، clientId، employeeId، shiftSessionId، date، subtotal، discount، tax، total، **offerCode**، **pointsEarned**، **pointsRedeemed**، paymentMethod، status | client، employee، shiftSession، items |
| `InvoiceItem` | invoice_items | invoiceId، serviceId؟، productId؟، description، quantity، unitPrice، lineTotal | invoice، service، product |
| `Expense` | expenses | date، category، amount، description، createdBy، shiftSessionId | creator، shiftSession |
| `Product` | products | nameAr، nameEn، barcode، category، quantity، unit، costPrice، salePrice، minStock، supplier، **supplierId** | supplierRel، invoiceItems، movements، purchaseOrderItems |
| `StockMovement` | stock_movements | productId، type، quantity، date، referenceId | product |
| `LoyaltyTransaction` | loyalty_transactions | clientId، points، type (EARN/REDEEM)، balanceAfter، referenceId، note | client |
| `Offer` | offers | code، nameAr، nameEn، discountType، value، validFrom، validTo، minTotal، isActive | — |
| `Attendance` | attendance | employeeId، date، checkIn، checkOut، hoursWorked، notes (فريد: employeeId+date) | employee |
| `Supplier` | suppliers | name، phone، email، address، notes، isActive | products، purchaseOrders |
| `PurchaseOrder` | purchase_orders | orderNo، supplierId، date، status، subtotal، discount، total، paymentMethod، createdBy، notes | supplier، creator، items |
| `PurchaseOrderItem` | purchase_order_items | purchaseOrderId، productId؟، productName، quantity، unitCost، lineTotal | purchaseOrder، product |
| `Setting` | settings | key (PK)، value | — |
| `Notification` | notifications | type، target، message، status، referenceId | — |

### التعدادات (Enums)
- `UserRole`: ADMIN, RECEPTIONIST, STYLIST
- `EmployeeRole`: STYLIST, BEAUTICIAN, RECEPTIONIST
- `AppointmentStatus`: BOOKED, ARRIVED, DONE, CANCELLED
- `PaymentMethod`: CASH, CARD, WALLET
- `InvoiceStatus`: PAID, PENDING, CANCELLED
- `MovementType`: IN, SALE, USAGE, LOSS
- `ShiftStatus`: OPEN, CLOSED
- `LoyaltyType`: EARN, REDEEM
- `DiscountType`: PERCENT, FIXED
- `PurchaseStatus`: PENDING, RECEIVED, CANCELLED
- `NotificationStatus`: PENDING, SENT, FAILED

---

## 4. نهج الثنائية اللغة (i18n)

- **الواجهة**: `react-i18next` مع ملفي `ar.json` و`en.json`، تبديل فوري للغة مع اتجاه RTL/LTR.
- **الخادم**: Middleware `i18n` يضبط لغة الاستجابة حسب `Accept-Language` أو `lang`.
- **البيانات**: الأسماء الثنائية اللغة تُخزّن في حقلين (`nameAr`/`nameEn`) للخدمات والمنتجات والموظفات والعروض.
- **التحقق اللغوي**: دالة `isArabicText` / `isLatinText` في الباكند والفرونت لضمان صحة الحقلين.

---

## 5. متغيرات البيئة

| المتغير | الوصف | الافتراضي |
|---------|-------|-----------|
| `DATABASE_URL` | اتصال PostgreSQL | `postgresql://saloon:saloon@localhost:5432/saloon` |
| `JWT_SECRET` | سر التوكنات | `saloon-super-secret-change-me` |
| `JWT_EXPIRES_IN` | صلاحية التوكن | `7d` |
| `PORT` | منفذ الخادم | `4000` |
| `CORS_ORIGIN` | النطاقات المسموحة | `*` |
| `PG_HOST` | مضيف PG (pg_dump) | `localhost` |
| `PG_PORT` | منفذ PG (pg_dump) | `5432` |
| `PG_USER` | مستخدم PG (pg_dump) | `saloon` |
| `PG_PASSWORD` | كلمة مرور PG (pg_dump) | `saloon` |
| `PG_DATABASE` | اسم القاعدة (pg_dump) | `saloon` |
| `WHATSAPP_TOKEN` | توكن WhatsApp Cloud API | `""` |
| `WHATSAPP_PHONE_ID` | معرف هاتف WhatsApp | `""` |

---

## 6. نمط كتابة الوحدات

كل وحدة تتبع نفس النمط:
1. **validation.ts**: مخططات Zod للمدخلات (body/query/params).
2. **service.ts**: منطق الأعمال والوصول إلى `prisma` (من `../../config/database`) ورمي `ApiError` (من `../../utils/ApiError`).
3. **controller.ts**: يقرأ الطلب، يستخدم `schema.parse`، ويرد بـ `{ success: true, data }`، مع `next(err)` في حالات الخطأ.
4. **routes.ts**: `Router` مع `router.use(auth)` + `requireRole(...)` للكتابة، وتصدير `default`.

### تسجيل الوحدة في app.ts
```ts
import settingsRouter from './modules/settings/settings.routes';
import backupRouter from './modules/backup/backup.routes';
// ...
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/backup', backupRouter);
```

### إضافة صفحة للفرونت
```ts
// AppRoutes.tsx
<Route path="settings" element={<SettingsPage />} />

// AppLayout.tsx (navItems)
{ path: '/admin/settings', key: 'settings', icon: <SettingsIcon /> }
```