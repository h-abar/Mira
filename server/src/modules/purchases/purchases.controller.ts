import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { purchasesService, type PurchaseListQuery } from './purchases.service';

async function createPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const data = await purchasesService.createPurchase(req.body, userId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listPurchases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (res.locals.purchaseQuery ?? {}) as PurchaseListQuery;
    const data = await purchasesService.listPurchases(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid purchase order ID');
    }
    const data = await purchasesService.getPurchase(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function receivePurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid purchase order ID');
    }
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const data = await purchasesService.receivePurchase(id, userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function cancelPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid purchase order ID');
    }
    const data = await purchasesService.cancelPurchase(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export const purchasesController = {
  createPurchase,
  listPurchases,
  getPurchase,
  receivePurchase,
  cancelPurchase,
};