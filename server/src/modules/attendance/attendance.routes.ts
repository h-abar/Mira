import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { attendanceController } from './attendance.controller';

const router = Router();

router.use(auth);
router.use(requirePermission('attendance'));

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/summary', attendanceController.summary);
router.get('/', attendanceController.list);

export default router;