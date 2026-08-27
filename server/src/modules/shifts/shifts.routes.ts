import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { shiftsController } from './shifts.controller';

const router = Router();

router.use(auth);

router.post('/open', requirePermission('shifts.write'), shiftsController.openShift);
router.get('/active', requirePermission('shifts.read'), shiftsController.getActiveShift);
router.post('/:id/close', requirePermission('shifts.write'), shiftsController.closeShift);
router.get('/', requirePermission('shifts.read'), shiftsController.listShifts);
router.get('/:id', requirePermission('shifts.read'), shiftsController.getShiftDetails);

export default router;
