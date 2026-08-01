import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ReleaseStockReservationDto {
  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @IsUUID()
  releasedByPersonId!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
