export interface PaymentCustomer {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}
