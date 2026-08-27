import { NextFunction, Request, Response } from 'express';
import { membershipsService } from './memberships.service';
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

export const membershipsController = {
  listPlans,
  createPlan,
  updatePlan,
  removePlan,
  assign,
  listMemberships,
  cancelMembership,
};
