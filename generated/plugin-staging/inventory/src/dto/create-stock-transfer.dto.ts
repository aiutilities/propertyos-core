import {
  Type,
} from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateStockTransferItemDto {
  @IsUUID()
  itemId!: string;

  @IsOptional()
  @IsUUID()
  sourceBinLocationId?: string;

  @IsOptional()
  @IsUUID()
  destinationBinLocationId?: string;

  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateStockTransferDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  sourceStoreId!: string;

  @IsUUID()
  destinationStoreId!: string;

  @IsDateString()
  transferDate!: string;

  @IsUUID()
  createdByPersonId!: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      CreateStockTransferItemDto,
  )
  items!:
    CreateStockTransferItemDto[];
}
