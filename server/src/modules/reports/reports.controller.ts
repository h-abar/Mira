import { NextFunction, Request, Response } from 'express';
import { reportsService, type GroupBy, type Lang } from './reports.service';

type ReportQuery = {
  from?: Date;
  to?: Date;
  groupBy?: GroupBy;
  report?:
    | 'sales'
    | 'paymentMethods'
    | 'topServices'
    | 'topClients'
    | 'employeePerformance'
    | 'employeeShiftSales'
    | 'expenses';
  format?: 'excel' | 'pdf';
  branchId?: number;
  employeeId?: number;
  lang?: Lang;
};

async function sales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.salesReport({
      from: q.from,
      to: q.to,
      groupBy: q.groupBy,
      branchId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function paymentMethods(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.paymentMethods({ from: q.from, to: q.to, branchId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function topServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.topServices({ from: q.from, to: q.to, branchId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function topClients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.topClients({ from: q.from, to: q.to, branchId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function employeePerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.employeePerformance({
      from: q.from,
      to: q.to,
      branchId,
      employeeId: q.employeeId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function employeeShiftSales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.employeeShiftSales({
      from: q.from,
      to: q.to,
      branchId,
      employeeId: q.employeeId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function expenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const data = await reportsService.expensesReport({ from: q.from, to: q.to });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.summaryTotals({ from: q.from, to: q.to, branchId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function profitLoss(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.profitLoss({ from: q.from, to: q.to, branchId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (res.locals.reportQuery ?? {}) as ReportQuery;
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const result = await reportsService.exportData({
      report: q.report ?? 'sales',
      from: q.from,
      to: q.to,
      groupBy: q.groupBy,
      format: q.format ?? 'excel',
      branchId,
      employeeId: q.employeeId,
      lang: q.lang,
    });

    res.setHeader('Content-Type', result.mime);
    res.setHeader('Content-Disposition', `attachment; filename="report.${result.extension}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
}

async function dashboardAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const data = await reportsService.dashboardAnalytics(branchId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export const reportsController = {
  sales,
  paymentMethods,
  topServices,
  topClients,
  employeePerformance,
  employeeShiftSales,
  expenses,
  summary,
  profitLoss,
  dashboardAnalytics,
  exportData,
};