import cron from 'node-cron';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import {
  formatDateTime,
  reminderTemplate,
  sendWhatsApp,
  type Lang,
} from './notifications.service';

let scheduledTask: cron.ScheduledTask | null = null;
let lastRunAt: string | null = null;
let lastRunSent = 0;
let lastRunFailed = 0;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

async function getSalonName(lang: Lang): Promise<string | undefined> {
  const key = lang === 'en' ? 'SALON_NAME_EN' : 'SALON_NAME_AR';
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value || undefined;
}

async function sendReminders(): Promise<void> {
  if (!env.REMINDER_ENABLED) {
    return;
  }

  const now = new Date();
  const targetTime = new Date(now.getTime() + env.REMINDER_HOURS_BEFORE * 60 * 60 * 1000);
  const targetStart = startOfDay(targetTime);
  const targetEnd = endOfDay(targetTime);

  console.log(
    `[reminder-scheduler] Checking appointments from ${targetStart.toISOString()} to ${targetEnd.toISOString()}...`,
  );

  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: targetStart, lte: targetEnd },
      status: 'BOOKED',
    },
    include: {
      client: { select: { id: true, name: true, phone: true, whatsapp: true } },
      service: { select: { id: true, nameAr: true, nameEn: true } },
    },
  });

  if (appointments.length === 0) {
    console.log('[reminder-scheduler] No upcoming appointments to remind.');
    lastRunAt = now.toISOString();
    lastRunSent = 0;
    lastRunFailed = 0;
    return;
  }

  const salonNameAr = await getSalonName('ar');
  const salonNameEn = await getSalonName('en');

  let sent = 0;
  let failed = 0;

  for (const appt of appointments) {
    const phone = appt.client.whatsapp || appt.client.phone;
    if (!phone) continue;

    // Determine lang from client phone — default to Arabic
    const lang: Lang = 'ar';
    const pickLang = <T>(ar: T, en: T, l: Lang): T => (l === 'en' ? en : ar);
    const salonName = pickLang(salonNameAr, salonNameEn, lang);
    const serviceName = pickLang(appt.service.nameAr, appt.service.nameEn, lang);

    const message = reminderTemplate(
      appt.client.name,
      serviceName,
      formatDateTime(appt.date, appt.startTime),
      salonName,
      lang,
    );

    try {
      await sendWhatsApp(phone, message, {
        referenceId: `APPT-REMINDER-${appt.id}`,
        type: 'auto-reminder',
        lang,
      });
      sent++;
    } catch (err) {
      console.error(`[reminder-scheduler] Failed to send reminder for appointment ${appt.id}:`, err);
      failed++;
    }
  }

  lastRunAt = now.toISOString();
  lastRunSent = sent;
  lastRunFailed = failed;

  console.log(
    `[reminder-scheduler] Done. Total: ${appointments.length}, Sent: ${sent}, Failed: ${failed}, Skipped (no phone): ${appointments.length - sent - failed}`,
  );
}

export function initReminderScheduler(): void {
  if (!env.REMINDER_ENABLED) {
    console.log('[reminder-scheduler] Disabled via REMINDER_ENABLED=false.');
    return;
  }

  const expression = env.REMINDER_CRON;
  if (!cron.validate(expression)) {
    console.error(`[reminder-scheduler] Invalid REMINDER_CRON: "${expression}". Scheduler disabled.`);
    return;
  }

  scheduledTask = cron.schedule(expression, () => {
    void sendReminders();
  });

  console.log(
    `[reminder-scheduler] Scheduled automatic reminders: ${expression} (${env.REMINDER_HOURS_BEFORE}h before appointment)`,
  );
}

export function stopReminderScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[reminder-scheduler] Scheduler stopped.');
  }
}

export function getReminderScheduleStatus() {
  return {
    enabled: env.REMINDER_ENABLED && scheduledTask !== null,
    cronExpression: env.REMINDER_CRON,
    hoursBefore: env.REMINDER_HOURS_BEFORE,
    lastRunAt,
    lastRunSent,
    lastRunFailed,
  };
}
