export interface PaymentMoney {
  amountMinor: number;
  currency: string;
}

export function validatePaymentMoney(
  money: PaymentMoney,
): readonly string[] {
  const errors: string[] = [];

  if (
    !Number.isSafeInteger(
      money.amountMinor,
    ) ||
    money.amountMinor <= 0
  ) {
    errors.push(
      'Payment amount must be a positive safe integer in the currency minor unit',
    );
  }

  if (
    !/^[A-Z]{3}$/.test(
      money.currency,
    )
  ) {
    errors.push(
      'Payment currency must be a three-letter uppercase ISO currency code',
    );
  }

  return errors;
}
