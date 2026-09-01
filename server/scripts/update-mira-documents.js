/**
 * Updates:
 *   - دليل-استخدام-نظام-ميرa-Mira.docx
 *   - باسوردات-النظام-Mira.xlsx
 *
 * Run: node scripts/update-mira-documents.js
 */
const ExcelJS = require('exceljs');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PRODUCTION_URL = 'https://mira-production-296a.up.railway.app';
const ADMIN_PASSWORD = 'admin1234';

function findRootFile(prefix, ext) {
  const all = fs.readdirSync(ROOT).filter((f) => f.endsWith(ext));
  return (
    all.find((f) => f.startsWith(prefix)) ||
    all.find((f) => f.startsWith(`d${prefix.substring(1)}`))
  );
}

function styleHeader(row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A1B9A' } };
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
}

function styleSheet(ws) {
  ws.views = [{ rightToLeft: true }];
  ws.eachRow((row) => {
    row.alignment = { vertical: 'top', wrapText: true };
  });
}

async function buildPasswordsWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mira Salon System';
  wb.created = new Date();

  // Sheet 1 — Program accounts
  const accounts = wb.addWorksheet('حسابات البرنامج');
  accounts.columns = [
    { header: 'رقم', key: 'no', width: 6 },
    { header: 'اسم المستخدم', key: 'username', width: 18 },
    { header: 'كلمة المرور', key: 'password', width: 18 },
    { header: 'الدور', key: 'role', width: 22 },
    { header: 'الموظف المرتبط', key: 'employee', width: 18 },
    { header: 'الحالة', key: 'status', width: 10 },
    { header: 'الصلاحيات / ملاحظات', key: 'notes', width: 55 },
  ];
  accounts.addRows([
    {
      no: 1,
      username: 'admin',
      password: ADMIN_PASSWORD,
      role: 'مدير (ADMIN)',
      employee: '—',
      status: 'نشط',
      notes: 'صلاحيات كاملة — غيّر كلمة المرور بعد أول دخول. يُنشأ تلقائياً عبر prisma:seed',
    },
    {
      no: 2,
      username: 'reception',
      password: 'pass123',
      role: 'استقبال (RECEPTIONIST)',
      employee: 'مريم (اختياري)',
      status: 'اختياري',
      notes: 'حساب تجريبي — أنشئه من «المستخدمون» إن رغبت. ليس في seed الافتراضي',
    },
    {
      no: 3,
      username: 'cashier',
      password: '(يُحدَّد عند الإنشاء)',
      role: 'كاشير / STYLIST',
      employee: 'ليلى (اختياري)',
      status: 'اختياري',
      notes: 'مثال صلاحيات: POS، مواعيد، عملاء، عروض، ولاء',
    },
  ]);
  styleHeader(accounts.getRow(1));
  styleSheet(accounts);

  // Sheet 2 — Database
  const db = wb.addWorksheet('قاعدة البيانات');
  db.columns = [
    { header: 'العنصر', key: 'item', width: 28 },
    { header: 'القيمة', key: 'value', width: 52 },
    { header: 'ملاحظات', key: 'notes', width: 44 },
  ];
  db.addRows([
    { item: 'مزوّد قاعدة البيانات', value: 'PostgreSQL', notes: 'قاعدة بيانات السالون' },
    { item: 'محلي — Host', value: 'localhost', notes: 'Docker / تطوير' },
    { item: 'محلي — Port', value: '5432', notes: 'منفذ PostgreSQL' },
    { item: 'محلي — Database', value: 'saloon', notes: '' },
    { item: 'محلي — User', value: 'saloon', notes: '' },
    { item: 'محلي — Password', value: 'saloon', notes: 'غيّرها قبل النشر' },
    {
      item: 'محلي — DATABASE_URL',
      value: 'postgresql://saloon:saloon@localhost:5432/saloon',
      notes: 'server/.env',
    },
    {
      item: 'إنتاج — Railway',
      value: '(من لوحة Railway → Variables)',
      notes: 'DATABASE_URL يُضبط تلقائياً على Railway',
    },
    { item: 'postgres (superuser)', value: 'postgres / postgres', notes: 'محلي فقط — غيّر كلمة المرور' },
    {
      item: 'النسخ الاحتياطي',
      value: 'مجدول يومياً 2:00 ص',
      notes: 'server/backups — احتفاظ 30 يوماً',
    },
  ]);
  styleHeader(db.getRow(1));
  styleSheet(db);

  // Sheet 3 — Server secrets
  const secrets = wb.addWorksheet('أسرار وإعدادات الخادم');
  secrets.columns = [
    { header: 'الإعداد', key: 'key', width: 28 },
    { header: 'القيمة / الموقع', key: 'value', width: 52 },
    { header: 'ملاحظات', key: 'notes', width: 44 },
  ];
  secrets.addRows([
    { key: 'واجهة الإنتاج', value: `${PRODUCTION_URL}/login`, notes: 'Railway — نشر تلقائي من GitHub main' },
    { key: 'واجهة محلية (Vite)', value: 'http://localhost:5173/login', notes: 'npm run dev في client/' },
    { key: 'واجهة Docker', value: 'http://localhost:8080/login', notes: 'docker compose' },
    { key: 'API محلي', value: 'http://localhost:4000', notes: 'npm run dev في server/' },
    { key: 'JWT_SECRET', value: 'saloon-dev-secret-please-change-in-production', notes: 'server/.env — غيّره في الإنتاج' },
    { key: 'JWT_EXPIRES_IN', value: '7d', notes: 'مدة الجلسة' },
    { key: 'CORS_ORIGIN (محلي)', value: 'http://localhost:5173', notes: '' },
    { key: 'CORS_ORIGIN (إنتاج)', value: PRODUCTION_URL, notes: 'أو * حسب إعداد Railway' },
    { key: 'NODE_ENV', value: 'production (Railway) / development (محلي)', notes: '' },
    { key: 'VAT (ZATCA)', value: '15%', notes: 'client/src/utils/zatcaQR.ts + الإعدادات' },
    { key: 'اسم البائع', value: 'ميرا / Mira', notes: 'من الإعدادات' },
    { key: 'بوابة الدفع', value: 'محاكاة SIMULATED', notes: 'Moyasar جاهز — يحتاج مفاتيح حقيقية' },
    { key: 'WhatsApp', value: 'محاكاة', notes: 'WHATSAPP_TOKEN + WHATSAPP_PHONE_ID في الإعدادات' },
    { key: 'ZATCA', value: 'sandbox / self-signed', notes: 'شهادة إنتاج رسمية مستقبلية' },
    { key: 'GitHub remotes', value: 'mozn1986/Mira + h-abar/Mira', notes: 'push إلى main ينشر على Railway' },
  ]);
  styleHeader(secrets.getRow(1));
  styleSheet(secrets);

  // Sheet 4 — Security instructions
  const security = wb.addWorksheet('تعليمات الأمان');
  security.getColumn(1).width = 110;
  const lines = [
    'تعليمات الأمان والوصول — محدّث سبتمبر 2026',
    '',
    `1) الدخول: ${PRODUCTION_URL}/login (إنتاج) أو http://localhost:5173/login (محلي).`,
    `2) المدير الافتراضي: admin / ${ADMIN_PASSWORD} — غيّره فوراً من «المستخدمون».`,
    '3) تغيير كلمة مرور مستخدم: من صفحة المستخدمون داخل النظام.',
    '4) تغيير كلمة مرور PostgreSQL: ALTER USER saloon WITH PASSWORD ... ثم حدّث DATABASE_URL في server/.env.',
    '5) تغيير JWT_SECRET: في server/.env ثم أعد تشغيل الخادم (تسجيل خروج للجميع).',
    '6) النسخ الاحتياطي: تلقائي يومياً + تنزيل يدوي من الإعدادات (JSON/SQL/CSV).',
    '7) قبل النشر: غيّر admin وJWT وDB، وفعّل ZATCA/دفع/واتساب الحقيقي عند الحاجة.',
    '8) هذا الملف حساس — احفظه في مكان آمن ولا تشاركه.',
    '',
    'روابط سريعة:',
    `• POS: ${PRODUCTION_URL}/admin/pos`,
    `• العضويات: ${PRODUCTION_URL}/admin/memberships`,
    `• العملاء: ${PRODUCTION_URL}/admin/clients`,
    `• بوابة العميلات: ${PRODUCTION_URL}/`,
    `• حجز موعد: ${PRODUCTION_URL}/booking`,
  ];
  lines.forEach((line, i) => {
    const row = security.getRow(i + 1);
    row.getCell(1).value = line;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    if (i === 0) row.font = { bold: true, size: 12 };
  });
  styleSheet(security);

  return wb;
}

