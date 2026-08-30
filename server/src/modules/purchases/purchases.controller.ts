import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { exportDataset, type ExportLang } from '../../utils/exportHelper';
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

async function exportPurchases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as {
      supplierId?: number;
      status?: string;
      from?: Date;
      to?: Date;
      format?: string;
      lang?: string;
    };
    const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
    const format = query.format === 'pdf' ? 'pdf' : 'excel';
    const data = await purchasesService.listPurchases({
      supplierId: query.supplierId,
      status: query.status as any,
      from: query.from,
      to: query.to,
      limit: 1000,
    });
    const isAr = lang === 'ar';
    const dataset = {
      title: isAr ? 'أوامر الشراء' : 'Purchase Orders',
      subtitle: isAr ? `إجمالي: ${data.total} أمر` : `Total: ${data.total} orders`,
      lang,
      columns: isAr
        ? ['#', 'التاريخ', 'المورد', 'الإجمالي', 'الحالة', 'بواسطة']
        : ['#', 'Date', 'Supplier', 'Total', 'Status', 'Created By'],
      rows: data.items.map((po: any) => [
        po.id,
        new Date(po.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
        po.supplier?.name ?? '-',
        Number(po.total ?? 0),
        po.status ?? '-',
        po.creator?.username ?? '-',
      ]),
    };
    const result = await exportDataset(dataset, format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="purchases.${result.extension}"`);
    res.send(result.buffer);
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
  exportPurchases,
};