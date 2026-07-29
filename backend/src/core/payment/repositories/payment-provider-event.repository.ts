import {
  PaymentProviderEvent,
} from '../entities';

export abstract class PaymentProviderEventRepository {
  abstract create(
    event:
      PaymentProviderEvent,
  ): Promise<
    PaymentProviderEvent
  >;

  abstract findByProviderEventId(
    providerName:
      string,

    providerEventId:
      string,
  ): Promise<
    PaymentProviderEvent |
    null
  >;

  abstract listByPaymentId(
    paymentId:
      string,
  ): Promise<
    PaymentProviderEvent[]
  >;
}
