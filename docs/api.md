# مرجع API — نظام إدارة الصالون

- **الرابط الأساسي**: `/api` (يُمرَّر عبر Vite proxy إلى `http://localhost:4000`).
- **المصادقة**: رأس `Authorization: Bearer <token>` يتم إرجاعه من `/api/auth/login`.
- **صيغة الاستجابة الناجحة**: `{ "success": true, "data": ... }`.
- **الاستجابة الخطأ**: `{ "success": false, "status": <code>, "message": "...", "errors": [...] }`.
- **التحقق من المدخلات**: Zod (400 عند الفشل).

## الأدوار (Roles)

| الدور | الاختصار |
|-------|----------|
| مدير | `ADMIN` |
| استقبال | `RECEPTIONIST` |
| كوافيرة | `STYLIST` |

قائمة الأدوار في الجداول أدناه هي الأدوار المسموح بها لكل مسار. الحذف والمشتريات والنسخ الاحتياطي والإعدادات (تعديل) والمنتجات — للمدير فقط غالباً.

---

## وحدة Auth

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| POST | `/api/auth/login` | تسجيل الدخول، يُرجع التوكن والبيانات | عام |
| GET | `/api/auth/me` | بيانات المستخدم الحالي | أي مستخدم مسجّل |

---

## وحدة Public (بوابة العميلات — بدون توكن)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/public/services` | الخدمات النشطة |
| GET | `/api/public/employees` | الموظفات |
| GET | `/api/public/available-slots` | الأوقات المتاحة |
| POST | `/api/public/book` | حجز موعد |
| GET | `/api/public/booking/:code` | حالة الحجز بالكود |

---

## وحدة Clients (العملاء)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/clients` | قائمة + بحث (q, page, limit) | ADMIN, RECEPTIONIST, STYLIST |
| GET | `/api/clients/:id` | تفاصيل عميلة | مسجّل |
| POST | `/api/clients` | إنشاء | ADMIN, RECEPTIONIST |
| PUT | `/api/clients/:id` | تعديل | ADMIN, RECEPTIONIST |
| DELETE | `/api/clients/:id` | حذف | ADMIN |

---

## وحدة Appointments (المواعيد)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/appointments` | قائمة + فلاتر | مسجّل |
| GET | `/api/appointments/:id` | تفاصيل | مسجّل |
| POST | `/api/appointments` | إنشاء (مع كشف تعارض) | ADMIN, RECEPTIONIST |
| PUT | `/api/appointments/:id` | تعديل | ADMIN, RECEPTIONIST |
| PATCH | `/api/appointments/:id/status` | تغيير الحالة | ADMIN, RECEPTIONIST, STYLIST |
| DELETE | `/api/appointments/:id` | حذف | ADMIN |

---

## وحدة Services (الخدمات)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/services` | قائمة | ADMIN, RECEPTIONIST, STYLIST |
| GET | `/api/services/:id` | تفاصيل | ADMIN, RECEPTIONIST, STYLIST |
| POST | `/api/services` | إنشاء | ADMIN |
| PUT | `/api/services/:id` | تعديل | ADMIN |
| DELETE | `/api/services/:id` | حذف | ADMIN |

---

## وحدة Employees (الموظفات)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/employees` | قائمة | ADMIN, RECEPTIONIST, STYLIST |
| GET | `/api/employees/:id` | تفاصيل | ADMIN, RECEPTIONIST, STYLIST |
| POST | `/api/employees` | إنشاء | ADMIN |
| PUT | `/api/employees/:id` | تعديل | ADMIN |
| DELETE | `/api/employees/:id` | حذف | ADMIN |

---

## وحدة Shifts (الورديات)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| POST | `/api/shifts/open` | فتح وردية | مسجّل |
| GET | `/api/shifts/active` | الوردية المفتوحة (اختياري employeeId) | مسجّل |
| POST | `/api/shifts/:id/close` | إغلاق وردية | مسجّل |
| GET | `/api/shifts` | قائمة الورديات | مسجّل |
| GET | `/api/shifts/:id` | تفاصيل وردية (فواتير/مصروفات) | مسجّل |

---

## وحدة Attendance (الحضور)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| POST | `/api/attendance/check-in` | تسجيل حضور | مسجّل |
| POST | `/api/attendance/check-out` | تسجيل انصراف | مسجّل |
| GET | `/api/attendance/summary` | ملخص الحضور | مسجّل |
| GET | `/api/attendance` | قائمة الحضور | مسجّل |

---

## وحدة Inventory (المخزون)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/inventory/products` | قائمة منتجات (بحث/مخزون منخفض) | ADMIN, RECEPTIONIST, STYLIST |
| POST | `/api/inventory/products` | إنشاء منتج | ADMIN |
| PUT | `/api/inventory/products/:id` | تعديل منتج | ADMIN |
| DELETE | `/api/inventory/products/:id` | حذف منتج | ADMIN |
| GET | `/api/inventory/products/:id/movements` | حركات منتج | ADMIN, RECEPTIONIST, STYLIST |
| GET | `/api/inventory/movements` | كل الحركات | ADMIN, RECEPTIONIST, STYLIST |
| POST | `/api/inventory/movements` | إضافة حركة | ADMIN, RECEPTIONIST |

