import {
  Type,
} from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class DispatchStockTransferItemDto {
  @IsUUID()
  transferItemId!: string;

  @IsNumber()
  @Min(0.000001)
  quantity!: number;
}

export class DispatchStockTransferDto {
  @IsUUID()
  dispatchedByPersonId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      DispatchStockTransferItemDto,
  )
  items!:
    DispatchStockTransferItemDto[];
}
