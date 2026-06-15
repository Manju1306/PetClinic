import { randomBytes, createHash } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Op } from 'sequelize';
import { RefreshToken } from '../models/petclinic.models';
import { authConfig } from './config';
import type { AuthUser } from './types';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds until access token expires
}

interface AccessTokenClaims extends AuthUser {
  typ: 'access';
}

/* -------------------------------------------------------------------------- */
/* Access tokens (stateless JWT)                                              */
/* -------------------------------------------------------------------------- */

function signAccessToken(user: AuthUser): { token: string; expiresInSec: number } {
  const claims: AccessTokenClaims = { username: user.username, roles: user.roles, typ: 'access' };
  const options: SignOptions = { expiresIn: authConfig.accessTtl as SignOptions['expiresIn'], subject: user.username };
  const token = jwt.sign(claims, authConfig.accessSecret, options);
  const decoded = jwt.decode(token) as { exp?: number; iat?: number } | null;
  const expiresInSec = decoded?.exp && decoded.iat ? decoded.exp - decoded.iat : 0;
  return { token, expiresInSec };
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, authConfig.accessSecret) as AccessTokenClaims;
  console.log('Verified payload for user:', JSON.stringify(payload));
  if (payload.typ !== 'access') throw new Error('Wrong token type');
  return { username: payload.username, roles: payload.roles ?? [] };
}

/* -------------------------------------------------------------------------- */
/* Refresh tokens (opaque, hashed in DB)                                      */
/* -------------------------------------------------------------------------- */

function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function persistRefreshToken(username: string): Promise<string> {
  const rawToken = generateRefreshToken();
  await RefreshToken.create({
    username,
    token_hash: hashToken(rawToken),
    expires_at: new Date(Date.now() + authConfig.refreshTtlMs),
  });
  return rawToken;
}

export async function issueTokenPair(user: AuthUser): Promise<TokenPair> {
  const { token: access_token, expiresInSec } = signAccessToken(user);
  const refresh_token = await persistRefreshToken(user.username);
  return { access_token, refresh_token, token_type: 'Bearer', expires_in: expiresInSec };
}

/**
 * Verifies a presented refresh token, rotates it (revokes the old, issues a new
 * pair), and returns the new pair. Returns null if the token is unknown,
 * expired, or already revoked — caller maps this to 401.
 *
 * Roles are re-read from the database on rotation so role changes take effect
 * within one refresh cycle, even though access tokens are stateless.
 */
export async function rotateRefreshToken(
  presented: string,
  loadRoles: (username: string) => Promise<string[] | null>,
): Promise<TokenPair | null> {
  const row = await RefreshToken.findOne({
    where: {
      token_hash: hashToken(presented),
      revoked_at: { [Op.is]: null },
      expires_at: { [Op.gt]: new Date() },
    },
  });
  if (!row) return null;

  const roles = await loadRoles(row.username);
  if (roles === null) return null;

  const newRaw = await persistRefreshToken(row.username);
  const replacement = await RefreshToken.findOne({
    where: { token_hash: hashToken(newRaw) },
    order: [['id', 'DESC']],
  });
  await row.update({ revoked_at: new Date(), replaced_by: replacement?.id ?? null });

  const { token: access_token, expiresInSec } = signAccessToken({ username: row.username, roles });
  return { access_token, refresh_token: newRaw, token_type: 'Bearer', expires_in: expiresInSec };
}

export async function revokeRefreshToken(presented: string): Promise<void> {
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { token_hash: hashToken(presented), revoked_at: { [Op.is]: null } } },
  );
}

export async function revokeAllRefreshTokensForUser(username: string): Promise<void> {
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { username, revoked_at: { [Op.is]: null } } },
  );
}

/* -------------------------------------------------------------------------- */
/* Password reset tokens (opaque, hashed in DB)                               */
/* -------------------------------------------------------------------------- */

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashPasswordResetToken(token: string): string {
  return hashToken(token);
}
