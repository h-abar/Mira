import { NextFunction, Request, Response, Router } from 'express';
import { ZodError } from 'zod';
import { auth, requirePermission } from '../../middleware/auth';
import { reportsController } from './reports.controller';
import { reportQuerySchema } from './reports.validation';

const reportsRouter = Router();

function validateQuery(req: Request, res: Response, next: NextFunction): void {
  const parsed = reportQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(new ZodError(parsed.error.issues));
  }
  res.locals.reportQuery = parsed.data;
  next();
}

reportsRouter.use(auth, requirePermission('reports.read'), validateQuery);

reportsRouter.get('/sales', reportsController.sales);
reportsRouter.get('/payment-methods', reportsController.paymentMethods);
reportsRouter.get('/top-services', reportsController.topServices);
reportsRouter.get('/top-clients', reportsController.topClients);
reportsRouter.get('/employee-performance', reportsController.employeePerformance);
reportsRouter.get('/employee-shift-sales', reportsController.employeeShiftSales);
reportsRouter.get('/expenses', reportsController.expenses);
reportsRouter.get('/summary', reportsController.summary);
reportsRouter.get('/profit-loss', reportsController.profitLoss);
reportsRouter.get('/dashboard-analytics', reportsController.dashboardAnalytics);
reportsRouter.get('/export', reportsController.exportData);

export default reportsRouter;