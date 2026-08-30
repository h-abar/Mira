import { execFile } from 'child_process';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { masterPool, insertTenant, listTenants, findTenantBySlug, updateTenantStatus } from '../../config/master';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';

export interface CreateTenantInput {
  slug: string;
  name: string;
  adminUsername?: string;
  adminPassword?: string;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

function tenantDbName(slug: string): string {
  return `${env.TENANT_DB_PREFIX}${slug}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

function parsePgUrl(): { host: string; port: number; user: string; password: string; database: string } {
  const url = new URL(env.DATABASE_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  };
}

async function createDatabase(dbName: string): Promise<void> {
  const cfg = parsePgUrl();
  const adminUrl = `postgresql://${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.password)}@${cfg.host}:${cfg.port}/postgres`;
  const { Client } = await import('pg');
  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      // Identifier cannot be parameterized; dbName is sanitized above.
      await client.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await client.end();
  }
}

function runPrisma(command: 'db push', dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cfg = parsePgUrl();
    const dbUrl = `postgresql://${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.password)}@${cfg.host}:${cfg.port}/${dbName}`;
    const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma');
    const isWindows = process.platform === 'win32';
    // Windows requires spawning .cmd shims through the shell (Node >= 18.20 EINVAL fix).
    const fullCommand = `npx prisma ${command} --schema "${schemaPath}" --skip-generate --accept-data-loss`;

    execFile(
      isWindows ? 'cmd.exe' : 'npx',
      isWindows ? ['/d', '/s', '/c', fullCommand] : [command.split(' ')[0], command.split(' ')[1], '--schema', schemaPath],
      {
        env: { ...process.env, DATABASE_URL: dbUrl },
        cwd: path.resolve(__dirname, '../../..'),
        timeout: 300_000,
        windowsHide: true,
        windowsVerbatimArguments: isWindows,
      },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`prisma ${command} failed: ${stderr || error.message}`));
          return;
        }
        resolve();
      },
    );
  });
}

async function seedTenantData(dbName: string, adminUsername: string, adminPassword: string): Promise<void> {
  const cfg = parsePgUrl();
  const dbUrl = `postgresql://${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.password)}@${cfg.host}:${cfg.port}/${dbName}`;
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { username: adminUsername },
      update: {},
      create: { username: adminUsername, passwordHash, role: 'ADMIN' },
    });

    if ((await prisma.branch.count()) === 0) {
      await prisma.branch.create({
        data: { nameAr: 'الفرع الرئيسي', nameEn: 'Main Branch' },
      });
    }

    const defaultSettings: { key: string; value: string }[] = [
      { key: 'VAT_RATE', value: '15' },
      { key: 'LOYALTY_POINTS_PER_CURRENCY', value: '1' },
      { key: 'LOYALTY_POINT_VALUE', value: '0.10' },
      { key: 'CLOSED_DAYS', value: '' },
      { key: 'SERVICES_CATEGORIES', value: 'HAIR,STYLING,SKIN,NAILS' },
      ...['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'].flatMap((d) => [
        { key: `${d}_OPENING`, value: '10:00' },
        { key: `${d}_CLOSING`, value: '21:00' },
      ]),
    ];
    for (const setting of defaultSettings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

export async function createTenant(input: CreateTenantInput): Promise<{ slug: string; name: string; dbName: string }> {
  const slug = input.slug.trim().toLowerCase();
  const name = input.name.trim();

  if (!SLUG_RE.test(slug)) {
    throw new ApiError(400, 'Slug must be 3-40 chars: lowercase letters, numbers and hyphens.');
  }
  if (name.length < 2) {
    throw new ApiError(400, 'Workspace name is too short.');
  }
  if (slug === env.DEFAULT_TENANT || (await findTenantBySlug(slug))) {
    throw new ApiError(409, `Workspace '${slug}' already exists.`);
  }

  const dbName = tenantDbName(slug);

  // 1) Create the physical database
  await createDatabase(dbName);

  // 2) Apply the full schema
  await runPrisma('db push', dbName);

  // 3) Seed admin user + defaults — require a strong password
  const adminUsername = (input.adminUsername ?? 'admin').trim().toLowerCase();
  const adminPassword = input.adminPassword;
  if (!adminPassword || adminPassword.length < 8) {
    throw new ApiError(400, 'A strong admin password (min 8 characters) is required when creating a workspace.');
  }
  await seedTenantData(dbName, adminUsername, adminPassword);

  // 4) Register in the master registry
  await insertTenant({ slug, name, dbName });

  return { slug, name, dbName };
}

export async function getTenantList() {
  return listTenants();
}

export async function setTenantStatus(slug: string, status: 'ACTIVE' | 'SUSPENDED') {
  const tenant = await findTenantBySlug(slug);
  if (!tenant) throw new ApiError(404, `Workspace '${slug}' not found.`);
  if (slug === env.DEFAULT_TENANT) {
    throw new ApiError(400, 'The default workspace cannot be suspended.');
  }
  await updateTenantStatus(slug, status);
  // Close cached connections so suspension takes effect immediately.
  const { closeTenantClients } = await import('../../config/database');
  closeTenantClients();
  return { ...tenant, status };
}

export async function pingMaster(): Promise<boolean> {
  try {
    await masterPool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
