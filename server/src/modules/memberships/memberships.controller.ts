import { NextFunction, Request, Response } from 'express';
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

async function listMemberships(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await membershipsService.listMemberships() });
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

export const membershipsController = {
  listPlans,
  createPlan,
  updatePlan,
  removePlan,
  assign,
  listMemberships,
  cancelMembership,
  getClientMembership,
};
