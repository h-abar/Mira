import { NextFunction, Request, Response, Router } from 'express';
import { z, ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { giftCardsController } from './giftcards.controller';
import {
  giftCardCreateSchema,
  giftCardListQuerySchema,
  giftCardUpdateSchema,
} from './giftcards.validation';

const router = Router();

function validate(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ZodError(parsed.error.issues));
    }
    req.body = parsed.data;
    next();
  };
}

function validateQuery(req: Request, res: Response, next: NextFunction): void {
  const parsed = giftCardListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  res.locals.giftQuery = parsed.data;
  next();
}

router.use(auth);
router.use(requirePermission('giftcards'));

router.get('/', validateQuery, giftCardsController.list);
router.post('/', validate(giftCardCreateSchema), giftCardsController.create);
router.put('/:id', validate(giftCardUpdateSchema), giftCardsController.update);
router.delete('/:id', giftCardsController.remove);
router.get('/lookup/:code', giftCardsController.lookup);

export default router;