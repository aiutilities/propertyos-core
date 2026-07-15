import {
  Type,
} from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecordCycleCountItemDto {
  @IsUUID()
  cycleCountItemId!: string;

  @IsNumber()
  @Min(0)
  countedQuantity!: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RecordCycleCountDto {
  @IsUUID()
  countedByPersonId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      RecordCycleCountItemDto,
  )
  items!:
    RecordCycleCountItemDto[];
}
