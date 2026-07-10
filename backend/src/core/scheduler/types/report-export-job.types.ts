import { NotificationChannel } from '../../notification/types/notification.types';

export const REPORT_EXPORT_JOB_TYPE = 'REPORT_EXPORT';

export type ScheduledReportType =
  | 'RENT_COLLECTION'
  | 'OUTSTANDING_RENT';

export type ScheduledReportFormat = 'CSV' | 'PDF';

export interface ReportExportJobPayload {
  reportType: ScheduledReportType;
  format: ScheduledReportFormat;
  filters?: Record<string, unknown>;
  recipients: string[];
  channel: NotificationChannel;
}
