import { Inject, Injectable } from '@nestjs/common';

import { OutstandingRentQueryDto } from '../dto/outstanding-rent-query.dto';
import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import {
  REPORT_REPOSITORY,
  ReportRepository,
} from '../repositories/report-repository.interface';
import { ReportExportService } from './report-export.service';

@Injectable()
export class ReportService {
  constructor(
    @Inject(REPORT_REPOSITORY)
    private readonly reportRepository: ReportRepository,
    private readonly reportExportService: ReportExportService,
  ) {}

  getRentCollection(query: RentCollectionQueryDto) {
    return this.reportRepository.getRentCollection(query);
  }

  getOutstandingRent(query: OutstandingRentQueryDto) {
    return this.reportRepository.getOutstandingRent(query);
  }

  exportRentCollectionCsv(query: RentCollectionQueryDto) {
    return this.reportExportService.exportRentCollectionCsv(query);
  }

  exportOutstandingRentCsv(query: OutstandingRentQueryDto) {
    return this.reportExportService.exportOutstandingRentCsv(query);
  }

  exportRentCollectionPdf(query: RentCollectionQueryDto) {
    return this.reportExportService.exportRentCollectionPdf(query);
  }

  exportOutstandingRentPdf(query: OutstandingRentQueryDto) {
    return this.reportExportService.exportOutstandingRentPdf(query);
  }
}
