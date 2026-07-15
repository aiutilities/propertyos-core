import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import {
  InventoryCycleCountScopeType,
} from '../types/inventory.types';

export class CreateCycleCountDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  storeId!: string;

  @IsDateString()
  countDate!: string;

  @IsOptional()
  @IsBoolean()
  blindCount?: boolean;

  @IsOptional()
  @IsBoolean()
  freezeStock?: boolean;

  @IsOptional()
  @IsEnum(
    InventoryCycleCountScopeType,
  )
  scopeType?:
    InventoryCycleCountScopeType;

  @IsOptional()
  @IsUUID()
  binLocationId?: string;

  @IsOptional()
  @IsUUID()
  itemId?: string;

  @IsUUID()
  createdByPersonId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<
    string,
    unknown
  >;
}
