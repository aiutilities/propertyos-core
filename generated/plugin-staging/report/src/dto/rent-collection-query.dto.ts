import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '@propertyos/core-contracts';

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
