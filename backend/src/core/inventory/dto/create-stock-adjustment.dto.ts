import { IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockAdjustmentItemDto {

  @IsUUID()
  itemId!: string;

  @IsOptional()
  @IsUUID()
  binLocationId?: string;

  @IsNumber()
  quantityDelta!: number;

  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateStockAdjustmentDto {

  @IsUUID()
  propertyId!: string;

  @IsUUID()
  storeId!: string;

  @IsDateString()
  adjustmentDate!: string;

  @IsString()
  reasonCode!: string;

  @IsOptional()
  @IsString()
  reasonDescription?: string;

  @IsUUID()
  createdByPersonId!: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateStockAdjustmentItemDto)
  @IsArray()
  items!: CreateStockAdjustmentItemDto[];
}
