export class PaymentWebhookHandlerNameRequiredError
  extends Error
{
  readonly code =
    'PAYMENT_WEBHOOK_HANDLER_NAME_REQUIRED';

  constructor() {
    super(
      'Payment webhook handler name is required',
    );

    this.name =
      'PaymentWebhookHandlerNameRequiredError';
  }
}
