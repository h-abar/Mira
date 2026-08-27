import { NextFunction, Request, Response } from 'express';
import { giftCardsService } from './giftcards.service';
import { ApiError } from '../../utils/ApiError';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (res.locals.giftQuery ?? {}) as { q?: string; page?: number; limit?: number };
    res.json({ success: true, data: await giftCardsService.list(query) });
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as { initialValue: number; clientId?: number; expiresAt?: string };
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    res.json({
      success: true,
      data: await giftCardsService.create({
        initialValue: body.initialValue,
        clientId: body.clientId,
        expiresAt,
      }),
    });
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ApiError(400, 'Invalid gift card id.');
    }
    res.json({ success: true, data: await giftCardsService.update(id, req.body) });
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ApiError(400, 'Invalid gift card id.');
    }
    res.json({ success: true, data: await giftCardsService.remove(id) });
  } catch (err) {
    next(err);
  }
}

async function lookup(req: Request, res: Response, next: NextFunction) {
  try {
    const code = String(req.params.code || '');
    res.json({ success: true, data: await giftCardsService.findByCode(code) });
  } catch (err) {
    next(err);
  }
}

export const giftCardsController = { list, create, update, remove, lookup };