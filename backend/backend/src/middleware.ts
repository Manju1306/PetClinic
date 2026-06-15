import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  ValidationError as SequelizeValidationError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  DatabaseError,
} from 'sequelize';

/* -------------------------------------------------------------------------- */
/* Async handler wrapper                                                      */
/* -------------------------------------------------------------------------- */
// Express 4 doesn't auto-forward rejected promises. Wrap every async handler.
export const asyncHandler =
  <P, ResBody, ReqBody, ReqQuery>(
    fn: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => Promise<unknown>,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/* -------------------------------------------------------------------------- */
/* Custom errors                                                              */
/* -------------------------------------------------------------------------- */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string, id: string | number) {
    super(404, `${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message);
    this.name = 'BadRequestError';
  }
}

/* -------------------------------------------------------------------------- */
/* Path-param helpers                                                         */
/* -------------------------------------------------------------------------- */
export function parseIntParam(value: string, name: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0 || String(n) !== value) {
    throw new BadRequestError(`Invalid ${name}: ${value}`);
  }
  return n;
}

/* -------------------------------------------------------------------------- */
/* 404 catch-all                                                              */
/* -------------------------------------------------------------------------- */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
};

/* -------------------------------------------------------------------------- */
/* Central error handler                                                      */
/* -------------------------------------------------------------------------- */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ error: 'Unique constraint violation', details: err.errors.map(e => e.message) });
    return;
  }
  if (err instanceof ForeignKeyConstraintError) {
    res.status(409).json({ error: 'Foreign key constraint violation' });
    return;
  }
  if (err instanceof SequelizeValidationError) {
    res.status(400).json({ error: 'Validation failed', details: err.errors.map(e => e.message) });
    return;
  }
  if (err instanceof DatabaseError) {
    res.status(500).json({ error: 'Database error' });
    return;
  }

  // Unknown — log full, return generic.
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};