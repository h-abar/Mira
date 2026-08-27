import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
import { branchesService, type BranchListQuery } from './branches.service';

async function listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = (res.locals.branchQuery ?? {}) as BranchListQuery;
    const data = await branchesService.listBranches(query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await branchesService.createBranch(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid branch ID');
    }
    const data = await branchesService.updateBranch(id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function removeBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid branch ID');
    }
    const data = await branchesService.removeBranch(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid branch ID');
    }
    const data = await branchesService.getBranch(id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export const branchesController = {
  listBranches,
  createBranch,
  updateBranch,
  removeBranch,
  getBranch,
};