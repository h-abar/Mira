import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('admin1234', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${admin.username}`);

  if ((await prisma.employee.count()) === 0) {
    await prisma.employee.createMany({
      data: [
        {
          nameAr: 'ليلى',
          nameEn: 'Layla',
          phone: '01000000001',
          role: 'STYLIST',
          commissionRate: 30,
          hireDate: new Date('2024-01-01'),
        },
        {
          nameAr: 'سارة',
          nameEn: 'Sara',
          phone: '01000000002',
          role: 'BEAUTICIAN',
          commissionRate: 25,
          hireDate: new Date('2024-03-15'),
        },
        {
          nameAr: 'مريم',
          nameEn: 'Maryam',
          phone: '01000000003',
          role: 'RECEPTIONIST',
          commissionRate: 0,
          hireDate: new Date('2024-06-01'),
        },
      ],
    });
    console.log('Created sample employees');
  }

  if ((await prisma.service.count()) === 0) {
    await prisma.service.createMany({
      data: [
        { nameAr: 'قص شعر', nameEn: 'Haircut', category: 'HAIR', price: 15, durationMinutes: 45, cost: 2 },
        { nameAr: 'صبغة شعر', nameEn: 'Hair Coloring', category: 'HAIR', price: 35, durationMinutes: 90, cost: 8 },
        { nameAr: 'تسريحة سهرة', nameEn: 'Evening Styling', category: 'STYLING', price: 25, durationMinutes: 60, cost: 5 },
        { nameAr: 'عناية بالبشرة', nameEn: 'Facial Treatment', category: 'SKIN', price: 20, durationMinutes: 50, cost: 6 },
      ],
    });
    console.log('Created sample services');
  }

  if ((await prisma.client.count()) === 0) {
    await prisma.client.create({
      data: {
        name: 'أميرة',
        phone: '01000000000',
        whatsapp: '01000000000',
        email: 'amira@example.com',
        notes: 'عميلة جديدة',
      },
    });
    console.log('Created sample client');
  }

  if ((await prisma.branch.count()) === 0) {
    await prisma.branch.create({
      data: {
        nameAr: 'الفرع الرئيسي',
        nameEn: 'Main Branch',
        address: 'المدينة — الشارع الرئيسي',
        phone: '+966500000000',
      },
    });
    console.log('Created default branch');
  }

  if ((await prisma.product.count()) === 0) {
    const branch = await prisma.branch.findFirst();
    const branchId = branch ? branch.id : undefined;
    await prisma.product.createMany({
      data: [
        { nameAr: 'قهوة عربية', nameEn: 'Arabic Coffee', barcode: '1001', category: 'cafeteria', quantity: 50, unit: 'pcs', costPrice: 2, salePrice: 5, minStock: 5, branchId },
        { nameAr: 'شاي', nameEn: 'Tea', barcode: '1002', category: 'cafeteria', quantity: 50, unit: 'pcs', costPrice: 1, salePrice: 3, minStock: 5, branchId },
        { nameAr: 'عصير برتقال', nameEn: 'Orange Juice', barcode: '1003', category: 'cafeteria', quantity: 50, unit: 'pcs', costPrice: 3, salePrice: 7, minStock: 5, branchId },
        { nameAr: 'موهيتو', nameEn: 'Mojito', barcode: '1004', category: 'cafeteria', quantity: 50, unit: 'pcs', costPrice: 4, salePrice: 10, minStock: 5, branchId },
        { nameAr: 'ماء', nameEn: 'Water', barcode: '1005', category: 'cafeteria', quantity: 50, unit: 'pcs', costPrice: 0.5, salePrice: 1, minStock: 5, branchId },
        { nameAr: 'شامبو', nameEn: 'Shampoo', barcode: '2001', category: 'COSMETICS', quantity: 50, unit: 'pcs', costPrice: 15, salePrice: 25, minStock: 5, branchId },
        { nameAr: 'كريم مرطب', nameEn: 'Moisturizer', barcode: '2002', category: 'COSMETICS', quantity: 50, unit: 'pcs', costPrice: 25, salePrice: 40, minStock: 5, branchId },
      ],
    });
    console.log('Created sample products');
  }

  if ((await prisma.membershipPlan.count()) === 0) {
    await prisma.membershipPlan.createMany({
      data: [
        { nameAr: 'ذهبية', nameEn: 'Gold', price: 150, durationDays: 30, serviceIds: [], isActive: true },
        { nameAr: 'بلاتينية', nameEn: 'Platinum', price: 300, durationDays: 90, serviceIds: [], isActive: true },
      ],
    });
    console.log('Created sample membership plans');
  }

  if ((await prisma.giftCard.count()) === 0) {
    await prisma.giftCard.createMany({
      data: [
        { code: 'MIRA-1001-2024', balance: 100, initialValue: 100, status: 'ACTIVE' },
        { code: 'MIRA-1002-2024', balance: 200, initialValue: 200, status: 'ACTIVE' },
      ],
    });
    console.log('Created sample gift cards');
  }

  const defaultSettings: { key: string; value: string }[] = [
    { key: 'VAT_RATE', value: '15' },
    { key: 'LOYALTY_POINTS_PER_CURRENCY', value: '1' },
    { key: 'LOYALTY_POINT_VALUE', value: '0.10' },
    { key: 'SALON_NAME_AR', value: 'ميرا' },
    { key: 'SALON_NAME_EN', value: 'Mira' },
    { key: 'WELCOME_MESSAGE', value: 'شكرًا لزيارتكم! نتمنى لكم يوماً سعيداً' },
    { key: 'SALON_POLICY', value: '' },
    { key: 'SERVICES_CATEGORIES', value: 'HAIR,STYLING,SKIN,NAILS' },
    { key: 'CLOSED_DAYS', value: '' },
    ...['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'].flatMap((d) => [
      { key: `${d}_OPENING`, value: '10:00' },
      { key: `${d}_CLOSING`, value: '21:00' },
    ]),
  ];
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('Upserted default settings');

  console.log('Seed completed successfully');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
