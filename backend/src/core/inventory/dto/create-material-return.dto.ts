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

export class CreateMaterialReturnItemDto {
  @IsUUID()
  itemId!: string;

  @IsOptional()
  @IsUUID()
  binLocationId?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

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

export class CreateMaterialReturnDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  storeId!: string;

  @IsOptional()
  @IsUUID()
  materialIssueId?: string;

  @IsDateString()
  returnDate!: string;

  @IsString()
  reasonCode!: string;

  @IsOptional()
  @IsString()
  reasonDescription?: string;

  @IsOptional()
  @IsUUID()
  returnedByPersonId?: string;

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
      CreateMaterialReturnItemDto,
  )
  items!:
    CreateMaterialReturnItemDto[];
}
