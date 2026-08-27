import client from './client';

const FALLBACK_FILENAMES: Record<string, string> = {
  '/backup/export-json': 'saloon-backup.json',
  '/backup/export-sql': 'saloon-backup.sql',
  '/backup/export-csv': 'saloon-backup.csv',
};

function extractFilename(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

async function download(url: string, fallback: string): Promise<void> {
  const response = await client.get<Blob>(url, { responseType: 'blob' });

  const filename = extractFilename(
    response.headers['content-disposition'] as string | undefined,
    fallback,
  );

  const objectUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}

export const downloadJsonBackup = () =>
  download('/backup/export-json', FALLBACK_FILENAMES['/backup/export-json']);

export const downloadSqlBackup = () =>
  download('/backup/export-sql', FALLBACK_FILENAMES['/backup/export-sql']);

export const downloadCsvBackup = () =>
  download('/backup/export-csv', FALLBACK_FILENAMES['/backup/export-csv']);

export interface BackupScheduleStatus {
  enabled: boolean;
  cronExpression: string;
  backupDir: string;
  retentionDays: number;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'failed' | null;
  lastRunError: string | null;
}

export async function getBackupSchedule(): Promise<BackupScheduleStatus> {
  const res = await client.get<BackupScheduleStatus & { success: boolean }>('/backup/schedule');
  return res.data;
}

export async function triggerBackupNow(): Promise<{ status: string; timestamp: string }> {
  const res = await client.post<{ success: boolean; status: string; timestamp: string }>('/backup/trigger');
  return res.data;
}

