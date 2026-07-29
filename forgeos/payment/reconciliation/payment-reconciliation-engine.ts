import {
  randomUUID,
} from 'node:crypto';

import {
  NoopPaymentEventPublisher,
  NoopPaymentLogger,
  PaymentEventPublisher,
  PaymentLogger,
} from '../ports';

import {
  compareReconciliationPayments,
} from './payment-reconciliation-comparator';

import {
  PaymentReconciliationPolicy,
  DEFAULT_PAYMENT_RECONCILIATION_POLICY,
} from './payment-reconciliation-policy';

import {
  PaymentReconciliationReport,
} from './payment-reconciliation-report';

import {
  NoopPaymentReconciliationReportStore,
  PaymentReconciliationReportStore,
} from './payment-reconciliation-report-store';

import {
  NoopPaymentReconciliationStateUpdater,
  PaymentReconciliationStateUpdater,
} from './payment-reconciliation-state-updater';

import {
  PaymentReconciliationLocalStore,
  PaymentReconciliationPeriod,
  PaymentReconciliationProvider,
  ReconciliationProviderPayment,
} from './payment-reconciliation.types';

export interface RunPaymentReconciliationInput {
  providerName:
    string;

  period:
    PaymentReconciliationPeriod;

  metadata?:
    Record<string, unknown>;

  correlationId?:
    string;

  causationId?:
    string;
}

export interface PaymentReconciliationEngineDependencies {
  providers:
    readonly PaymentReconciliationProvider[];

  localStore:
    PaymentReconciliationLocalStore;

  policy?:
    PaymentReconciliationPolicy;

  stateUpdater?:
    PaymentReconciliationStateUpdater;

  reportStore?:
    PaymentReconciliationReportStore;

  eventPublisher?:
    PaymentEventPublisher;

  logger?:
    PaymentLogger;

  now?:
    () => Date;

  createRunId?:
    () => string;
}

export class PaymentReconciliationEngine {
  private readonly providers =
    new Map<
      string,
      PaymentReconciliationProvider
    >();

  private readonly policy:
    PaymentReconciliationPolicy;

  private readonly stateUpdater:
    PaymentReconciliationStateUpdater;

  private readonly reportStore:
    PaymentReconciliationReportStore;

  private readonly eventPublisher:
    PaymentEventPublisher;

  private readonly logger:
    PaymentLogger;

  private readonly now:
    () => Date;

  private readonly createRunId:
    () => string;

  constructor(
    private readonly dependencies:
      PaymentReconciliationEngineDependencies,
  ) {
    for (
      const provider
      of dependencies.providers
    ) {
      this.providers.set(
        provider.name
          .trim()
          .toLowerCase(),

        provider,
      );
    }

    this.policy =
      dependencies.policy ??
      DEFAULT_PAYMENT_RECONCILIATION_POLICY;

    this.stateUpdater =
      dependencies.stateUpdater ??
      new NoopPaymentReconciliationStateUpdater();

    this.reportStore =
      dependencies.reportStore ??
      new NoopPaymentReconciliationReportStore();

    this.eventPublisher =
      dependencies.eventPublisher ??
      new NoopPaymentEventPublisher();

    this.logger =
      dependencies.logger ??
      new NoopPaymentLogger();

    this.now =
      dependencies.now ??
      (() => new Date());

    this.createRunId =
      dependencies.createRunId ??
      randomUUID;
  }

