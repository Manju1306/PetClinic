import { Router } from 'express';
import { Op } from 'sequelize';
import { User, Role, Owner, PasswordResetToken, sequelize } from '../db';
import { asyncHandler, BadRequestError, HttpError } from '../middleware';
import { requireAuth, UnauthorizedError } from '../auth/middleware';
import { hashPassword, verifyPassword } from '../auth/passwords';
import {
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '../auth/tokens';
import { authConfig } from '../auth/config';

const router = Router();

const DEFAULT_SIGNUP_ROLE = 'ROLE_USER';
const GENERIC_INVALID_CREDENTIALS = 'Invalid username or password';

async function loadRoleNames(username: string): Promise<string[]> {
  const rows = await Role.findAll({ where: { username } });
  return rows.map(r => r.role);
}

async function loadRolesIfEnabled(username: string): Promise<string[] | null> {
  const user = await User.findByPk(username);
  if (!user || !user.enabled) return null;
  return loadRoleNames(username);
}

async function findOwnerIdForUser(username: string): Promise<number | null> {
  const owner = await Owner.findOne({ where: { username }, attributes: ['id'] });
  return owner?.id ?? null;
}

function toSafeUser(user: User, roles: string[], ownerId: number | null = null): Record<string, unknown> {
  return {
    username: user.username,
    email: user.email,
    enabled: user.enabled,
    roles,
    owner_id: ownerId,
  };
}

/* -------------------------------------------------------------------------- */
/* POST /auth/signup                                                          */
/* -------------------------------------------------------------------------- */
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { username?: string; password?: string; email?: string };
    console.log('POST /api/auth/signup body:', JSON.stringify(body));
    const { username, password, email } = body;

    if (!username || typeof username !== 'string') throw new BadRequestError('username is required');
    if (!password || typeof password !== 'string') throw new BadRequestError('password is required');
    if (password.length < 8) throw new BadRequestError('password must be at least 8 characters');
    if (email !== undefined && typeof email !== 'string') throw new BadRequestError('email must be a string');

    const hashed = await hashPassword(password);

    const created = await sequelize.transaction(async tx => {
      const user = await User.create(
        { username, password: hashed, email: email ?? null, enabled: true },
        { transaction: tx },
      );
      await Role.create({ username: user.username, role: DEFAULT_SIGNUP_ROLE }, { transaction: tx });
      return user;
    });

    const roles = [DEFAULT_SIGNUP_ROLE];
    const ownerId = await findOwnerIdForUser(created.username);
    const tokens = await issueTokenPair({ username: created.username, roles });
    res.status(201).json({ user: toSafeUser(created, roles, ownerId), ...tokens });
  }),
);

/* -------------------------------------------------------------------------- */
/* POST /auth/login                                                           */
/* -------------------------------------------------------------------------- */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    console.log('POST /api/auth/login body:', JSON.stringify(req.body));
    const body = (req.body ?? {}) as { username?: string; password?: string };
    const { username, password } = body;

    if (!username || typeof username !== 'string') throw new BadRequestError('username is required');
    if (!password || typeof password !== 'string') throw new BadRequestError('password is required');

    const user = await User.findByPk(username);
    if (!user || !user.enabled) throw new UnauthorizedError(GENERIC_INVALID_CREDENTIALS);

    const ok = await verifyPassword(password, user.password);
    if (!ok) throw new UnauthorizedError(GENERIC_INVALID_CREDENTIALS);

    const roles = await loadRoleNames(user.username);
    const ownerId = await findOwnerIdForUser(user.username);
    const tokens = await issueTokenPair({ username: user.username, roles });
    res.json({ user: toSafeUser(user, roles, ownerId), ...tokens });
  }),
);

/* -------------------------------------------------------------------------- */
/* POST /auth/refresh                                                         */
/* -------------------------------------------------------------------------- */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { refresh_token?: string };
    if (!body.refresh_token) throw new BadRequestError('refresh_token is required');

    const pair = await rotateRefreshToken(body.refresh_token, loadRolesIfEnabled);
    if (!pair) throw new UnauthorizedError('Refresh token is invalid, expired, or revoked');
    res.json(pair);
  }),
);

/* -------------------------------------------------------------------------- */
/* POST /auth/logout                                                          */
/* -------------------------------------------------------------------------- */
// Revokes a single refresh token. Access tokens remain valid until they
// expire — clients are expected to drop them locally.
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { refresh_token?: string };
    if (!body.refresh_token) throw new BadRequestError('refresh_token is required');
    await revokeRefreshToken(body.refresh_token);
    res.status(204).send();
  }),
);

/* -------------------------------------------------------------------------- */
/* GET /auth/me                                                               */
/* -------------------------------------------------------------------------- */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    console.log('GET /api/auth/me user:', JSON.stringify(req.user));
    const username = req.user!.username;
    const user = await User.findByPk(username);
    if (!user) throw new UnauthorizedError();
    const roles = await loadRoleNames(username);
    const ownerId = await findOwnerIdForUser(username);
    res.json(toSafeUser(user, roles, ownerId));
  }),
);

