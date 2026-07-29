import {
  PaymentEnvironmentClass,
} from './payment-environment';

export type PropertyOSPaymentProviderMode =
  | 'DISABLED'
  | 'RAZORPAY'
  | 'STRIPE';

export interface PaymentProviderSelectionInput {
  environmentClass:
    PaymentEnvironmentClass;

  configuredProvider?:
    string;
}

export interface PaymentProviderSelection {
  status:
    | 'READY'
    | 'BLOCKED';

  provider:
    PropertyOSPaymentProviderMode;

  enabled:
    boolean;

  realPaymentConfigured:
    boolean;

  environmentClass:
    PaymentEnvironmentClass;

  errors:
    readonly string[];
}
