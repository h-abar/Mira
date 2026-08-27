import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { loyaltyController } from './loyalty.controller';

const router = Router();

router.use(auth);

router.get(
  '/clients/:id/transactions',
  requirePermission('clients.read'),
  loyaltyController.listTransactions,
);
router.post(
  '/clients/:id/adjust',
  requirePermission('loyalty'),
  loyaltyController.adjust,
);

export default router;