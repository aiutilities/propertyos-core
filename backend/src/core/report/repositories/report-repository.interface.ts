import { OutstandingRentQueryDto } from '../dto/outstanding-rent-query.dto';
import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import { OutstandingRentReport } from '../types/outstanding-rent.types';
import { RentCollectionReport } from '../types/rent-collection.types';

export const REPORT_REPOSITORY = 'REPORT_REPOSITORY';

export interface ReportRepository {
  getRentCollection(
    query: RentCollectionQueryDto,
  ): Promise<RentCollectionReport>;

  getOutstandingRent(
    query: OutstandingRentQueryDto,
  ): Promise<OutstandingRentReport>;
}
