import { RequestHandler } from 'express';
import { HttpError } from '../middleware';
import { verifyAccessToken } from './tokens';
import './types';

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    console.log('Invalid or expired token:', token);
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const requireRole =
  (...allowed: string[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!req.user.roles.some(r => allowed.includes(r))) {
      return next(new ForbiddenError(`Requires one of: ${allowed.join(', ')}`));
    }
    next();
  };
