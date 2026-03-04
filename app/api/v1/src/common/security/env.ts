import crypto from 'crypto';

const devSecretCache = new Map<string, string>();

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function parseBoolean(value: string | undefined, fallback = false) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

export function getRequiredSecret(name: string, minLength = 32): string {
  const value = process.env[name]?.trim();
  if (value && value.length >= minLength) {
    return value;
  }

  if (isProduction()) {
    throw new Error(
      `${name} must be set in production and contain at least ${minLength} characters`,
    );
  }

  const cached = devSecretCache.get(name);
  if (cached) return cached;

  const generated = crypto.randomBytes(48).toString('hex');
  devSecretCache.set(name, generated);
  return generated;
}
