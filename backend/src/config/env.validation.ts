const REQUIRED_IN_PRODUCTION = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'AUTH_SECRET',
] as const;

const INSECURE_AUTH_SECRETS = new Set([
  'propertyos-dev-secret-change-me',
  'change-me-in-production',
  'changeme',
  'secret',
]);

export function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const errors: string[] = [];

  if (nodeEnv === 'production') {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]) {
        errors.push(`${key} is required in production`);
      }
    }

    if (process.env.AUTH_SECRET && INSECURE_AUTH_SECRETS.has(process.env.AUTH_SECRET)) {
      errors.push('AUTH_SECRET must be changed in production');
    }

    if ((process.env.AUTH_SECRET?.length ?? 0) < 32) {
      errors.push('AUTH_SECRET must be at least 32 characters in production');
    }
  }

  if (process.env.POSTGRES_PORT && Number.isNaN(Number(process.env.POSTGRES_PORT))) {
    errors.push('POSTGRES_PORT must be a number');
  }

  if (
    process.env.RATE_LIMIT_TTL_MS &&
    Number.isNaN(Number(process.env.RATE_LIMIT_TTL_MS))
  ) {
    errors.push('RATE_LIMIT_TTL_MS must be a number');
  }

  if (
    process.env.RATE_LIMIT_MAX &&
    Number.isNaN(Number(process.env.RATE_LIMIT_MAX))
  ) {
    errors.push('RATE_LIMIT_MAX must be a number');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.join('; ')}`);
  }

  return true;
}
