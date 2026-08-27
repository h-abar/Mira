import { NextFunction, Request, Response, Router } from 'express';
import { ZodError } from 'zod';
import { auth } from '../../middleware/auth';
import { loginRateLimit } from '../../middleware/rateLimit';
import { authController } from './auth.controller';
import { loginSchema } from './auth.validation';

const authRouter = Router();

function validateLogin(req: Request, _res: Response, next: NextFunction): void {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  req.body = parsed.data;
  next();
}

authRouter.post('/login', loginRateLimit, validateLogin, authController.login);
authRouter.get('/me', auth, authController.me);

export default authRouter;