import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { usersController } from './users.controller';

const router = Router();

router.use(auth);
router.use(requirePermission('users'));

router.get('/permissions', usersController.getPermissionDefs);
router.get('/', usersController.list);
router.post('/', usersController.create);
router.put('/:id', usersController.update);

export default router;