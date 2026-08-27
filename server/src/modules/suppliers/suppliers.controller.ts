import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { suppliersService, type SupplierListQuery } from './suppliers.service';

async function listSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (res.locals.supplierQuery ?? {}) as SupplierListQuery;
    const data = await suppliersService.listSuppliers(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await suppliersService.createSupplier(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid supplier ID');
    }
    const data = await suppliersService.updateSupplier(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function removeSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid supplier ID');
    }
    const data = await suppliersService.removeSupplier(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid supplier ID');
    }
    const data = await suppliersService.getSupplier(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export const suppliersController = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  removeSupplier,
  getSupplier,
};