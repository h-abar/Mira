import { Router } from 'express';
import { auth, requirePermission } from '../../middleware/auth';
import { zatcaController } from './zatca.controller';

const router = Router();

router.use(auth);
router.use(requirePermission('reports'));

router.get('/status', zatcaController.status);
router.post('/setup', zatcaController.setup);
router.post('/csr', zatcaController.csr);
router.get('/invoices/:id/xml', zatcaController.invoiceXml);
router.get('/invoices/:id/qr', zatcaController.invoiceQr);
router.get('/test', zatcaController.test);

export default router;
