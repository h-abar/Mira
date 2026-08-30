import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { exportDataset, fmtDate, type ExportLang } from '../../utils/exportHelper';
import {
  purchasesService,
  type PurchaseCreateInput,
  type PurchaseListQuery,
} from './purchases.service';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid purchase order ID');
  }
  return id;
}

async function createPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const data = await purchasesService.createPurchase(req.body as PurchaseCreateInput, userId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getPurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params.id);
    const data = await purchasesService.getPurchase(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function listPurchases(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (res.locals.purchaseQuery ?? req.query ?? {}) as PurchaseListQuery;
    const data = await purchasesService.listPurchases(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function receivePurchase(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params.id);
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
    const id = parseId(req.params.id);
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
        ? ['#', 'التاريخ', 'المورد', 'الإجمالي (ر.س)', 'الحالة', 'بواسطة']
        : ['#', 'Date', 'Supplier', 'Total (SAR)', 'Status', 'Created By'],
      rows: data.items.map((po: any) => [
        po.id,
        fmtDate(po.date),
        po.supplier?.name ?? '—',
        Number(po.total ?? 0),
        po.status ?? '—',
        po.creator?.username ?? '—',
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