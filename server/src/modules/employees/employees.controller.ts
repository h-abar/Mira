import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { exportDataset, type ExportLang } from '../../utils/exportHelper';
import { employeesService, type EmployeeCreateData } from './employees.service';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'Invalid employee id.');
  }
  return id;
}

async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await employeesService.list();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await employeesService.getById(parseId(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await employeesService.create(req.body as EmployeeCreateData);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await employeesService.update(
      parseId(req.params.id),
      req.body as Partial<EmployeeCreateData>,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await employeesService.remove(parseId(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function exportEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as { format?: string; lang?: string };
    const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
    const format = query.format === 'pdf' ? 'pdf' : 'excel';
    const items = await employeesService.list();
    const isAr = lang === 'ar';
    const dataset = {
      title: isAr ? 'الموظفون' : 'Employees',
      subtitle: isAr ? `إجمالي: ${items.length} موظف` : `Total: ${items.length} employees`,
      lang,
      columns: isAr
        ? ['#', 'الاسم (عربي)', 'الاسم (إنجليزي)', 'الهاتف', 'الدور', 'نسبة العمولة', 'تاريخ التوظيف', 'نشط']
        : ['#', 'Name (Ar)', 'Name (En)', 'Phone', 'Role', 'Commission Rate', 'Hire Date', 'Active'],
      rows: items.map((emp: any) => [
        emp.id,
        emp.nameAr ?? '-',
        emp.nameEn ?? '-',
        emp.phone ?? '-',
        emp.role ?? '-',
        Number(emp.commissionRate ?? 0),
        emp.hireDate ? new Date(emp.hireDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-',
        emp.isActive ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No'),
      ]),
    };
    const result = await exportDataset(dataset, format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="employees.${result.extension}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
}

export const employeesController = { list, getById, create, update, remove, exportEmployees };