---

## وحدة Suppliers (الموردون)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/suppliers` | قائمة | ADMIN, RECEPTIONIST, STYLIST |
| GET | `/api/suppliers/:id` | تفاصيل | ADMIN, RECEPTIONIST, STYLIST |
| POST | `/api/suppliers` | إنشاء | ADMIN |
| PUT | `/api/suppliers/:id` | تعديل | ADMIN |
| DELETE | `/api/suppliers/:id` | حذف | ADMIN |

---

## وحدة Purchases (المشتريات)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/purchases` | قائمة أوامر الشراء | ADMIN, RECEPTIONIST |
| POST | `/api/purchases` | إنشاء أمر شراء | ADMIN |
| GET | `/api/purchases/:id` | تفاصيل | ADMIN, RECEPTIONIST |
| POST | `/api/purchases/:id/receive` | استلام الأمر (يرفع المخزون) | ADMIN |
| POST | `/api/purchases/:id/cancel` | إلغاء الأمر | ADMIN |

---

## وحدة Accounting (المحاسبة)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| POST | `/api/accounting/invoices` | إنشاء فاتورة (POS) | ADMIN, RECEPTIONIST |
| GET | `/api/accounting/invoices` | قائمة الفواتير | ADMIN, RECEPTIONIST |
| GET | `/api/accounting/invoices/:id` | تفاصيل فاتورة | ADMIN, RECEPTIONIST |
| POST | `/api/accounting/expenses` | إضافة مصروف | ADMIN |
| GET | `/api/accounting/expenses` | قائمة المصروفات | ADMIN, RECEPTIONIST |
| PUT | `/api/accounting/expenses/:id` | تعديل مصروف | ADMIN |
| DELETE | `/api/accounting/expenses/:id` | حذف مصروف | ADMIN |
| GET | `/api/accounting/summary` | ملخص (إيرادات/مصروفات/أرباح) | ADMIN, RECEPTIONIST |

---

## وحدة Reports (التقارير)

جميعها بـ `auth` + صلاحية `reports.read`، وتقبل فلاتر `from`, `to`, `groupBy` بالإضافة إلى `branchId` الاختياري (تصفية حسب الفرع):

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/reports/sales` | المبيعات مجمعة |
| GET | `/api/reports/top-services` | أكثر الخدمات مبيعاً |
| GET | `/api/reports/top-clients` | أكثر العملاء إنفاقاً |
| GET | `/api/reports/employee-performance` | إنتاجية الموظفات |
| GET | `/api/reports/expenses` | المصروفات |
| GET | `/api/reports/summary` | الملخص العام |
| GET | `/api/reports/profit-loss` | الأرباح والخسائر |
| GET | `/api/reports/dashboard-analytics` | تحليلات لوحة التحكم |
| GET | `/api/reports/export` | تصدير Excel/PDF (`report`, `format=excel\|pdf`) |

---

## وحدة Loyalty (نقاط الولاء)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/loyalty/clients/:id/transactions` | سجل نقاط عميلة | مسجّل |
| POST | `/api/loyalty/clients/:id/adjust` | تعديل رصيد النقاط يدوياً | ADMIN |

---

## وحدة Offers (العروض)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/offers` | قائمة العروض | مسجّل |
| POST | `/api/offers/validate` | التحقق من كود العرض | مسجّل |
| POST | `/api/offers` | إنشاء عرض | ADMIN |
| PUT | `/api/offers/:id` | تعديل عرض | ADMIN |
| DELETE | `/api/offers/:id` | حذف عرض | ADMIN |

---

## وحدة Users (المستخدمون والصلاحيات)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/users/permissions` | تعريفات الصلاحيات المتاحة | ADMIN |
| GET | `/api/users` | قائمة المستخدمين | ADMIN |
| POST | `/api/users` | إنشاء مستخدم | ADMIN |
| PUT | `/api/users/:id` | تعديل مستخدم/صلاحيات | ADMIN |

---

## وحدة Notifications (الإشعارات)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| POST | `/api/notifications/whatsapp` | إرسال رسالة واتساب | `notifications`, `pos` |
| POST | `/api/notifications/campaign` | إرسال حملة تسويقية للعملاء | `campaigns`, `notifications` |
| POST | `/api/notifications/test` | إرسال رسالة اختبار واتساب | `notifications` |
| POST | `/api/notifications/:id/retry` | إعادة محاولة إرسال إشعار فاشل | `notifications` |
| GET | `/api/notifications/schedule` | حالة جدولة تذكيرات واتساب | `notifications` |
| GET | `/api/notifications` | قائمة الإشعارات | `notifications` |

---

