import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class FulfillStockReservationDto {
  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @IsUUID()
  fulfilledByPersonId!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
