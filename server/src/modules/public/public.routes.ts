import { Router } from 'express';
import { publicController } from './public.controller';

const publicRouter = Router();

publicRouter.get('/services', publicController.getServices);
publicRouter.get('/employees', publicController.getEmployees);
publicRouter.get('/info', publicController.getInfo);
publicRouter.get('/available-slots', publicController.getAvailableSlots);
publicRouter.post('/book', publicController.createBooking);
publicRouter.get('/booking/:code', publicController.getBookingByCode);

export default publicRouter;
