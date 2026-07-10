import { Inject, Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { OutstandingRentQueryDto } from '../dto/outstanding-rent-query.dto';
import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import {
  REPORT_REPOSITORY,
  ReportRepository,
} from '../repositories/report-repository.interface';
import { OutstandingRentReport } from '../types/outstanding-rent.types';
import { RentCollectionReport } from '../types/rent-collection.types';
import { ReportExport } from '../types/report-export.types';

type PdfColumn = {
  header: string;
  width: number;
  value: (row: any) => string;
};

@Injectable()
export class ReportExportService {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
  ) {}

  async exportRentCollectionCsv(
    query: RentCollectionQueryDto,
  ): Promise<ReportExport> {
    const report = await this.getFullRentCollection(query);

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
      ...report.items.map((item) => [
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
    const report = await this.getFullOutstandingRent(query);

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
      ...report.items.map((item) => [
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

  async exportRentCollectionPdf(
    query: RentCollectionQueryDto,
  ): Promise<ReportExport> {
    const report = await this.getFullRentCollection(query);

    const content = await this.createPdf({
      title: 'Rent Collection Report',
      subtitle: this.describeRentCollectionFilters(query),
      summary: [
        [
          'Total Collected',
          this.formatCurrency(report.summary.totalCollected),
        ],
        ['Payment Count', String(report.summary.paymentCount)],
      ],
      rows: report.items,
      columns: [
        {
          header: 'Date',
          width: 58,
          value: (row) => row.paymentDate,
        },
        {
          header: 'Receipt',
          width: 72,
          value: (row) => row.receiptNumber ?? '-',
        },
        {
          header: 'Property',
          width: 86,
          value: (row) => row.propertyName,
        },
        {
          header: 'Tenant',
          width: 92,
          value: (row) =>
            `${row.tenantName}\n${row.tenantNumber}`,
        },
        {
          header: 'Agreement',
          width: 72,
          value: (row) => row.agreementNumber,
        },
        {
          header: 'Amount',
          width: 67,
          value: (row) => this.formatCurrency(row.amount),
        },
        {
          header: 'Mode',
          width: 58,
          value: (row) => row.paymentMode,
        },
        {
          header: 'Reference',
          width: 78,
          value: (row) => row.referenceNumber ?? '-',
        },
      ],
      orientation: 'landscape',
    });

    return {
      content,
      filename: `rent-collection-${this.today()}.pdf`,
      contentType: 'application/pdf',
    };
  }

  async exportOutstandingRentPdf(
    query: OutstandingRentQueryDto,
  ): Promise<ReportExport> {
    const report = await this.getFullOutstandingRent(query);

    const content = await this.createPdf({
      title: 'Outstanding Rent Report',
      subtitle: this.describeOutstandingRentFilters(query),
      summary: [
        [
          'Total Rent Billed',
          this.formatCurrency(report.summary.totalRentBilled),
        ],
        [
          'Total Paid',
          this.formatCurrency(report.summary.totalAmountPaid),
        ],
        [
          'Total Outstanding',
          this.formatCurrency(report.summary.totalOutstanding),
        ],
        ['Outstanding Ledgers', String(report.summary.ledgerCount)],
        [
          'Overdue Ledgers',
          String(report.summary.overdueLedgerCount),
        ],
      ],
      rows: report.items,
      columns: [
        {
          header: 'Due Date',
          width: 58,
          value: (row) => row.dueDate,
        },
        {
          header: 'Period',
          width: 50,
          value: (row) =>
            `${String(row.periodMonth).padStart(2, '0')}/${row.periodYear}`,
        },
        {
          header: 'Property',
          width: 78,
          value: (row) => row.propertyName,
        },
        {
          header: 'Tenant',
          width: 90,
          value: (row) =>
            `${row.tenantName}\n${row.tenantNumber}`,
        },
        {
          header: 'Agreement',
          width: 68,
          value: (row) => row.agreementNumber,
        },
        {
          header: 'Rent',
          width: 68,
          value: (row) => this.formatCurrency(row.rentAmount),
        },
        {
          header: 'Paid',
          width: 68,
          value: (row) => this.formatCurrency(row.amountPaid),
        },
        {
          header: 'Balance',
          width: 72,
          value: (row) =>
            this.formatCurrency(row.balanceAmount),
        },
        {
          header: 'Status',
          width: 55,
          value: (row) => row.status,
        },
        {
          header: 'Overdue',
          width: 55,
          value: (row) =>
            row.overdueDays > 0
              ? `${row.overdueDays} days`
              : '-',
        },
      ],
      orientation: 'landscape',
    });

    return {
      content,
      filename: `outstanding-rent-${this.today()}.pdf`,
      contentType: 'application/pdf',
    };
  }

  private async getFullRentCollection(
    query: RentCollectionQueryDto,
  ): Promise<RentCollectionReport> {
    const items = [];
    let page = 1;
    let totalPages = 1;
    let summary = {
      totalCollected: 0,
      paymentCount: 0,
    };

    do {
      const report = await this.reportRepository.getRentCollection({
        ...query,
        page,
        limit: 100,
      });

      items.push(...report.items);
      totalPages = report.totalPages;
      summary = report.summary;
      page += 1;
    } while (page <= totalPages);

    return {
      items,
      page: 1,
      limit: Math.max(items.length, 1),
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      summary,
    };
  }

  private async getFullOutstandingRent(
    query: OutstandingRentQueryDto,
  ): Promise<OutstandingRentReport> {
    const items = [];
    let page = 1;
    let totalPages = 1;
    let summary = {
      totalRentBilled: 0,
      totalAmountPaid: 0,
      totalOutstanding: 0,
      ledgerCount: 0,
      overdueLedgerCount: 0,
    };

    do {
      const report =
        await this.reportRepository.getOutstandingRent({
          ...query,
          page,
          limit: 100,
        });

      items.push(...report.items);
      totalPages = report.totalPages;
      summary = report.summary;
      page += 1;
    } while (page <= totalPages);

    return {
      items,
      page: 1,
      limit: Math.max(items.length, 1),
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      summary,
    };
  }

  private createPdf(input: {
    title: string;
    subtitle: string;
    summary: Array<[string, string]>;
    rows: any[];
    columns: PdfColumn[];
    orientation?: 'portrait' | 'landscape';
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({
        size: 'A4',
        layout: input.orientation ?? 'portrait',
        margin: 36,
        bufferPages: true,
        info: {
          Title: input.title,
          Author: 'PropertyOS',
          Creator: 'PropertyOS Report Engine',
        },
      });

      const chunks: Buffer[] = [];

      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('error', reject);
      document.on('end', () =>
        resolve(Buffer.concat(chunks)),
      );

      this.drawPdfHeader(
        document,
        input.title,
        input.subtitle,
      );

      this.drawSummary(document, input.summary);

      let tableY = document.y + 14;

      tableY = this.drawTableHeader(
        document,
        input.columns,
        tableY,
      );

      for (const row of input.rows) {
        const values = input.columns.map((column) =>
          column.value(row),
        );

        const rowHeight = this.calculateRowHeight(
          document,
          input.columns,
          values,
        );

        if (
          tableY + rowHeight >
          document.page.height - 58
        ) {
          document.addPage();

          this.drawPdfHeader(
            document,
            input.title,
            'Continued',
            true,
          );

          tableY = this.drawTableHeader(
            document,
            input.columns,
            document.y + 8,
          );
        }

        this.drawTableRow(
          document,
          input.columns,
          values,
          tableY,
          rowHeight,
        );

        tableY += rowHeight;
      }

      if (input.rows.length === 0) {
        document
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#606779')
          .text(
            'No records matched the selected filters.',
            36,
            tableY + 16,
          );
      }

      const pageRange = document.bufferedPageRange();

      for (
        let index = pageRange.start;
        index < pageRange.start + pageRange.count;
        index += 1
      ) {
        document.switchToPage(index);

        document
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#7a8292')
          .text(
            `Generated ${new Date().toISOString()}  •  Page ${
              index + 1
            } of ${pageRange.count}`,
            36,
            document.page.height - 30,
            {
              width: document.page.width - 72,
              align: 'center',
            },
          );
      }

      document.end();
    });
  }

  private drawPdfHeader(
    document: PDFKit.PDFDocument,
    title: string,
    subtitle: string,
    compact = false,
  ): void {
    document
      .font('Helvetica-Bold')
      .fontSize(compact ? 15 : 20)
      .fillColor('#151922')
      .text('PropertyOS', {
        continued: false,
      });

    document
      .moveDown(0.2)
      .font('Helvetica-Bold')
      .fontSize(compact ? 13 : 17)
      .fillColor('#3347d9')
      .text(title);

    document
      .moveDown(0.25)
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#606779')
      .text(subtitle || 'All records');

    document.moveDown(compact ? 0.5 : 0.8);
  }

  private drawSummary(
    document: PDFKit.PDFDocument,
    summary: Array<[string, string]>,
  ): void {
    const availableWidth = document.page.width - 72;
    const gap = 8;
    const columnWidth =
      (availableWidth - gap * (summary.length - 1)) /
      summary.length;
    const startX = 36;
    const startY = document.y;

    summary.forEach(([label, value], index) => {
      const x = startX + index * (columnWidth + gap);

      document
        .roundedRect(x, startY, columnWidth, 48, 5)
        .fillAndStroke('#f8f9fc', '#e4e7ef');

      document
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#606779')
        .text(label, x + 8, startY + 8, {
          width: columnWidth - 16,
        });

      document
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#151922')
        .text(value, x + 8, startY + 25, {
          width: columnWidth - 16,
        });
    });

    document.y = startY + 48;
  }

  private drawTableHeader(
    document: PDFKit.PDFDocument,
    columns: PdfColumn[],
    y: number,
  ): number {
    let x = 36;
    const height = 26;

    for (const column of columns) {
      document
        .rect(x, y, column.width, height)
        .fillAndStroke('#eef1ff', '#d8ddea');

      document
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#3347d9')
        .text(column.header, x + 4, y + 8, {
          width: column.width - 8,
          ellipsis: true,
        });

      x += column.width;
    }

    return y + height;
  }

  private calculateRowHeight(
    document: PDFKit.PDFDocument,
    columns: PdfColumn[],
    values: string[],
  ): number {
    document.font('Helvetica').fontSize(7);

    const contentHeight = Math.max(
      ...values.map((value, index) =>
        document.heightOfString(value, {
          width: columns[index].width - 8,
        }),
      ),
    );

    return Math.max(24, contentHeight + 10);
  }

  private drawTableRow(
    document: PDFKit.PDFDocument,
    columns: PdfColumn[],
    values: string[],
    y: number,
    height: number,
  ): void {
    let x = 36;

    values.forEach((value, index) => {
      const column = columns[index];

      document
        .rect(x, y, column.width, height)
        .fillAndStroke('#ffffff', '#edf0f5');

      document
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#151922')
        .text(value, x + 4, y + 5, {
          width: column.width - 8,
          height: height - 8,
          ellipsis: true,
        });

      x += column.width;
    });
  }

  private describeRentCollectionFilters(
    query: RentCollectionQueryDto,
  ): string {
    return this.describeFilters([
      ['From', query.fromDate],
      ['To', query.toDate],
      ['Property ID', query.propertyId],
      ['Tenant ID', query.tenantId],
      ['Payment Mode', query.paymentMode],
      ['Search', query.search],
      ['Sort', query.sortBy],
      ['Order', query.sortOrder],
    ]);
  }

  private describeOutstandingRentFilters(
    query: OutstandingRentQueryDto,
  ): string {
    return this.describeFilters([
      ['Due From', query.dueFrom],
      ['Due To', query.dueTo],
      ['Property ID', query.propertyId],
      ['Tenant ID', query.tenantId],
      ['Status', query.status],
      ['Search', query.search],
      ['Sort', query.sortBy],
      ['Order', query.sortOrder],
    ]);
  }

  private describeFilters(
    filters: Array<[string, unknown]>,
  ): string {
    const active = filters
      .filter(([, value]) => Boolean(value))
      .map(([label, value]) => `${label}: ${String(value)}`);

    return active.length > 0
      ? active.join('  •  ')
      : 'All records';
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

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  }

  private today(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
