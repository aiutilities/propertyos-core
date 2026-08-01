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

export class ReceiveStockTransferItemDto {
  @IsUUID()
  transferItemId!: string;

  @IsNumber()
  @Min(0.000001)
  quantity!: number;
}

export class ReceiveStockTransferDto {
  @IsUUID()
  receivedByPersonId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(
    () =>
      ReceiveStockTransferItemDto,
  )
  items!:
    ReceiveStockTransferItemDto[];
}
