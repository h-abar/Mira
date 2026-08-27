import { NextFunction, Request, Response } from 'express';
import { inventoryService, type ListProductsParams } from './inventory.service';

async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = (res.locals.inventoryQuery ?? {}) as ListProductsParams;
    const data = await inventoryService.listProducts(params);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await inventoryService.createProduct(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const data = await inventoryService.updateProduct(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function removeProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const data = await inventoryService.removeProduct(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function addMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await inventoryService.addMovement(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.id ? Number(req.params.id) : undefined;
    const data = await inventoryService.listMovements({ productId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export const inventoryController = {
  listProducts,
  createProduct,
  updateProduct,
  removeProduct,
  addMovement,
  listMovements,

  async listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await inventoryService.listCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async renameCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = String(req.body?.from ?? '').trim();
      const to = String(req.body?.to ?? '').trim();
      const data = await inventoryService.renameCategory(from, to);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};