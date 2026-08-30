import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { appointmentsController } from './appointments.controller';

const appointmentsRouter = Router();

appointmentsRouter.use(auth);

appointmentsRouter.get('/', requirePermission('appointments.read'), appointmentsController.list);
appointmentsRouter.get('/export', requirePermission('appointments.read'), appointmentsController.exportAppointments);
appointmentsRouter.get('/:id', requirePermission('appointments.read'), appointmentsController.getById);
appointmentsRouter.post(
  '/',
  requirePermission('appointments.write'),
  appointmentsController.create,
);
appointmentsRouter.post(
  '/group',
  requirePermission('appointments.write'),
  appointmentsController.createGroup,
);
appointmentsRouter.put(
  '/:id',
  requirePermission('appointments.write'),
  appointmentsController.update,
);
appointmentsRouter.patch(
  '/:id/status',
  requirePermission('appointments.write'),
  appointmentsController.changeStatus,
);
appointmentsRouter.delete('/:id', requirePermission('appointments.write'), appointmentsController.remove);
appointmentsRouter.post(
  '/:id/remind',
  requirePermission('appointments.write'),
  appointmentsController.remind,
);

export default appointmentsRouter;