/** Replace plain text inside Word XML w:t nodes */
function patchWordXml(xml) {
  const map = [
    ['admin123', ADMIN_PASSWORD],
    ['الإصدار 2026 - أغسطس', 'الإصدار 2026 - سبتمبر (محدّث)'],
    [
      'افتح المتصفح ثم اكتب عنوان النظام. إذا كان النظام مثبتًا على نفس جهاز الكاشير فالعنوان هو: http://localhost:5173 ، أما على أجهزة أخرى داخل نفس الشبكة',
      `افتح المتصفح واكتب عنوان النظام: الإنتاج ${PRODUCTION_URL}/login — محلي http://localhost:5173/login — Docker http://localhost:8080/login`,
    ],
    [
      'بيانات الدخول الافتراضية للنظام: اسم المستخدم admin وكلمة المرور admin1234 — يُرجى تغييرها فورًا من الإعدادات ثم المستخدمون.',
      `بيانات الدخول الافتراضية (بعد seed): admin / ${ADMIN_PASSWORD} — غيّرها فوراً من «المستخدمون».`,
    ],
    [
      'صفحة نقطة البيع هي الأكثر استخدامًا يوميًا. خطوات إتمام عملية بيع:',
      'صفحة نقطة البيع (/admin/pos) مقسّمة إلى ثلاثة أقسام: ① العميلة ② الدفع (موظفة، طريقة دفع، إكرامية، ضريبة) ③ الخصومات والولاء (تظهر بعد اختيار عميلة).',
    ],
    [
      'طبّق كود العرض أو الخصم إن وجد، أو استخدم بطاقة هدية لخصم قيمتها، أو أضف إكرامية للموظفة.',
      'في قسم «الخصومات والولاء»: خصم يدوي، كود عرض/كوبون، كود بطاقة هدايا، واستبدال نقاط الولاء. الإكرامية في قسم الدفع.',
    ],
    [
      'اختر طريقة الدفع ثم اضغط «تسجيل الفاتورة».',
      'أضف بنود الخدمات/المنتجات/الكافتيريا ثم اضغط «إتمام البيع» — تُطبَّق خصومات العضوية النشطة تلقائياً.',
    ],
    [
      'صفحة «العضويات»: إنشاء خطط العضوية (المدة، السعر، الخدمات المشمولة).',
      'صفحة «العضويات» (/admin/memberships): باقات بمدة وسعر وخصم، مع ربط اختياري بخدمات محددة (فارغ = كل الخدمات).',
    ],
    [
      'شراء عضوية لعميلة من ملفها أو من صفحة العضويات، وتُحسب مدة التفعيل تلقائيًا.',
      'تعيين عضوية: بحث عميلة بالاسم/الجوال، معاينة الباقة، منع التعيين إذا لديها عضوية نشطة، وفلترة العضويات حسب الباقة.',
    ],
    [
      'من صفحة «الإعدادات» يمكن التحكم في النظام كاملًا (تظهر للمدير فقط):',
      'من صفحة «الإعدادات» (/admin/settings) — كل قسم له زر حفظ مستقل (عام، ساعات العمل، تواصل، ولاء، ZATCA، مدفوعات، واتساب، نسخ احتياطي):',
    ],
    [
      '1) الدخول إلى البرنامج: افتح http://localhost:5173 وأدخل اسم المستخدم وكلمة المرور من ورقة «حسابات البرنامج».',
      `1) الدخول: ${PRODUCTION_URL}/login (إنتاج) أو http://localhost:5173/login (محلي).`,
    ],
    [
      '• الواجهة (المستخدم): http://localhost:5173',
      `• الواجهة (إنتاج): ${PRODUCTION_URL}`,
    ],
    [
      'بيانات الدخول للتجربة: admin / admin1234 (مدير)، reception / pass123 (موظفة استقبال).',
      `بيانات seed: admin / ${ADMIN_PASSWORD} (مدير). reception/pass123 حساب تجريبي اختياري — أنشئه من المستخدمون.`,
    ],
    [
      'حجز موعد: اختر الخدمة والموظفة واليوم → ستظهر الأوقات المتاحة → أدخل الاسم والهاتف → تأكيد.',
      'حجز موعد (/booking): الأوقات حسب دوام الصالون من الإعدادات → الاسم والجوال → تأكيد.',
    ],
  ];

  let out = xml;
  for (const [from, to] of map) {
    out = out.split(from).join(to);
  }

  // Word splits long sentences across multiple w:t nodes
  out = out.replace(
    '<w:t>افتح المتصفح ثم اكتب عنوان النظام. إذا كان النظام مثبتًا على نفس جهاز الكاشير فالعنوان هو</w:t>',
    `<w:t>عنوان الدخول — إنتاج: ${PRODUCTION_URL}/login — محلي:</w:t>`,
  );
  out = out.replace('<w:t>: http://localhost:5173</w:t>', '<w:t> http://localhost:5173/login</w:t>');
  out = out.replace(
    '<w:t>صفحة «العضويات»: إنشاء خطط العضوية (المدة، السعر، الخدمات المشمولة).</w:t>',
    '<w:t>صفحة «العضويات» (/admin/memberships): باقات + ربط اختياري بخدمات (فارغ = الكل).</w:t>',
  );
  out = out.replace(
    '<w:t>شراء عضوية لعميلة من ملفها أو من صفحة العضويات، وتُحسب مدة التفعيل تلقائيًا.</w:t>',
    '<w:t>تعيين عضوية: بحث بالاسم/الجوال، معاينة الباقة، منع التعيين إن وُجدت عضوية نشطة.</w:t>',
  );

  // Append update note before closing body if not present
  const marker = 'تحديثات سبتمبر 2026';
  if (!out.includes(marker)) {
    const insert = `<w:p><w:pPr><w:jc w:val="right"/><w:bidi/></w:pPr><w:r><w:rPr><w:bidi/><w:rtl/></w:rPr><w:t xml:space="preserve">${marker}: نشر Railway، POS بثلاثة أقسام، عضويات بربط خدمات، حفظ إعدادات لكل قسم، بحث حالة الحجز بالرمز/الجوال/الاسم.</w:t></w:r></w:p>`;
    out = out.replace('</w:body>', `${insert}</w:body>`);
  }

  // Membership lines (Word omits trailing period in some w:t nodes)
  out = out.replace(
    /(<w:t>)صفحة «العضويات»: إنشاء خطط العضوية \(المدة، السعر، الخدمات المشمولة\)\.?(<\/w:t>)/,
    '$1صفحة «العضويات» (/admin/memberships): باقات + ربط اختياري بخدمات (فارغ = الكل)$2',
  );
  out = out.replace(
    /(<w:t>)شراء عضوية لعميلة من ملفها أو من صفحة العضويات، وتُحسب مدة التفعيل تلقائيًا\.?(<\/w:t>)/,
    '$1تعيين عضوية: بحث بالاسم/الجوال، معاينة الباقة، منع التعيين إن وُجدت عضوية نشطة$2',
  );

  out = out.replace(
    /(<w:t>)صفحة نقطة البيع هي الأكثر استخدامًا يوميًا\. خطوات إتمام عملية بيع:?(<\/w:t>)/,
    '$1صفحة نقطة البيع (/admin/pos): ① العميلة ② الدفع ③ الخصومات والولاء (بعد اختيار عميلة)$2',
  );
  out = out.replace(
    /(<w:t>)طبّق كود العرض أو الخصم إن وجد، أو استخدم بطاقة هدية لخصم قيمتها، أو أضف إكرامية للموظفة\.?(<\/w:t>)/,
    '$1في «الخصومات والولاء»: خصم، كود عرض، بطاقة هدايا، نقاط ولاء. الإكرامية في قسم الدفع$2',
  );
  out = out.replace(
    /(<w:t>)اختر طريقة الدفع ثم اضغط «تسجيل الفاتورة»\.?(<\/w:t>)/,
    '$1أضف البنود ثم «إتمام البيع» — يُطبَّق خصم العضوية النشطة تلقائياً$2',
  );

  return out;
}

async function updateWordManual() {
  const fileName = findRootFile('دليل-استخدام', '.docx');
  if (!fileName) throw new Error('Word manual not found');
  const filePath = path.join(ROOT, fileName);
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const docKey = Object.keys(zip.files).find((k) => k.endsWith('document.xml'));
  let xml = await zip.file(docKey).async('string');
  xml = patchWordXml(xml);
  zip.file(docKey, xml);
  const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(filePath, out);
  console.log('Updated Word:', fileName);

  // Remove typo duplicate if exists
  const typo = findRootFile('dليل-استخدام', '.docx');
  if (typo) {
    fs.copyFileSync(filePath, path.join(ROOT, typo));
    console.log('Synced typo copy:', typo);
  }
}

async function main() {
  const xlsxName = findRootFile('باسوردات-النظام', '.xlsx');
  if (!xlsxName) throw new Error('Passwords Excel not found');
  const xlsxPath = path.join(ROOT, xlsxName);

  const wb = await buildPasswordsWorkbook();
  await wb.xlsx.writeFile(xlsxPath);
  console.log('Updated Excel:', xlsxName);

  await updateWordManual();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
