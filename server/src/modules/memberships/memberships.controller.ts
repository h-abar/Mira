import { NextFunction, Request, Response } from 'express';
import { exportDataset, type ExportLang } from '../../utils/exportHelper';
import { membershipsService } from './memberships.service';
import { getActiveMembership } from './membershipDiscount';
import { ApiError } from '../../utils/ApiError';

async function listPlans(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await membershipsService.listPlans() });
  } catch (err) {
    next(err);
  }
}

async function createPlan(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await membershipsService.createPlan(req.body) });
  } catch (err) {
    next(err);
  }
}

async function updatePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ApiError(400, 'Invalid plan id.');
    }
    res.json({ success: true, data: await membershipsService.updatePlan(id, req.body) });
  } catch (err) {
    next(err);
  }
}

async function removePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ApiError(400, 'Invalid plan id.');
    }
    res.json({ success: true, data: await membershipsService.removePlan(id) });
  } catch (err) {
    next(err);
  }
}

async function assign(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await membershipsService.assign(req.body) });
  } catch (err) {
    next(err);
  }
}

async function listMemberships(req: Request, res: Response, next: NextFunction) {
  try {
    const planIdRaw = req.query.planId;
    const planId =
      planIdRaw !== undefined && planIdRaw !== '' ? Number(planIdRaw) : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json({
      success: true,
      data: await membershipsService.listMemberships({
        ...(Number.isInteger(planId) ? { planId } : {}),
        ...(status ? { status } : {}),
      }),
    });
  } catch (err) {
    next(err);
  }
}

async function cancelMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ApiError(400, 'Invalid membership id.');
    }
    res.json({ success: true, data: await membershipsService.cancelMembership(id) });
  } catch (err) {
    next(err);
  }
}

async function searchClients(req: Request, res: Response, next: NextFunction) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const limitRaw = req.query.limit;
    const limit = limitRaw !== undefined && limitRaw !== '' ? Number(limitRaw) : 50;
    res.json({
      success: true,
      data: await membershipsService.searchClientsForAssign(
        q,
        Number.isInteger(limit) ? limit : 50,
      ),
    });
  } catch (err) {
    next(err);
  }
}

async function getClientMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = Number(req.params.clientId);
    if (!Number.isInteger(clientId)) {
      throw new ApiError(400, 'Invalid client id.');
    }
    const membership = await getActiveMembership(clientId);
    const now = new Date();
    const remainingDays = membership
      ? Math.max(0, Math.ceil((new Date(membership.endDate).getTime() - now.getTime()) / 86400000))
      : 0;
    res.json({
      success: true,
      data: membership
        ? {
            id: membership.id,
            clientId: membership.clientId,
            planId: membership.planId,
            startDate: membership.startDate,
            endDate: membership.endDate,
            status: membership.status,
            remainingDays,
            plan: {
              id: membership.plan.id,
              nameAr: membership.plan.nameAr,
              nameEn: membership.plan.nameEn,
              discountPercent: Number(membership.plan.discountPercent),
              serviceIds: membership.plan.serviceIds,
              durationDays: membership.plan.durationDays,
            },
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
}

async function exportPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as { format?: string; lang?: string };
    const lang: ExportLang = query.lang === 'en' ? 'en' : 'ar';
    const format = query.format === 'pdf' ? 'pdf' : 'excel';
    const items = await membershipsService.listPlans();
    const isAr = lang === 'ar';
    const dataset = {
      title: isAr ? 'باقات العضوية' : 'Membership Plans',
      subtitle: isAr ? `إجمالي: ${items.length} باقة` : `Total: ${items.length} plans`,
      lang,
      columns: isAr
        ? ['#', 'الاسم (عربي)', 'الاسم (إنجليزي)', 'السعر (ر.س)', 'المدة (أيام)', 'نسبة الخصم %', 'عدد الأعضاء', 'نشط']
        : ['#', 'Name (Ar)', 'Name (En)', 'Price (SAR)', 'Duration (Days)', 'Discount %', 'Members Count', 'Active'],
      rows: items.map((plan: any) => [
        plan.id,
        plan.nameAr ?? '—',
        plan.nameEn ?? '—',
        Number(plan.price ?? 0),
        Number(plan.durationDays ?? 0),
        Number(plan.discountPercent ?? 0),
        Number(plan.membersCount ?? 0),
        plan.isActive ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No'),
      ]),
    };
    const result = await exportDataset(dataset, format);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="membership-plans.${result.extension}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
}

export const membershipsController = {
  listPlans,
  createPlan,
  updatePlan,
  removePlan,
  assign,
  listMemberships,
  cancelMembership,
  searchClients,
  getClientMembership,
  exportPlans,
};
