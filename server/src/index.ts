import app from './app';
import { env } from './config/env';
import { initBackupScheduler } from './modules/backup/scheduler';
import { initReminderScheduler } from './modules/notifications/reminder-scheduler';

app.listen(env.PORT, () => {
  console.log(`Saloon server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  initBackupScheduler();
  initReminderScheduler();
});