import { execFile } from 'child_process';
import type { Response } from 'express';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { buildTenantDbName } from '../../config/database';
import { findTenantBySlug } from '../../config/master';
import { getTenantSlug } from '../../multi-tenancy/tenantContext';
import { ApiError } from '../../utils/ApiError';

const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const cell = (value: unknown): unknown =>
  value instanceof Date ? value.toISOString() : value;

const toCsv = (headers: string[], rows: Array<Record<string, unknown>>): string => {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(cell(row[header]))).join(','));
  }
  return lines.join('\r\n');
};

async function exportJson() {
  const [
    clients,
    appointments,
    attendance,
    expenses,
    invoices,
    invoiceItems,
    loyaltyTransactions,
    offers,
    products,
    purchaseOrders,
    purchaseOrderItems,
    services,
    settings,
    shiftSessions,
    stockMovements,
    suppliers,
    users,
    membershipPlans,
    clientMemberships,
    giftCards,
    notifications,
  ] = await Promise.all([
    prisma.client.findMany(),
    prisma.appointment.findMany(),
    prisma.attendance.findMany(),
    prisma.expense.findMany(),
    prisma.invoice.findMany(),
    prisma.invoiceItem.findMany(),
    prisma.loyaltyTransaction.findMany(),
    prisma.offer.findMany(),
    prisma.product.findMany(),
    prisma.purchaseOrder.findMany(),
    prisma.purchaseOrderItem.findMany(),
    prisma.service.findMany(),
    prisma.setting.findMany().then((allSettings) =>
      // Exclude sensitive integration keys/secrets from backups
      allSettings.filter((s) => !['ZATCA_PRIVATE_KEY', 'ZATCA_CERTIFICATE', 'WHATSAPP_TOKEN', 'PAYMENT_API_KEY', 'PAYMENT_PUBLIC_KEY'].includes(s.key)),
    ),
    prisma.shiftSession.findMany(),
    prisma.stockMovement.findMany(),
    prisma.supplier.findMany(),
    prisma.user.findMany({
      // Never expose passwordHash in backups
      select: {
        id: true,
        username: true,
        role: true,
        permissions: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.membershipPlan.findMany(),
    prisma.clientMembership.findMany(),
    prisma.giftCard.findMany(),
    prisma.notification.findMany(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    app: 'saloon',
    data: {
      clients,
      appointments,
      attendance,
      expenses,
      invoices,
      invoiceItems,
      loyaltyTransactions,
      offers,
      products,
      purchaseOrders,
      purchaseOrderItems,
      services,
      settings,
      shiftSessions,
      stockMovements,
      suppliers,
      users,
      membershipPlans,
      clientMemberships,
      giftCards,
      notifications,
    },
  };
}

async function exportCsv() {
  const [clients, invoices, products, services, giftCards] = await Promise.all([
    prisma.client.findMany(),
    prisma.invoice.findMany(),
    prisma.product.findMany(),
    prisma.service.findMany(),
    prisma.giftCard.findMany(),
  ]);

  const sections: string[] = [];

  sections.push('# Table: clients');
  sections.push(
    toCsv(
      ['id', 'name', 'phone', 'whatsapp', 'email', 'birthdate', 'notes', 'totalSpent', 'loyaltyPoints', 'createdAt'],
      clients.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        whatsapp: row.whatsapp,
        email: row.email,
        birthdate: row.birthdate,
        notes: row.notes,
        totalSpent: row.totalSpent,
        loyaltyPoints: row.loyaltyPoints,
        createdAt: row.createdAt,
      })),
    ),
  );

  sections.push('# Table: invoices');
  sections.push(
    toCsv(
      ['id', 'invoiceNo', 'clientId', 'employeeId', 'shiftSessionId', 'date', 'subtotal', 'discount', 'tax', 'total', 'offerCode', 'pointsEarned', 'pointsRedeemed', 'paymentMethod', 'status', 'createdAt'],
      invoices.map((row) => ({
        id: row.id,
        invoiceNo: row.invoiceNo,
        clientId: row.clientId,
        employeeId: row.employeeId,
        shiftSessionId: row.shiftSessionId,
        date: row.date,
        subtotal: row.subtotal,
        discount: row.discount,
        tax: row.tax,
        total: row.total,
        offerCode: row.offerCode,
        pointsEarned: row.pointsEarned,
        pointsRedeemed: row.pointsRedeemed,
        paymentMethod: row.paymentMethod,
        status: row.status,
        createdAt: row.createdAt,
      })),
    ),
  );

  sections.push('# Table: products');
  sections.push(
    toCsv(
      ['id', 'nameAr', 'nameEn', 'barcode', 'category', 'quantity', 'unit', 'costPrice', 'salePrice', 'minStock', 'supplier', 'supplierId'],
      products.map((row) => ({
        id: row.id,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        barcode: row.barcode,
        category: row.category,
        quantity: row.quantity,
        unit: row.unit,
        costPrice: row.costPrice,
        salePrice: row.salePrice,
        minStock: row.minStock,
        supplier: row.supplier,
        supplierId: row.supplierId,
      })),
    ),
  );

  sections.push('# Table: services');
  sections.push(
    toCsv(
      ['id', 'nameAr', 'nameEn', 'category', 'price', 'durationMinutes', 'cost', 'isActive'],
      services.map((row) => ({
        id: row.id,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        category: row.category,
        price: row.price,
        durationMinutes: row.durationMinutes,
        cost: row.cost,
        isActive: row.isActive,
      })),
    ),
  );

  sections.push('# Table: giftCards');
  sections.push(
    toCsv(
      ['id', 'code', 'balance', 'status', 'clientId', 'expiresAt', 'createdAt'],
      giftCards.map((row) => ({
        id: row.id,
        code: row.code,
        balance: row.balance,
        status: row.status,
        clientId: row.clientId,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
      })),
    ),
  );

  return sections.join('\r\n\r\n');
}

async function currentTenantDbName(): Promise<string> {
  const slug = getTenantSlug();
  if (!slug || slug === env.DEFAULT_TENANT) return env.PG_DATABASE;
  const record = await findTenantBySlug(slug);
  return record?.db_name ?? buildTenantDbName(slug);
}

function exportSql(res: Response): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    void (async () => {
      let dbName: string;
      try {
        dbName = await currentTenantDbName();
      } catch (err) {
        reject(err instanceof ApiError ? err : new ApiError(500, 'Failed to resolve workspace database.'));
        return;
      }

      const child = execFile(
        'pg_dump',
        [
          '--host', env.PG_HOST,
          '--port', env.PG_PORT,
          '--username', env.PG_USER,
          '--dbname', dbName,
          '--no-owner',
          '--no-privileges',
          '--format', 'plain',
        ],
        {
          env: { ...process.env, PGPASSWORD: env.PG_PASSWORD },
        },
      );

    if (child.stdout) {
      child.stdout.pipe(res);
    } else {
      reject(new ApiError(500, 'pg_dump did not produce output.'));
      return;
    }

    child.on('error', (err) => {
      reject(
        new ApiError(
          500,
          `pg_dump failed to start: ${err.message}. تأكد من تثبيت PostgreSQL وأن أداة pg_dump متوفرة في PATH.`,
        ),
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        res.end();
        resolve();
      } else {
        reject(new ApiError(500, `pg_dump exited with code ${code}.`));
      }
    });
    })();
  });
}

export const backupService = {
  exportJson,
  exportCsv,
  exportSql,
};
