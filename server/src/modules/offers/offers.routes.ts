import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { offersController } from './offers.controller';

const router = Router();

router.use(auth);
router.use(requirePermission('offers'));

router.get('/', offersController.list);
router.post('/validate', offersController.validate);
router.post('/', offersController.create);
router.put('/:id', offersController.update);
router.delete('/:id', offersController.remove);

export default router;