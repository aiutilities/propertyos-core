import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '@propertyos/core-contracts';

export class OutstandingRentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  dueFrom?: string;

  @IsOptional()
  @IsDateString()
  dueTo?: string;
}
