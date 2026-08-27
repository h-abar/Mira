import { Pool } from 'pg';
import { env } from './env';

export interface TenantRecord {
  id: number;
  slug: string;
  name: string;
  db_name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: Date;
}

const globalForMaster = globalThis as unknown as { masterPool?: Pool };

export const masterPool =
  globalForMaster.masterPool ??
  new Pool({
    connectionString: env.MASTER_DATABASE_URL,
    max: 5,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForMaster.masterPool = masterPool;
}

export async function ensureMasterSchema(): Promise<void> {
  // 1) Make sure the master database itself exists.
  try {
    const url = new URL(env.MASTER_DATABASE_URL);
    const dbName = url.pathname.replace(/^\//, '');
    url.pathname = '/postgres';
    const { Client } = await import('pg');
    const client = new Client({ connectionString: url.toString() });
    await client.connect();
    try {
      const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
      if (exists.rowCount === 0 && dbName !== '') {
        await client.query(`CREATE DATABASE "${dbName}"`);
      }
    } finally {
      await client.end();
    }
  } catch {
    // If we cannot reach Postgres at all, let the table creation below fail loudly.
  }

  // 2) Create the registry table.
  await masterPool.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      db_name TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function mapRow(row: any): TenantRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    db_name: row.db_name,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function listTenants(): Promise<TenantRecord[]> {
  const { rows } = await masterPool.query('SELECT * FROM tenants ORDER BY id');
  return rows.map(mapRow);
}

export async function findTenantBySlug(slug: string): Promise<TenantRecord | null> {
  const { rows } = await masterPool.query('SELECT * FROM tenants WHERE slug = $1', [slug]);
  return rows.length > 0 ? mapRow(rows[0]) : null;
}

export async function insertTenant(t: {
  slug: string;
  name: string;
  dbName: string;
}): Promise<TenantRecord> {
  const { rows } = await masterPool.query(
    'INSERT INTO tenants (slug, name, db_name) VALUES ($1, $2, $3) RETURNING *',
    [t.slug, t.name, t.dbName],
  );
  return mapRow(rows[0]);
}

export async function updateTenantStatus(
  slug: string,
  status: 'ACTIVE' | 'SUSPENDED',
): Promise<TenantRecord | null> {
  const { rows } = await masterPool.query(
    'UPDATE tenants SET status = $2 WHERE slug = $1 RETURNING *',
    [slug, status],
  );
  return rows.length > 0 ? mapRow(rows[0]) : null;
}
