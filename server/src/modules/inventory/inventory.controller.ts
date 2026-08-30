import { NextFunction, Request, Response } from 'express';
import { exportDataset, type ExportLang } from '../../utils/exportHelper';
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

async function exportProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as {
      q?: string;
      lowStock?: boolean;
      category?: string;
      branchId?: number;
      format?: string;
      lang?: string;
    };
    const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
    const format = query.format === 'pdf' ? 'pdf' : 'excel';
    const items = await inventoryService.listProducts({
      q: query.q,
      lowStock: query.lowStock,
      category: query.category,
      branchId: query.branchId,
    });
    const isAr = lang === 'ar';
    const dataset = {
      title: isAr ? 'المخزون' : 'Inventory',
      subtitle: isAr ? `إجمالي: ${items.length} منتج` : `Total: ${items.length} products`,
      lang,
      columns: isAr
        ? ['#', 'الاسم (عربي)', 'الاسم (إنجليزي)', 'الباركود', 'الفئة', 'الكمية', 'الوحدة', 'سعر التكلفة (ر.س)', 'سعر البيع (ر.س)', 'الحد الأدنى', 'نشط']
        : ['#', 'Name (Ar)', 'Name (En)', 'Barcode', 'Category', 'Quantity', 'Unit', 'Cost Price (SAR)', 'Sale Price (SAR)', 'Min Stock', 'Active'],
      rows: items.map((product: any) => [
        product.id,
        product.nameAr ?? '—',
        product.nameEn ?? '—',
        product.barcode ?? '—',
        product.category ?? '—',
        Number(product.quantity ?? 0),
        product.unit ?? '—',
        Number(product.costPrice ?? 0),
        Number(product.salePrice ?? 0),
        Number(product.minStock ?? 0),
        product.isActive ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No'),
      ]),
    };
    const result = await exportDataset(dataset, format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="products.${result.extension}"`);
    res.send(result.buffer);
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
  exportProducts,

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