  async run(
    input:
      RunPaymentReconciliationInput,
  ): Promise<PaymentReconciliationReport> {
    const runId =
      this.createRunId();

    const started =
      this.now();

    const providerName =
      input.providerName
        .trim()
        .toLowerCase();

    const provider =
      this.providers.get(
        providerName,
      );

    if (!provider) {
      throw new Error(
        `PAYMENT_RECONCILIATION_PROVIDER_NOT_FOUND: ${providerName}`,
      );
    }

    await this.eventPublisher.publish({
      type:
        'payment.reconciliation.started',

      source:
        'forgeos.payment.reconciliation',

      payload: {
        runId,
        providerName,
        period:
          input.period,
      },

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      metadata:
        input.metadata,
    });

    try {
      const localPayments =
        await this.dependencies
          .localStore
          .listPayments({
            providerName,
            period:
              input.period,
          });

      const providerPayments:
        ReconciliationProviderPayment[] = [];

      let cursor:
        string | undefined;

      do {
        const page =
          await provider
            .listPayments({
              period:
                input.period,

              cursor,

              limit:
                100,
            });

        providerPayments.push(
          ...page.payments,
        );

        cursor =
          page.nextCursor;
      } while (cursor);

      const comparison =
        compareReconciliationPayments(
          localPayments,
          providerPayments,
          this.policy,
        );

      let automaticResolutionCount =
        0;

      for (
        const difference
        of comparison.differences
      ) {
        await this.eventPublisher.publish({
          type:
            'payment.reconciliation.difference',

          source:
            'forgeos.payment.reconciliation',

          payload: {
            runId,

            differenceId:
              difference.id,

            differenceType:
              difference.type,

            resolution:
              difference.resolution,

            paymentId:
              difference.paymentId,

            providerPaymentId:
              difference.providerPaymentId,
          },

          correlationId:
            input.correlationId,

          causationId:
            input.causationId,

          metadata:
            difference.metadata,
        });

        if (
          difference.resolution ===
            'AUTO_UPDATE_LOCAL_STATUS' &&
          difference.local &&
          difference.provider &&
          difference.type ===
            'STATUS_MISMATCH'
        ) {
          await this.stateUpdater
            .updateLocalPayment({
              local:
                difference.local,

              provider:
                difference.provider,

              reconciliationRunId:
                runId,
            });

          automaticResolutionCount +=
            1;

          await this.eventPublisher.publish({
            type:
              'payment.reconciliation.auto_fixed',

            source:
              'forgeos.payment.reconciliation',

            payload: {
              runId,

              differenceId:
                difference.id,

              paymentId:
                difference.paymentId,

              providerPaymentId:
                difference
                  .providerPaymentId,
            },

            correlationId:
              input.correlationId,

            causationId:
              input.causationId,

            metadata:
              difference.metadata,
          });
        }
      }

      const completed =
        this.now();

      const report:
        PaymentReconciliationReport = {
          runId,

          providerName,

          period:
            input.period,

          status:
            'COMPLETED',

          localPaymentCount:
            localPayments.length,

          providerPaymentCount:
            providerPayments.length,

          matchedCount:
            comparison.matchedCount,

          differenceCount:
            comparison
              .differences
              .length,

          automaticResolutionCount,

          manualReviewCount:
            comparison
              .differences
              .filter(
                (difference) =>
                  difference
                    .resolution ===
                  'MANUAL_REVIEW',
              )
              .length,

          differences:
            comparison.differences,

          startedAt:
            started.toISOString(),

          completedAt:
            completed.toISOString(),

          durationMilliseconds:
            completed.getTime() -
            started.getTime(),

          metadata:
            input.metadata,
        };

      await this.reportStore.save(
        report,
      );

      await this.eventPublisher.publish({
        type:
          'payment.reconciliation.completed',

        source:
          'forgeos.payment.reconciliation',

        payload: {
          runId,

          providerName,

          matchedCount:
            report.matchedCount,

          differenceCount:
            report.differenceCount,

          automaticResolutionCount:
            report
              .automaticResolutionCount,

          manualReviewCount:
            report
              .manualReviewCount,
        },

        correlationId:
          input.correlationId,

        causationId:
          input.causationId,

        metadata:
          input.metadata,
      });

      return report;
    } catch (error) {
      const completed =
        this.now();

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown reconciliation failure';

      const report:
        PaymentReconciliationReport = {
          runId,

          providerName,

          period:
            input.period,

          status:
            'FAILED',

          localPaymentCount:
            0,

          providerPaymentCount:
            0,

          matchedCount:
            0,

          differenceCount:
            0,

          automaticResolutionCount:
            0,

          manualReviewCount:
            0,

          differences: [],

          startedAt:
            started.toISOString(),

          completedAt:
            completed.toISOString(),

          durationMilliseconds:
            completed.getTime() -
            started.getTime(),

          errorMessage,

          metadata:
            input.metadata,
        };

      this.logger.error(
        'Payment reconciliation failed',
        {
          runId,
          providerName,
          error:
            errorMessage,
        },
      );

      await this.reportStore.save(
        report,
      );

      await this.eventPublisher.publish({
        type:
          'payment.reconciliation.failed',

        source:
          'forgeos.payment.reconciliation',

        payload: {
          runId,
          providerName,
          error:
            errorMessage,
        },

        correlationId:
          input.correlationId,

        causationId:
          input.causationId,

        metadata:
          input.metadata,
      });

      return report;
    }
  }
}
