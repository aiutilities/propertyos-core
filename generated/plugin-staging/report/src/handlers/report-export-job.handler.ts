import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import { EventBusService } from '@propertyos/core-contracts';
import { ReportExportService } from '../services/report-export.service';
import { OutstandingRentQueryDto } from '../dto/outstanding-rent-query.dto';
import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import { SchedulerHandlerRegistry } from '@propertyos/core-contracts';
import {
  REPORT_EXPORT_JOB_TYPE,
  ReportExportJobPayload,
  ScheduledReportFormat,
  ScheduledReportType,
} from '@propertyos/core-contracts';
import {
  SchedulerJob,
  SchedulerJobHandler,
} from '@propertyos/core-contracts';

@Injectable()
export class ReportExportJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType = REPORT_EXPORT_JOB_TYPE;

  constructor(
    private readonly handlerRegistry: SchedulerHandlerRegistry,
    private readonly reportExportService: ReportExportService,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit(): void {
    this.handlerRegistry.register(this);
  }

  async handle(job: SchedulerJob): Promise<void> {
    const payload = this.validatePayload(job.payload);

    try {
      const file = await this.generateExport(payload);
      const sizeBytes = Buffer.isBuffer(file.content)
        ? file.content.length
        : Buffer.byteLength(file.content, 'utf8');

      await this.eventBus.publish(
        'report.export.generated',
        'scheduler.report-export',
        {
          jobId: job.id,
          jobName: job.name,
          reportType: payload.reportType,
          format: payload.format,
          filename: file.filename,
          contentType: file.contentType,
          sizeBytes,
          recipients: payload.recipients,
          channel: payload.channel,
          filters: payload.filters ?? {},
        },
        {
          correlationId: job.id,
          metadata: {
            schedulerJobType: this.jobType,
          },
        },
      );
    } catch (error) {
      await this.eventBus.publish(
        'report.export.failed',
        'scheduler.report-export',
        {
          jobId: job.id,
          jobName: job.name,
          reportType: payload.reportType,
          format: payload.format,
          recipients: payload.recipients,
          channel: payload.channel,
          filters: payload.filters ?? {},
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Unknown report export error',
        },
        {
          correlationId: job.id,
          metadata: {
            schedulerJobType: this.jobType,
          },
        },
      );

      throw error;
    }
  }

  private generateExport(payload: ReportExportJobPayload) {
    const filters = payload.filters ?? {};

    if (payload.reportType === 'RENT_COLLECTION') {
      const query = filters as RentCollectionQueryDto;

      return payload.format === 'CSV'
        ? this.reportExportService.exportRentCollectionCsv(query)
        : this.reportExportService.exportRentCollectionPdf(query);
    }

    const query = filters as OutstandingRentQueryDto;

    return payload.format === 'CSV'
      ? this.reportExportService.exportOutstandingRentCsv(query)
      : this.reportExportService.exportOutstandingRentPdf(query);
  }

  private validatePayload(
    value: Record<string, unknown>,
  ): ReportExportJobPayload {
    const reportType = value.reportType;
    const format = value.format;
    const recipients = value.recipients;
    const channel = value.channel;
    const filters = value.filters;

    if (!this.isReportType(reportType)) {
      throw new BadRequestException(
        'REPORT_EXPORT payload requires reportType RENT_COLLECTION or OUTSTANDING_RENT',
      );
    }

    if (!this.isFormat(format)) {
      throw new BadRequestException(
        'REPORT_EXPORT payload requires format CSV or PDF',
      );
    }

    if (
      !Array.isArray(recipients) ||
      recipients.length === 0 ||
      recipients.some(
        (recipient) =>
          typeof recipient !== 'string' ||
          !recipient.trim(),
      )
    ) {
      throw new BadRequestException(
        'REPORT_EXPORT payload requires at least one recipient',
      );
    }

    if (
      typeof channel !== 'string' ||
      !['EMAIL', 'WHATSAPP', 'IN_APP'].includes(channel)
    ) {
      throw new BadRequestException(
        'REPORT_EXPORT payload requires channel EMAIL, WHATSAPP or IN_APP',
      );
    }

    if (
      filters !== undefined &&
      (filters === null ||
        Array.isArray(filters) ||
        typeof filters !== 'object')
    ) {
      throw new BadRequestException(
        'REPORT_EXPORT filters must be an object',
      );
    }

    return {
      reportType,
      format,
      recipients: recipients.map((recipient) =>
        recipient.trim(),
      ),
      channel: channel as ReportExportJobPayload['channel'],
      filters:
        filters === undefined
          ? {}
          : (filters as Record<string, unknown>),
    };
  }

  private isReportType(
    value: unknown,
  ): value is ScheduledReportType {
    return (
      value === 'RENT_COLLECTION' ||
      value === 'OUTSTANDING_RENT'
    );
  }

  private isFormat(
    value: unknown,
  ): value is ScheduledReportFormat {
    return value === 'CSV' || value === 'PDF';
  }
}
