import {
  Injectable,
} from '@nestjs/common';

import {
  PaymentReconciliationReport,
  PaymentReconciliationReportStore,
} from '@forgeos/payment';

import {
  PaymentReconciliationRepository,
} from '../../repositories';

@Injectable()
export class PropertyOSPaymentReconciliationReportStoreAdapter
  implements PaymentReconciliationReportStore
{
  constructor(
    private readonly repository:
      PaymentReconciliationRepository,
  ) {}

  async save(
    report:
      PaymentReconciliationReport,
  ): Promise<void> {
    const existing =
      await this.repository
        .findById(
          report.runId,
        );

    if (!existing) {
      await this.repository.create({
        id:
          report.runId,

        providerName:
          report.providerName,

        status:
          report.status ===
            'COMPLETED'
            ? 'COMPLETED'
            : 'FAILED',

        periodStart:
          new Date(
            report.period.start,
          ),

        periodEnd:
          new Date(
            report.period.end,
          ),

        examinedCount:
          report.localPaymentCount,

        matchedCount:
          report.matchedCount,

        mismatchCount:
          report.differenceCount,

        errorMessage:
          report.errorMessage,

        metadata: {
          ...report.metadata,

          providerPaymentCount:
            report
              .providerPaymentCount,

          automaticResolutionCount:
            report
              .automaticResolutionCount,

          manualReviewCount:
            report
              .manualReviewCount,

          differences:
            report.differences,
        },

        startedAt:
          new Date(
            report.startedAt,
          ),

        completedAt:
          new Date(
            report.completedAt,
          ),

        createdAt:
          new Date(
            report.startedAt,
          ),

        updatedAt:
          new Date(
            report.completedAt,
          ),
      });

      return;
    }

    await this.repository
      .updateStatus(
        report.runId,

        report.status ===
          'COMPLETED'
          ? 'COMPLETED'
          : 'FAILED',

        {
          examinedCount:
            report
              .localPaymentCount,

          matchedCount:
            report.matchedCount,

          mismatchCount:
            report
              .differenceCount,

          errorMessage:
            report.errorMessage,

          completedAt:
            new Date(
              report.completedAt,
            ),

          metadata: {
            ...report.metadata,

            providerPaymentCount:
              report
                .providerPaymentCount,

            automaticResolutionCount:
              report
                .automaticResolutionCount,

            manualReviewCount:
              report
                .manualReviewCount,

            differences:
              report.differences,
          },
        },
      );
  }
}
