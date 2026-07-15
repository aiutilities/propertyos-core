import {
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateStockReservationDto {
  @IsUUID()
  itemId!: string;

  @IsUUID()
  storeId!: string;

  @IsOptional()
  @IsUUID()
  binLocationId?: string;

  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @IsString()
  sourceType!: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsUUID()
  reservedForPersonId?: string;

  @IsOptional()
  @IsUUID()
  createdByPersonId?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<
    string,
    unknown
  >;
}
