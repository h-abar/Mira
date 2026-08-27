import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { backupController } from './backup.controller';

const router = Router();

router.use(auth);
router.use(requirePermission('backup'));

router.get('/export-json', backupController.exportJson);
router.get('/export-sql', backupController.exportSql);
router.get('/export-csv', backupController.exportCsv);
router.get('/schedule', backupController.getScheduleStatus);
router.post('/trigger', backupController.triggerNow);

export default router;

