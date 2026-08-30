import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { exportDataset, type ExportLang } from '../../utils/exportHelper';
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

async function exportSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as {
      q?: string;
      active?: boolean;
      format?: string;
      lang?: string;
    };
    const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
    const format = query.format === 'pdf' ? 'pdf' : 'excel';
    const data = await suppliersService.listSuppliers({
      q: query.q,
      active: query.active,
      limit: 1000,
    });
    const isAr = lang === 'ar';
    const dataset = {
      title: isAr ? 'الموردون' : 'Suppliers',
      subtitle: isAr ? `إجمالي: ${data.total} مورد` : `Total: ${data.total} suppliers`,
      lang,
      columns: isAr
        ? ['#', 'الاسم', 'الهاتف', 'البريد', 'العنوان', 'نشط']
        : ['#', 'Name', 'Phone', 'Email', 'Address', 'Active'],
      rows: data.items.map((supplier: any) => [
        supplier.id,
        supplier.name ?? '-',
        supplier.phone ?? '-',
        supplier.email ?? '-',
        supplier.address ?? '-',
        supplier.isActive ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No'),
      ]),
    };
    const result = await exportDataset(dataset, format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="suppliers.${result.extension}"`);
    res.send(result.buffer);
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
  exportSuppliers,
};