import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError';
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

export const employeesController = { list, getById, create, update, remove };