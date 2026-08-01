import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  PROCUREMENT_QUOTATION_REPOSITORY,
  ProcurementQuotationDetails,
  ProcurementQuotationRepository,
} from '../repositories/procurement-quotation.repository';

import {
  ProcurementQuotationItem,
  QuotationStatus,
  RfqStatus,
} from '../types/procurement.types';

import {
  ProcurementQuotationComparison,
  QuotationComparisonEntry,
  QuotationItemComparison,
  QuotationItemComparisonEntry,
} from '../quotation/quotation-comparison.types';

import {
  ProcurementRfqService,
} from './procurement-rfq.service';

@Injectable()
export class ProcurementQuotationComparisonService {
  constructor(
    @Inject(
      PROCUREMENT_QUOTATION_REPOSITORY,
    )
    private readonly quotationRepository:
      ProcurementQuotationRepository,

    private readonly rfqService:
      ProcurementRfqService,
  ) {}

  async compare(
    rfqId: string,
  ): Promise<
    ProcurementQuotationComparison
  > {
    const rfq =
      await this.rfqService.get(
        rfqId,
      );

    if (
      ![
        RfqStatus.OPEN,
        RfqStatus.CLOSED,
        RfqStatus.AWARDED,
      ].includes(
        rfq.status,
      )
    ) {
      throw new BadRequestException(
        `RFQ quotations cannot be compared in ${rfq.status} status`,
      );
    }

    const summaries =
      await this.quotationRepository
        .list({
          rfqId,
        });

    const details =
      (
        await Promise.all(
          summaries.map(
            (
              quotation,
            ) =>
              this.quotationRepository
                .findById(
                  quotation.id,
                ),
          ),
        )
      ).filter(
        (
          quotation,
        ): quotation is
          ProcurementQuotationDetails =>
          quotation !== null,
      );

    const comparable =
      details.filter(
        (
          quotation,
        ) =>
          [
            QuotationStatus.SUBMITTED,
            QuotationStatus.SELECTED,
            QuotationStatus.REJECTED,
          ].includes(
            quotation.status,
          ),
      );

    this.validateCurrencies(
      comparable,
    );

    return {
      rfqId:
        rfq.id,

      rfqNumber:
        rfq.rfqNumber,

      propertyId:
        rfq.propertyId,

      currency:
        comparable[0]
          ?.currency ??
        rfq.currency,

      quotationCount:
        details.length,

      comparableQuotationCount:
        comparable.length,

      generatedAt:
        new Date(),

      commercialRanking:
        this.buildCommercialRanking(
          comparable,
        ),

      itemComparisons:
        this.buildItemComparisons(
          comparable,
        ),
    };
  }

  private buildCommercialRanking(
    quotations:
      ProcurementQuotationDetails[],
  ): QuotationComparisonEntry[] {
    return quotations
      .slice()
      .sort(
        (
          first,
          second,
        ) =>
          first.totalAmount -
            second.totalAmount ||
          this.deliveryRank(
            first.deliveryDays,
          ) -
            this.deliveryRank(
              second.deliveryDays,
            ) ||
          first.quotationNumber
            .localeCompare(
              second.quotationNumber,
            ),
      )
      .map(
        (
          quotation,
          index,
        ) => ({
          quotationId:
            quotation.id,

          quotationNumber:
            quotation.quotationNumber,

          vendorId:
            quotation.vendorId,

          status:
            quotation.status,

          currency:
            quotation.currency,

          subtotal:
            quotation.subtotal,

          discountAmount:
            quotation.discountAmount,

          taxAmount:
            quotation.taxAmount,

          freightAmount:
            quotation.freightAmount,

          totalAmount:
            quotation.totalAmount,

          deliveryDays:
            quotation.deliveryDays,

          validUntil:
            quotation.validUntil,

          commercialRank:
            index + 1,

          isLowestCommercialOffer:
            index === 0,
        }),
      );
  }

  private buildItemComparisons(
    quotations:
      ProcurementQuotationDetails[],
  ): QuotationItemComparison[] {
    const itemMap =
      new Map<
        string,
        Array<{
          quotation:
            ProcurementQuotationDetails;
          item:
            ProcurementQuotationItem;
        }>
      >();

    for (
      const quotation
      of quotations
    ) {
      for (
        const item
        of quotation.items
      ) {
        const current =
          itemMap.get(
            item.rfqItemId,
          ) ?? [];

        current.push({
          quotation,
          item,
        });

        itemMap.set(
          item.rfqItemId,
          current,
        );
      }
    }

    return Array.from(
      itemMap.entries(),
    )
      .map(
        (
          [
            rfqItemId,
            rows,
          ],
        ) => ({
          rfqItemId,

          entries:
            this.rankItems(
              rows,
            ),
        }),
      )
      .sort(
        (
          first,
          second,
        ) => {
          const firstLine =
            first.entries[0]
              ?.lineNumber ??
            Number.MAX_SAFE_INTEGER;

          const secondLine =
            second.entries[0]
              ?.lineNumber ??
            Number.MAX_SAFE_INTEGER;

          return (
            firstLine -
            secondLine
          );
        },
      );
  }

  private rankItems(
    rows: Array<{
      quotation:
        ProcurementQuotationDetails;
      item:
        ProcurementQuotationItem;
    }>,
  ): QuotationItemComparisonEntry[] {
    return rows
      .slice()
      .sort(
        (
          first,
          second,
        ) =>
          first.item.lineTotal -
            second.item.lineTotal ||
          this.deliveryRank(
            first.item
              .deliveryDays,
          ) -
            this.deliveryRank(
              second.item
                .deliveryDays,
            ) ||
          first.quotation
            .quotationNumber
            .localeCompare(
              second.quotation
                .quotationNumber,
            ),
      )
      .map(
        (
          row,
          index,
        ) => ({
          quotationId:
            row.quotation.id,

          quotationNumber:
            row.quotation
              .quotationNumber,

          vendorId:
            row.quotation
              .vendorId,

          quotationItemId:
            row.item.id,

          rfqItemId:
            row.item.rfqItemId,

          lineNumber:
            row.item.lineNumber,

          description:
            row.item.description,

          quantity:
            row.item.quantity,

          unit:
            row.item.unit,

          unitPrice:
            row.item.unitPrice,

          discountAmount:
            row.item
              .discountAmount,

          taxRate:
            row.item.taxRate,

          taxAmount:
            row.item.taxAmount,

          lineTotal:
            row.item.lineTotal,

          deliveryDays:
            row.item.deliveryDays,

          lineRank:
            index + 1,

          isLowestLineOffer:
            index === 0,
        }),
      );
  }

  private validateCurrencies(
    quotations:
      ProcurementQuotationDetails[],
  ) {
    const currencies =
      new Set(
        quotations.map(
          (
            quotation,
          ) =>
            quotation.currency,
        ),
      );

    if (
      currencies.size > 1
    ) {
      throw new BadRequestException(
        `Quotation comparison requires a common currency. Found: ${Array.from(
          currencies,
        ).join(', ')}`,
      );
    }
  }

  private deliveryRank(
    deliveryDays:
      number |
      undefined,
  ) {
    return (
      deliveryDays ??
      Number.MAX_SAFE_INTEGER
    );
  }
}
