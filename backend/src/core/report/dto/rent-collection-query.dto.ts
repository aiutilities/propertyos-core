import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../platform';

export class RentCollectionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  paymentMode?: string;
}
