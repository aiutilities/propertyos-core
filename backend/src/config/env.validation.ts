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

function validatePaymentProvider(
  errors: string[],
): void {
  const provider =
    process.env.PAYMENT_PROVIDER
      ?.trim()
      .toLowerCase();

  if (
    provider === undefined ||
    provider === '' ||
    provider === 'disabled' ||
    provider === 'razorpay' ||
    provider === 'stripe'
  ) {
    return;
  }

  errors.push(
    `PAYMENT_PROVIDER must be one of: disabled, razorpay, stripe`,
  );
}

export function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const errors: string[] = [];

  validatePaymentProvider(
    errors,
  );

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


  const positiveIntegerSettings = [
    'SCHEDULER_POLL_INTERVAL_MS',
    'SCHEDULER_BATCH_SIZE',
    'SCHEDULER_STALE_AFTER_MS',
    'SCHEDULER_RETRY_BASE_DELAY_MS',
    'SCHEDULER_MAX_RETRY_DELAY_MS',
  ];

  for (const key of positiveIntegerSettings) {
    const raw = process.env[key];

    if (
      raw !== undefined &&
      (!Number.isInteger(Number(raw)) || Number(raw) <= 0)
    ) {
      errors.push(`${key} must be a positive integer`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.join('; ')}`);
  }

  return true;
}
