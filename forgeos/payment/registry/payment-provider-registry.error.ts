export class PaymentProviderNotFoundError
  extends Error
{
  readonly code =
    'PAYMENT_PROVIDER_NOT_FOUND';

  constructor(
    readonly providerName: string,
  ) {
    super(
      `Payment provider not found: ${providerName}`,
    );

    this.name =
      'PaymentProviderNotFoundError';
  }
}