## وحدة Settings (الإعدادات)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| GET | `/api/settings` | قراءة الإعدادات (مدمجة مع الافتراضية + التسميات) | مسجّل |
| PUT | `/api/settings` | تعديل الإعدادات `{ "values": { key: value } }` | ADMIN |

المفاتيح المعروفة: `VAT_RATE`, `LOYALTY_POINTS_PER_CURRENCY`, `LOYALTY_POINT_VALUE`, `SALON_NAME_AR`, `SALON_NAME_EN`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_ENABLED`, `PAYMENT_METHOD`, `PAYMENT_API_KEY`, `PAYMENT_PUBLIC_KEY`, `ZATCA_VAT_NUMBER`, `ZATCA_ENV`. أي مفتاح خارجها يُتجاهل.

---

## وحدة Backup (النسخ الاحتياطي)

جميعها بـ `auth` + صلاحية `backup`. التصدير (`export-*`) يُرجع الملف للتنزيل (مع `Content-Disposition`):

| الطريقة | المسار | الوصف | نوع المحتوى |
|---------|--------|-------|-------------|
| GET | `/api/backup/export-json` | نسخة JSON كاملة لكل الجداول | `application/json` |
| GET | `/api/backup/export-sql` | تفريغ pg_dump | `application/sql` |
| GET | `/api/backup/export-csv` | CSVs للجداول الرئيسية في ملف واحد | `text/csv` |
| GET | `/api/backup/schedule` | حالة جدولة النسخ (cron, مجلد, أيام الاحتفاظ) | `application/json` |
| POST | `/api/backup/trigger` | تشغيل نسخة احتياطية فوراً | `application/json` |

أسماء الملفات: `saloon-backup-YYYYMMDD-HHmm.json|sql|csv`.

### ملاحظات النسخ الاحتياطي
- تصدير **SQL** يتطلب أداة `pg_dump` مثبتة على الخادم وفي PATH، مع متغيرات `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` (من env). عند غياب الأداة يُرجع 500 برسالة واضحة.
- تصدير **JSON** يشمل كل الجداول (عملاء، مواعيد، حضور، مصروفات، فواتير، بنود فواتير، حركات ولاء، عروض، منتجات، أوامر شراء، بنودها، خدمات، إعدادات، ورديات، حركات مخزون، موردين، مستخدمين).
- تصدير **CSV** يشمل: العملاء، الفواتير، المنتجات، الخدمات — مفصولة بعناوين `# Table: <name>`.

---

## وحدة Branches (الفروع)

جميعها بـ `auth` + صلاحية `branches`:

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/branches` | قائمة الفروع |
| GET | `/api/branches/:id` | تفاصيل فرع |
| POST | `/api/branches` | إنشاء فرع |
| PUT | `/api/branches/:id` | تعديل فرع |
| DELETE | `/api/branches/:id` | حذف فرع (soft delete) |

---

## وحدة Payments (المدفوعات)

| الطريقة | المسار | الوصف | الأدوار |
|---------|--------|-------|---------|
| POST | `/api/payments` | إنشاء دفعة عبر بوابة دفع محاكاة (simulated gateway) | `payments` |
| GET | `/api/payments` | قائمة المدفوعات | `payments`, `accounting.read` |
| POST | `/api/payments/:id/refund` | استرداد (Refund) دفعة | `payments` |

---

## وحدة ZATCA (الفوترة الإلكترونية)

جميعها بـ `auth` + صلاحية `reports`:

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/api/zatca/setup` | تهيئة ZATCA |
| POST | `/api/zatca/csr` | توليد طلب CSR |
| GET | `/api/zatca/status` | حالة الفوترة الإلكترونية |
| GET | `/api/zatca/test` | اختبار الاتصال بـ ZATCA |
| GET | `/api/zatca/invoices/:id/xml` | XML الفاتورة (للأرشفة) |
| GET | `/api/zatca/invoices/:id/qr` | رمز QR للفاتورة |

---

## وحدة Memberships (العضويات)

جميعها بـ `auth` + صلاحية `memberships`:

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/memberships/plans` | قائمة الباقات |
| POST | `/api/memberships/plans` | إنشاء باقة |
| PUT | `/api/memberships/plans/:id` | تعديل باقة |
| DELETE | `/api/memberships/plans/:id` | حذف باقة |
| GET | `/api/memberships` | قائمة العضويات |
| POST | `/api/memberships/assign` | إسناد عضوية لعميلة |
| POST | `/api/memberships/:id/cancel` | إلغاء عضوية |

---

## وحدة Gift Cards (بطاقات الهدايا)

جميعها بـ `auth` + صلاحية `giftcards`:

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/giftcards` | قائمة بطاقات الهدايا |
| POST | `/api/giftcards` | إنشاء بطاقة هدية |
| PUT | `/api/giftcards/:id` | تعديل بطاقة |
| DELETE | `/api/giftcards/:id` | حذف بطاقة |
| GET | `/api/giftcards/lookup/:code` | الاستعلام عن بطاقة بالكود |