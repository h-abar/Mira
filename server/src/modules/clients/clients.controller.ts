import { NextFunction, Request, Response } from 'express';
import { exportDataset, fmtDate, type ExportLang } from '../../utils/exportHelper';
import { clientsService, type ClientListParams } from './clients.service';

export const clientsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.list(req.query as unknown as ClientListParams);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.getById(Number(req.params.id));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.update(Number(req.params.id), req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await clientsService.remove(Number(req.params.id));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async exportClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as { format?: string; lang?: string };
      const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
      const format = query.format === 'pdf' ? 'pdf' : 'excel';
      const data = await clientsService.list({ limit: 1000 });
      const isAr = lang === 'ar';
      const dataset = {
        title: isAr ? 'العملاء' : 'Clients',
        subtitle: isAr ? `إجمالي: ${data.total} عميل` : `Total: ${data.total} clients`,
        lang,
        columns: isAr
          ? ['#', 'الاسم', 'الهاتف', 'واتساب', 'البريد', 'إجمالي الإنفاق (ر.س)', 'النقاط', 'تاريخ الإنشاء']
          : ['#', 'Name', 'Phone', 'WhatsApp', 'Email', 'Total Spent (SAR)', 'Points', 'Created At'],
        rows: data.items.map((client: any) => [
          client.id,
          client.name ?? '—',
          client.phone ?? '—',
          client.whatsapp ?? '—',
          client.email ?? '—',
          Number(client.totalSpent ?? 0),
          Number(client.points ?? 0),
          fmtDate(client.createdAt),
        ]),
      };
      const result = await exportDataset(dataset, format);
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="clients.${result.extension}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  },
};