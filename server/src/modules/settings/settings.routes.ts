import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { settingsController } from './settings.controller';

const router = Router();

router.use(auth);
router.use(requirePermission('settings'));

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

export default router;
