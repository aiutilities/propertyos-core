export class PaymentOperationNotSupportedError
  extends Error
{
  readonly code =
    'PAYMENT_OPERATION_NOT_SUPPORTED';

  constructor(
    readonly providerName: string,
    readonly operation: string,
  ) {
    super(
      `Payment provider ${providerName} does not support ${operation}`,
    );

    this.name =
      'PaymentOperationNotSupportedError';
  }
}
