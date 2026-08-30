import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function getNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Require a critical environment variable. The server refuses to start
 * if it is missing — no insecure fallbacks for secrets or DB credentials.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    console.error('The server cannot start without it. Set it in your .env file or deployment environment.');
    process.exit(1);
  }
  return value;
}

/**
 * Optional environment variable with a safe non-secret fallback.
 * Used for non-sensitive configuration only.
 */
function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

const isProduction = process.env.NODE_ENV === 'production';

// In production, secrets and DB URLs MUST be provided via environment.
// In development, we allow fallbacks for local convenience only.
const JWT_SECRET = isProduction
  ? requireEnv('JWT_SECRET')
  : optionalEnv('JWT_SECRET', 'dev-only-secret-change-in-production');

const DATABASE_URL = isProduction
  ? requireEnv('DATABASE_URL')
  : optionalEnv('DATABASE_URL', 'postgresql://saloon:saloon@localhost:5432/saloon');

const MASTER_DATABASE_URL = isProduction
  ? requireEnv('MASTER_DATABASE_URL')
  : optionalEnv('MASTER_DATABASE_URL', 'postgresql://saloon:saloon@localhost:5432/mira_master');

const PLATFORM_ADMIN_PASSWORD = isProduction
  ? requireEnv('PLATFORM_ADMIN_PASSWORD')
  : optionalEnv('PLATFORM_ADMIN_PASSWORD', 'platform123');

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '7d'),
  PORT: getNumber(process.env.PORT, 4000),
  // CORS: must be an explicit allow-list in production; dev allows localhost
  CORS_ORIGIN: isProduction
    ? requireEnv('CORS_ORIGIN')
    : optionalEnv('CORS_ORIGIN', '*'),
  WHATSAPP_TOKEN: optionalEnv('WHATSAPP_TOKEN', ''),
  WHATSAPP_PHONE_ID: optionalEnv('WHATSAPP_PHONE_ID', ''),
  PG_HOST: optionalEnv('PG_HOST', 'localhost'),
  PG_PORT: optionalEnv('PG_PORT', '5432'),
  PG_USER: optionalEnv('PG_USER', 'saloon'),
  PG_PASSWORD: optionalEnv('PG_PASSWORD', 'saloon'),
  PG_DATABASE: optionalEnv('PG_DATABASE', 'saloon'),

  // Automated backup scheduling
  BACKUP_CRON: optionalEnv('BACKUP_CRON', '0 2 * * *'),
  BACKUP_DIR: optionalEnv('BACKUP_DIR', './backups'),
  BACKUP_RETENTION_DAYS: getNumber(process.env.BACKUP_RETENTION_DAYS, 30),

  // WhatsApp reminder scheduling
  REMINDER_ENABLED: process.env.REMINDER_ENABLED !== 'false',
  REMINDER_CRON: optionalEnv('REMINDER_CRON', '0 20 * * *'),
  REMINDER_HOURS_BEFORE: getNumber(process.env.REMINDER_HOURS_BEFORE, 24),

  // ZATCA e-invoicing
  ZATCA_ENV: optionalEnv('ZATCA_ENV', 'sandbox') as 'sandbox' | 'production',
  ZATCA_VAT_NUMBER: optionalEnv('ZATCA_VAT_NUMBER', ''),

  // Multi-tenancy
  MASTER_DATABASE_URL,
  DEFAULT_TENANT: optionalEnv('DEFAULT_TENANT', 'default'),
  TENANT_DB_PREFIX: optionalEnv('TENANT_DB_PREFIX', 'mira_tenant_'),
  PLATFORM_ADMIN_USERNAME: optionalEnv('PLATFORM_ADMIN_USERNAME', 'platform'),
  PLATFORM_ADMIN_PASSWORD,
} as const;