/* -------------------------------------------------------------------------- */
/* PATCH /auth/me/account                                                     */
/* -------------------------------------------------------------------------- */
// Only `email` is user-editable. `username` is the natural primary key and
// cannot change; `enabled` and `roles` are admin concerns.
router.patch(
  '/me/account',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { email?: string | null };
    if (!('email' in body)) throw new BadRequestError('email is required');
    if (body.email !== null && typeof body.email !== 'string') {
      throw new BadRequestError('email must be a string or null');
    }

    const user = await User.findByPk(req.user!.username);
    if (!user) throw new UnauthorizedError();
    await user.update({ email: body.email });

    const roles = await loadRoleNames(user.username);
    res.json(toSafeUser(user, roles));
  }),
);

/* -------------------------------------------------------------------------- */
/* PATCH /auth/me/password                                                    */
/* -------------------------------------------------------------------------- */
router.patch(
  '/me/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { current_password?: string; new_password?: string };
    const { current_password, new_password } = body;

    if (!current_password || typeof current_password !== 'string') {
      throw new BadRequestError('current_password is required');
    }
    if (!new_password || typeof new_password !== 'string') {
      throw new BadRequestError('new_password is required');
    }
    if (new_password.length < 8) throw new BadRequestError('new_password must be at least 8 characters');

    const user = await User.findByPk(req.user!.username);
    if (!user) throw new UnauthorizedError();

    const ok = await verifyPassword(current_password, user.password);
    if (!ok) throw new UnauthorizedError('Current password is incorrect');

    const hashed = await hashPassword(new_password);
    await user.update({ password: hashed });
    // Force re-login on all other sessions.
    await revokeAllRefreshTokensForUser(user.username);

    const roles = await loadRoleNames(user.username);
    const tokens = await issueTokenPair({ username: user.username, roles });
    res.json({ user: toSafeUser(user, roles), ...tokens });
  }),
);

/* -------------------------------------------------------------------------- */
/* POST /auth/password-reset/request                                          */
/* -------------------------------------------------------------------------- */
// Always returns 204 to avoid leaking which emails exist. The reset link is
// logged to the server console (real email delivery is left as a TODO behind
// the `deliverResetLink` seam below).
router.post(
  '/password-reset/request',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { email?: string };
    if (!body.email || typeof body.email !== 'string') throw new BadRequestError('email is required');

    const user = await User.findOne({ where: { email: body.email } });
    if (user && user.enabled) {
      const rawToken = generatePasswordResetToken();
      await PasswordResetToken.create({
        username: user.username,
        token_hash: hashPasswordResetToken(rawToken),
        expires_at: new Date(Date.now() + authConfig.passwordResetTtlMs),
      });
      deliverResetLink(user, rawToken);
    }
    res.status(204).send();
  }),
);

/* -------------------------------------------------------------------------- */
/* POST /auth/password-reset/confirm                                          */
/* -------------------------------------------------------------------------- */
router.post(
  '/password-reset/confirm',
  asyncHandler(async (req, res) => {
    const body = (req.body ?? {}) as { token?: string; new_password?: string };
    const { token, new_password } = body;

    if (!token || typeof token !== 'string') throw new BadRequestError('token is required');
    if (!new_password || typeof new_password !== 'string') throw new BadRequestError('new_password is required');
    if (new_password.length < 8) throw new BadRequestError('new_password must be at least 8 characters');

    const row = await PasswordResetToken.findOne({
      where: {
        token_hash: hashPasswordResetToken(token),
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() },
      },
    });
    if (!row) throw new HttpError(400, 'Reset token is invalid, expired, or already used');

    const user = await User.findByPk(row.username);
    if (!user || !user.enabled) throw new HttpError(400, 'Reset token is invalid, expired, or already used');

    const hashed = await hashPassword(new_password);
    await sequelize.transaction(async tx => {
      await user.update({ password: hashed }, { transaction: tx });
      await row.update({ used_at: new Date() }, { transaction: tx });
    });
    // Force re-login on all sessions.
    await revokeAllRefreshTokensForUser(user.username);

    res.status(204).send();
  }),
);

/* -------------------------------------------------------------------------- */
/* Email delivery seam                                                        */
/* -------------------------------------------------------------------------- */
// Stubbed in dev: prints the reset link to the server console. Replace with
// a real transport (SES, SendGrid, nodemailer) when ready.
function deliverResetLink(user: User, token: string): void {
  const link = `${authConfig.appUrl}/reset-password?token=${token}`;
  // eslint-disable-next-line no-console
  console.log(`[password-reset] ${user.username} (${user.email}) -> ${link}`);
}

export default router;
