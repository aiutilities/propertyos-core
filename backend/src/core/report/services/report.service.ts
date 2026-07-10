import { Inject, Injectable } from '@nestjs/common';

import { OutstandingRentQueryDto } from '../dto/outstanding-rent-query.dto';
import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import {
  REPORT_REPOSITORY,
  ReportRepository,
} from '../repositories/report-repository.interface';
import { ReportExport } from '../types/report-export.types';

@Injectable()
export class ReportService {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  getRentCollection(query: RentCollectionQueryDto) {
    return this.reportRepository.getRentCollection(query);
  }

  getOutstandingRent(query: OutstandingRentQueryDto) {
    return this.reportRepository.getOutstandingRent(query);
  }

  async exportRentCollectionCsv(
    query: RentCollectionQueryDto,
  ): Promise<ReportExport> {
    const items = [];
    let page = 1;
    let totalPages = 1;

    do {
      const report = await this.reportRepository.getRentCollection({
        ...query,
        page,
        limit: 100,
      });

      items.push(...report.items);
      totalPages = report.totalPages;
      page += 1;
    } while (page <= totalPages);

    const rows: unknown[][] = [
      [
        'Payment Date',
        'Receipt Number',
        'Property',
        'Tenant Number',
        'Tenant Name',
        'Agreement Number',
        'Amount',
        'Payment Mode',
        'Reference Number',
        'Notes',
      ],
      ...items.map((item) => [
        item.paymentDate,
        item.receiptNumber ?? '',
        item.propertyName,
        item.tenantNumber,
        item.tenantName,
        item.agreementNumber,
        item.amount,
        item.paymentMode,
        item.referenceNumber ?? '',
        item.notes ?? '',
      ]),
    ];

    return {
      content: this.toCsv(rows),
      filename: `rent-collection-${this.today()}.csv`,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  async exportOutstandingRentCsv(
    query: OutstandingRentQueryDto,
  ): Promise<ReportExport> {
    const items = [];
    let page = 1;
    let totalPages = 1;

    do {
      const report = await this.reportRepository.getOutstandingRent({
        ...query,
        page,
        limit: 100,
      });

      items.push(...report.items);
      totalPages = report.totalPages;
      page += 1;
    } while (page <= totalPages);

    const rows: unknown[][] = [
      [
        'Due Date',
        'Period Year',
        'Period Month',
        'Property',
        'Tenant Number',
        'Tenant Name',
        'Agreement Number',
        'Rent Amount',
        'Amount Paid',
        'Outstanding Balance',
        'Status',
        'Overdue Days',
      ],
      ...items.map((item) => [
        item.dueDate,
        item.periodYear,
        item.periodMonth,
        item.propertyName,
        item.tenantNumber,
        item.tenantName,
        item.agreementNumber,
        item.rentAmount,
        item.amountPaid,
        item.balanceAmount,
        item.status,
        item.overdueDays,
      ]),
    ];

    return {
      content: this.toCsv(rows),
      filename: `outstanding-rent-${this.today()}.csv`,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  private toCsv(rows: unknown[][]): string {
    const body = rows
      .map((row) =>
        row
          .map((value) => this.escapeCsvValue(value))
          .join(','),
      )
      .join('\r\n');

    return `\uFEFF${body}\r\n`;
  }

  private escapeCsvValue(value: unknown): string {
    const text =
      value === null || value === undefined
        ? ''
        : String(value);

    if (
      text.includes(',') ||
      text.includes('"') ||
      text.includes('\r') ||
      text.includes('\n')
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  }

  private today(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
