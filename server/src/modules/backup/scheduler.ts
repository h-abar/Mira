import cron from 'node-cron';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';
import { backupService } from './backup.service';

let scheduledTask: cron.ScheduledTask | null = null;
let lastRunAt: string | null = null;
let lastRunStatus: 'success' | 'failed' | null = null;
let lastRunError: string | null = null;

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
}

function ensureBackupDir(): string {
  const dir = path.resolve(env.BACKUP_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function cleanOldBackups(dir: string): void {
  try {
    const cutoff = Date.now() - env.BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.startsWith('mira-backup-')) continue;
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        console.log(`[backup-scheduler] Deleted old backup: ${file}`);
      }
    }
  } catch (err) {
    console.error('[backup-scheduler] Failed to clean old backups:', err);
  }
}

function runPgDump(dir: string, ts: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const outPath = path.join(dir, `mira-backup-${ts}.sql`);
    const outStream = fs.createWriteStream(outPath);

    const child = execFile(
      'pg_dump',
      [
        '--host', env.PG_HOST,
        '--port', env.PG_PORT,
        '--username', env.PG_USER,
        '--dbname', env.PG_DATABASE,
        '--no-owner',
        '--no-privileges',
        '--format', 'plain',
      ],
      { env: { ...process.env, PGPASSWORD: env.PG_PASSWORD } },
    );

    if (child.stdout) {
      child.stdout.pipe(outStream);
    }

    child.on('error', (err) => {
      outStream.destroy();
      console.error(`[backup-scheduler] pg_dump failed to start: ${err.message}`);
      reject(err);
    });

    child.on('close', (code) => {
      outStream.end();
      if (code === 0) {
        console.log(`[backup-scheduler] SQL backup saved: ${outPath}`);
        resolve();
      } else {
        reject(new Error(`pg_dump exited with code ${code}`));
      }
    });
  });
}

async function runJsonBackup(dir: string, ts: string): Promise<void> {
  try {
    const data = await backupService.exportJson();
    const outPath = path.join(dir, `mira-backup-${ts}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[backup-scheduler] JSON backup saved: ${outPath}`);
  } catch (err) {
    console.error('[backup-scheduler] JSON backup failed:', err);
    throw err;
  }
}

async function runScheduledBackup(): Promise<void> {
  const ts = stamp();
  const dir = ensureBackupDir();

  console.log(`[backup-scheduler] Starting scheduled backup at ${new Date().toISOString()}...`);

  let hasError = false;

  // JSON backup (always works)
  try {
    await runJsonBackup(dir, ts);
  } catch {
    hasError = true;
  }

  // SQL backup (requires pg_dump)
  try {
    await runPgDump(dir, ts);
  } catch (err) {
    console.warn('[backup-scheduler] SQL backup skipped (pg_dump not available):', (err as Error).message);
    // SQL failure is not fatal — JSON backup is the primary
  }

  // Clean old backups
  cleanOldBackups(dir);

  lastRunAt = new Date().toISOString();
  if (hasError) {
    lastRunStatus = 'failed';
    lastRunError = 'JSON backup failed';
  } else {
    lastRunStatus = 'success';
    lastRunError = null;
  }

  console.log(`[backup-scheduler] Backup completed (status: ${lastRunStatus}).`);
}

export function initBackupScheduler(): void {
  const expression = env.BACKUP_CRON;
  if (!cron.validate(expression)) {
    console.error(`[backup-scheduler] Invalid BACKUP_CRON: "${expression}". Scheduler disabled.`);
    return;
  }

  scheduledTask = cron.schedule(expression, () => {
    void runScheduledBackup();
  });

  console.log(`[backup-scheduler] Scheduled automatic backups: ${expression} → ${env.BACKUP_DIR} (retain ${env.BACKUP_RETENTION_DAYS} days)`);
}

export function stopBackupScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[backup-scheduler] Scheduler stopped.');
  }
}

export function getBackupScheduleStatus() {
  return {
    enabled: scheduledTask !== null,
    cronExpression: env.BACKUP_CRON,
    backupDir: path.resolve(env.BACKUP_DIR),
    retentionDays: env.BACKUP_RETENTION_DAYS,
    lastRunAt,
    lastRunStatus,
    lastRunError,
  };
}

export async function triggerBackupNow(): Promise<{ status: string; timestamp: string }> {
  await runScheduledBackup();
  return {
    status: lastRunStatus ?? 'unknown',
    timestamp: lastRunAt ?? new Date().toISOString(),
  };
}
