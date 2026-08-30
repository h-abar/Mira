import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { ensureMasterSchema } from './config/master';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { i18n } from './middleware/i18n';
import { apiRateLimit } from './middleware/rateLimit';
import { tenantResolver } from './middleware/tenant';
import accountingRouter from './modules/accounting/accounting.routes';
import appointmentsRouter from './modules/appointments/appointments.routes';
import attendanceRouter from './modules/attendance/attendance.routes';
import authRouter from './modules/auth/auth.routes';
import backupRouter from './modules/backup/backup.routes';
import branchesRouter from './modules/branches/branches.routes';
import clientsRouter from './modules/clients/clients.routes';
import employeesRouter from './modules/employees/employees.routes';
import giftCardsRouter from './modules/giftcards/giftcards.routes';
import inventoryRouter from './modules/inventory/inventory.routes';
import loyaltyRouter from './modules/loyalty/loyalty.routes';
import membershipsRouter from './modules/memberships/memberships.routes';
import notificationsRouter from './modules/notifications/notifications.routes';
import offersRouter from './modules/offers/offers.routes';
import paymentsRouter from './modules/payments/payments.routes';
import purchasesRouter from './modules/purchases/purchases.routes';
import reportsRouter from './modules/reports/reports.routes';
import servicesRouter from './modules/services/services.routes';
import settingsRouter from './modules/settings/settings.routes';
import shiftsRouter from './modules/shifts/shifts.routes';
import suppliersRouter from './modules/suppliers/suppliers.routes';
import tenantsRouter from './modules/tenants/tenants.routes';
import usersRouter from './modules/users/users.routes';
import zatcaRouter from './modules/zatca/zatca.routes';

import publicRouter from './modules/public/public.routes';

const app = express();

// Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS: explicit allow-list in production; localhost in development
const corsOrigin = env.CORS_ORIGIN === '*'
  ? true
  : env.CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(i18n);

// Multi-tenant resolution must wrap all API routes so every query
// inside request handlers targets the current workspace database.
void ensureMasterSchema().catch(() => undefined);

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRateLimit);
app.use('/api', tenantResolver);

const apiRouter = express.Router();

apiRouter.use('/public', publicRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/tenants', tenantsRouter);
apiRouter.use('/clients', clientsRouter);
apiRouter.use('/appointments', appointmentsRouter);
apiRouter.use('/services', servicesRouter);
apiRouter.use('/employees', employeesRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/accounting', accountingRouter);
apiRouter.use('/shifts', shiftsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/loyalty', loyaltyRouter);
apiRouter.use('/offers', offersRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/suppliers', suppliersRouter);
apiRouter.use('/purchases', purchasesRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/backup', backupRouter);
apiRouter.use('/branches', branchesRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/memberships', membershipsRouter);
apiRouter.use('/giftcards', giftCardsRouter);
apiRouter.use('/zatca', zatcaRouter);

app.use('/api', apiRouter);

import path from 'path';

// Serve the built React SPA (bundled into the image at /client/dist).
// Enabled automatically when CLIENT_DIST points at the built assets.
const clientDist = process.env.CLIENT_DIST ? path.resolve(process.env.CLIENT_DIST) : '';
if (clientDist) {
  app.use(express.static(clientDist));
  // SPA history fallback: any non-API GET renders the React app.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;