import { NextFunction, Request, Response } from 'express';
import { zatcaService } from './zatca.service';
import { ApiError } from '../../utils/ApiError';

async function status(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await zatcaService.getStatus());
  } catch (err) {
    next(err);
  }
}

async function setup(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await zatcaService.setup());
  } catch (err) {
    next(err);
  }
}

async function csr(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await zatcaService.generateCsr() });
  } catch (err) {
    next(err);
  }
}

async function invoiceXml(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(400, 'Invalid invoice id.');
    }
    res.json({ success: true, data: await zatcaService.getInvoiceXml(id) });
  } catch (err) {
    next(err);
  }
}

async function invoiceQr(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(400, 'Invalid invoice id.');
    }
    res.json({ success: true, data: await zatcaService.getInvoiceQr(id) });
  } catch (err) {
    next(err);
  }
}

async function test(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await zatcaService.test());
  } catch (err) {
    next(err);
  }
}

export const zatcaController = { status, setup, csr, invoiceXml, invoiceQr, test };
