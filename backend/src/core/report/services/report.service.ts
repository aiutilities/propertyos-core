import { Inject, Injectable } from '@nestjs/common';

import { OutstandingRentQueryDto } from '../dto/outstanding-rent-query.dto';
import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import {
  REPORT_REPOSITORY,
  ReportRepository,
} from '../repositories/report-repository.interface';

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
}
