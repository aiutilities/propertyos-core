import {
  randomUUID,
} from 'node:crypto';

import {
  PaymentReconciliationDifference,
  PaymentReconciliationDifferenceType,
} from './payment-reconciliation-difference';

import {
  PaymentReconciliationPolicy,
  resolvePaymentReconciliationAction,
} from './payment-reconciliation-policy';

import {
  ReconciliationLocalPayment,
  ReconciliationProviderPayment,
} from './payment-reconciliation.types';

function difference(
  type:
    PaymentReconciliationDifferenceType,

  message:
    string,

  policy:
    PaymentReconciliationPolicy,

  input: {
    providerName:
      string;

    paymentId?:
      string;

    providerPaymentId?:
      string;

    local?:
      ReconciliationLocalPayment;

    provider?:
      ReconciliationProviderPayment;

    metadata?:
      Record<string, unknown>;
  },
): PaymentReconciliationDifference {
  return {
    id:
      randomUUID(),

    type,

    providerName:
      input.providerName,

    paymentId:
      input.paymentId,

    providerPaymentId:
      input.providerPaymentId,

    local:
      input.local,

    provider:
      input.provider,

    resolution:
      resolvePaymentReconciliationAction(
        type,
        policy,
      ),

    message,

    metadata:
      input.metadata,
  };
}

export function compareReconciliationPayments(
  localPayments:
    readonly ReconciliationLocalPayment[],

  providerPayments:
    readonly ReconciliationProviderPayment[],

  policy:
    PaymentReconciliationPolicy,
): {
  matchedCount:
    number;

  differences:
    PaymentReconciliationDifference[];
} {
  const differences:
    PaymentReconciliationDifference[] = [];

  let matchedCount = 0;

  const providersByPaymentId =
    new Map<
      string,
      ReconciliationProviderPayment[]
    >();

  for (
    const providerPayment
    of providerPayments
  ) {
    const entries =
      providersByPaymentId.get(
        providerPayment
          .providerPaymentId,
      ) ?? [];

    entries.push(
      providerPayment,
    );

    providersByPaymentId.set(
      providerPayment
        .providerPaymentId,
      entries,
    );
  }

  for (
    const [
      providerPaymentId,
      matches,
    ]
    of providersByPaymentId
  ) {
    if (matches.length > 1) {
      differences.push(
        difference(
          'DUPLICATE_PROVIDER_PAYMENT',

          `Provider returned duplicate payment identifier: ${providerPaymentId}`,

          policy,

          {
            providerName:
              matches[0]
                .providerName,

            providerPaymentId,

            provider:
              matches[0],

            metadata: {
              duplicateCount:
                matches.length,
            },
          },
        ),
      );
    }
  }

  const localByProviderPaymentId =
    new Map<
      string,
      ReconciliationLocalPayment
    >();

  for (
    const localPayment
    of localPayments
  ) {
    if (
      localPayment
        .providerPaymentId
    ) {
      localByProviderPaymentId.set(
        localPayment
          .providerPaymentId,

        localPayment,
      );
    }
  }

  const usedProviderIds =
    new Set<string>();

  for (
    const localPayment
    of localPayments
  ) {
    const providerPaymentId =
      localPayment
        .providerPaymentId;

    if (!providerPaymentId) {
      differences.push(
        difference(
          'LOCAL_ONLY',

          `Local payment ${localPayment.paymentId} has no provider payment identifier`,

          policy,

          {
            providerName:
              localPayment
                .providerName,

            paymentId:
              localPayment
                .paymentId,

            local:
              localPayment,
          },
        ),
      );

      continue;
    }

    const providerPayment =
      providersByPaymentId
        .get(
          providerPaymentId,
        )
        ?.[0];

    if (!providerPayment) {
      differences.push(
        difference(
          'LOCAL_ONLY',

          `Local payment ${localPayment.paymentId} was not found at the provider`,

          policy,

          {
            providerName:
              localPayment
                .providerName,

            paymentId:
              localPayment
                .paymentId,

            providerPaymentId,

            local:
              localPayment,
          },
        ),
      );

      continue;
    }

    usedProviderIds.add(
      providerPaymentId,
    );

    let hasDifference =
      false;

    if (
      localPayment.status !==
      providerPayment.status
    ) {
      hasDifference = true;

      differences.push(
        difference(
          'STATUS_MISMATCH',

          `Payment status differs: local=${localPayment.status}, provider=${providerPayment.status}`,

          policy,

          {
            providerName:
              providerPayment
                .providerName,

            paymentId:
              localPayment
                .paymentId,

            providerPaymentId,

            local:
              localPayment,

            provider:
              providerPayment,
          },
        ),
      );
    }

    if (
      localPayment.money
        .amountMinor !==
      providerPayment.money
        .amountMinor
    ) {
      hasDifference = true;

      differences.push(
        difference(
          'AMOUNT_MISMATCH',

          `Payment amount differs: local=${localPayment.money.amountMinor}, provider=${providerPayment.money.amountMinor}`,

          policy,

          {
            providerName:
              providerPayment
                .providerName,

            paymentId:
              localPayment
                .paymentId,

            providerPaymentId,

            local:
              localPayment,

            provider:
              providerPayment,
          },
        ),
      );
    }

    if (
      localPayment.money
        .currency !==
      providerPayment.money
        .currency
    ) {
      hasDifference = true;

      differences.push(
        difference(
          'CURRENCY_MISMATCH',

          `Payment currency differs: local=${localPayment.money.currency}, provider=${providerPayment.money.currency}`,

          policy,

          {
            providerName:
              providerPayment
                .providerName,

            paymentId:
              localPayment
                .paymentId,

            providerPaymentId,

            local:
              localPayment,

            provider:
              providerPayment,
          },
        ),
      );
    }

    if (!hasDifference) {
      matchedCount += 1;
    }
  }

  for (
    const providerPayment
    of providerPayments
  ) {
    if (
      usedProviderIds.has(
        providerPayment
          .providerPaymentId,
      )
    ) {
      continue;
    }

    if (
      localByProviderPaymentId.has(
        providerPayment
          .providerPaymentId,
      )
    ) {
      continue;
    }

    differences.push(
      difference(
        'PROVIDER_ONLY',

        `Provider payment ${providerPayment.providerPaymentId} has no local payment record`,

        policy,

        {
          providerName:
            providerPayment
              .providerName,

          providerPaymentId:
            providerPayment
              .providerPaymentId,

          provider:
            providerPayment,
        },
      ),
    );
  }

  return {
    matchedCount,
    differences,
  };
}
