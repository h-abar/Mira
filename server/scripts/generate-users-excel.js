/**
 * Generates docs/بيانات-الدخول.xlsx — run: node scripts/generate-users-excel.js
 */
const path = require('path');
const ExcelJS = require('exceljs');

async function main() {
  const outPath = path.resolve(__dirname, '../../docs/بيانات-الدخول.xlsx');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Mira Salon System';
  wb.created = new Date();

  const ws = wb.addWorksheet('المستخدمون', {
    views: [{ rightToLeft: true }],
  });

  ws.columns = [
    { header: 'البيئة', key: 'env', width: 16 },
    { header: 'رابط الدخول', key: 'url', width: 52 },
    { header: 'اسم المستخدم', key: 'username', width: 18 },
    { header: 'كلمة المرور', key: 'password', width: 18 },
    { header: 'الدور', key: 'role', width: 14 },
    { header: 'ملاحظات', key: 'notes', width: 44 },
  ];

  ws.addRows([
    {
      env: 'إنتاج (Railway)',
      url: 'https://mira-production-296a.up.railway.app/login',
      username: 'admin',
      password: 'admin1234',
      role: 'ADMIN',
      notes: 'حساب المدير الافتراضي — غيّر كلمة المرور بعد أول دخول',
    },
    {
      env: 'تطوير محلي',
      url: 'http://localhost:5173/login',
      username: 'admin',
      password: 'admin1234',
      role: 'ADMIN',
      notes: 'بعد تشغيل seed: cd server && npm run prisma:seed',
    },
    {
      env: 'Docker',
      url: 'http://localhost:8080/login',
      username: 'admin',
      password: 'admin1234',
      role: 'ADMIN',
      notes: 'بعد docker compose exec app npx prisma db seed',
    },
  ]);

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A1B9A' } };
  header.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'middle', wrapText: true };
    }
  });

  const links = wb.addWorksheet('روابط سريعة', { views: [{ rightToLeft: true }] });
  links.columns = [
    { header: 'الصفحة', key: 'page', width: 28 },
    { header: 'الرابط (إنتاج)', key: 'url', width: 55 },
  ];
  links.addRows([
    { page: 'تسجيل الدخول', url: 'https://mira-production-296a.up.railway.app/login' },
    { page: 'لوحة التحكم', url: 'https://mira-production-296a.up.railway.app/admin' },
    { page: 'نقطة البيع', url: 'https://mira-production-296a.up.railway.app/admin/pos' },
    { page: 'العضويات والباقات', url: 'https://mira-production-296a.up.railway.app/admin/memberships' },
    { page: 'العملاء', url: 'https://mira-production-296a.up.railway.app/admin/clients' },
    { page: 'المواعيد', url: 'https://mira-production-296a.up.railway.app/admin/appointments' },
    { page: 'بوابة العميلات', url: 'https://mira-production-296a.up.railway.app/' },
    { page: 'حجز موعد', url: 'https://mira-production-296a.up.railway.app/booking' },
  ]);
  links.getRow(1).font = { bold: true };

  await wb.xlsx.writeFile(outPath);
  console.log('Written:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
