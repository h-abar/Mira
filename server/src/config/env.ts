import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function getNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL:
    process.env.DATABASE_URL ?? 'postgresql://saloon:saloon@localhost:5432/saloon',
  JWT_SECRET: process.env.JWT_SECRET ?? 'saloon-super-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  PORT: getNumber(process.env.PORT, 4000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN ?? '',
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID ?? '',
  PG_HOST: process.env.PG_HOST ?? 'localhost',
  PG_PORT: process.env.PG_PORT ?? '5432',
  PG_USER: process.env.PG_USER ?? 'saloon',
  PG_PASSWORD: process.env.PG_PASSWORD ?? 'saloon',
  PG_DATABASE: process.env.PG_DATABASE ?? 'saloon',

  // Automated backup scheduling
  BACKUP_CRON: process.env.BACKUP_CRON ?? '0 2 * * *', // daily at 2 AM
  BACKUP_DIR: process.env.BACKUP_DIR ?? './backups',
  BACKUP_RETENTION_DAYS: getNumber(process.env.BACKUP_RETENTION_DAYS, 30),

  // WhatsApp reminder scheduling
  REMINDER_ENABLED: process.env.REMINDER_ENABLED !== 'false',
  REMINDER_CRON: process.env.REMINDER_CRON ?? '0 20 * * *', // daily at 8 PM
  REMINDER_HOURS_BEFORE: getNumber(process.env.REMINDER_HOURS_BEFORE, 24),

  // ZATCA e-invoicing
  ZATCA_ENV: (process.env.ZATCA_ENV ?? 'sandbox') as 'sandbox' | 'production',
  ZATCA_VAT_NUMBER: process.env.ZATCA_VAT_NUMBER ?? '',

  // Multi-tenancy
  MASTER_DATABASE_URL:
    process.env.MASTER_DATABASE_URL ??
    'postgresql://saloon:saloon@localhost:5432/mira_master',
  DEFAULT_TENANT: process.env.DEFAULT_TENANT ?? 'default',
  TENANT_DB_PREFIX: process.env.TENANT_DB_PREFIX ?? 'mira_tenant_',
  PLATFORM_ADMIN_USERNAME: process.env.PLATFORM_ADMIN_USERNAME ?? 'platform',
  PLATFORM_ADMIN_PASSWORD: process.env.PLATFORM_ADMIN_PASSWORD ?? 'platform123',
} as const;