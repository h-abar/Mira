import { NextFunction, Request, Response, Router } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { tenantsController, requirePlatformAdmin } from './tenants.controller';

const tenantsRouter = Router();

function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

tenantsRouter.use(requirePlatformAdmin);

const createSchema = z.object({
  slug: z.string().min(3).max(40).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  name: z.string().min(2).max(120),
  adminUsername: z.string().min(3).max(40).optional(),
  adminPassword: z.string().min(6).max(72).optional(),
});

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

tenantsRouter.get('/', tenantsController.listTenants);

tenantsRouter.post('/', validateBody(createSchema), tenantsController.createTenant);

tenantsRouter.patch('/:slug/status', validateBody(statusSchema), tenantsController.setTenantStatus);

export default tenantsRouter;
