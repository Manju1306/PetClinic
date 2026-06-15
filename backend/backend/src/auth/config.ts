const isProd = process.env.NODE_ENV === 'production';

function requireSecret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (isProd) throw new Error(`${name} environment variable is required in production`);
  return devFallback;
}

export const authConfig = {
  accessSecret: requireSecret('JWT_ACCESS_SECRET', 'dev-only-access-secret-change-me'),
  refreshSecret: requireSecret('JWT_REFRESH_SECRET', 'dev-only-refresh-secret-change-me'),
  accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshTtlMs: parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'),
  passwordResetTtlMs: parseTtlMs(process.env.PASSWORD_RESET_TTL ?? '1h'),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
} as const;

function parseTtlMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) throw new Error(`Invalid TTL value: ${value}`);
  const n = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * multipliers[unit];
}
