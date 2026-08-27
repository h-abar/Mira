import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { notificationsController } from './notifications.controller';

const router = Router();

router.use(auth);

router.post(
  '/whatsapp',
  requirePermission('notifications', 'pos'),
  notificationsController.sendWhatsApp,
);
router.post(
  '/campaign',
  requirePermission('campaigns', 'notifications'),
  notificationsController.sendCampaign,
);
router.post('/test', requirePermission('notifications'), notificationsController.testWhatsApp);
router.get('/schedule', requirePermission('notifications'), notificationsController.schedule);
router.post(
  '/:id/retry',
  requirePermission('notifications'),
  notificationsController.retry,
);
router.get('/', requirePermission('notifications'), notificationsController.list);

export default router;