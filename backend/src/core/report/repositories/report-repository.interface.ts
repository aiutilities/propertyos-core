import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import { RentCollectionReport } from '../types/rent-collection.types';

export const REPORT_REPOSITORY = 'REPORT_REPOSITORY';

export interface ReportRepository {
  getRentCollection(
    query: RentCollectionQueryDto,
  ): Promise<RentCollectionReport>;
}
