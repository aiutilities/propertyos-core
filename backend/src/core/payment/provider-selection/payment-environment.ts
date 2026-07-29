export type PaymentEnvironmentClass =
  | 'DEVELOPMENT'
  | 'TEST'
  | 'PRODUCTION';

export function currentPaymentEnvironmentClass(
  nodeEnvironment:
    string | undefined,
): PaymentEnvironmentClass {
  const normalized =
    nodeEnvironment
      ?.trim()
      .toLowerCase();

  if (
    normalized ===
    'production'
  ) {
    return 'PRODUCTION';
  }

  if (
    normalized ===
    'test'
  ) {
    return 'TEST';
  }

  return 'DEVELOPMENT';
}
