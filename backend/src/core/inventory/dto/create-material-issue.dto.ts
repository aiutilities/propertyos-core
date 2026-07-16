import {
  Type,
} from 'class-transformer';

import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  InventoryBatchAllocationStrategy,
} from '../types/inventory.types';

export class MaterialIssueBatchAllocationDto {
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
  @Type(
    () =>
      Boolean,
  )
  @IsBoolean()
  strict?: boolean;
}

export class CreateMaterialIssueItemDto {
  @IsUUID()
  itemId!: string;

  @IsOptional()
  @IsUUID()
  binLocationId?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(
    () =>
      MaterialIssueBatchAllocationDto,
  )
  allocation?:
    MaterialIssueBatchAllocationDto;

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

export class CreateMaterialIssueDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  storeId!: string;

  @IsDateString()
  issueDate!: string;

  @IsString()
  reasonCode!: string;

  @IsOptional()
  @IsString()
  reasonDescription?: string;

  @IsOptional()
  @IsUUID()
  requestedByPersonId?: string;

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
      CreateMaterialIssueItemDto,
  )
  items!:
    CreateMaterialIssueItemDto[];
}
