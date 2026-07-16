import {
  Type,
} from 'class-transformer';

import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

import {
  InventoryBatchAllocationStrategy,
} from '../types/inventory.types';

export class AllocateInventoryBatchesDto {
  @IsUUID()
  itemId!: string;

  @IsUUID()
  storeId!: string;

  @IsOptional()
  @IsUUID()
  binLocationId?: string;

  @Type(
    () =>
      Number,
  )
  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @IsEnum(
    InventoryBatchAllocationStrategy,
  )
  strategy!:
    InventoryBatchAllocationStrategy;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(
    undefined,
    {
      each:
        true,
    },
  )
  manualBatchIds?: string[];

  @IsOptional()
  @IsDateString()
  asOf?: string;

  @IsOptional()
  @Type(
    () =>
      Boolean,
  )
  @IsBoolean()
  strict?: boolean;
}
