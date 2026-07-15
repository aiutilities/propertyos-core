import {
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ExpireStockReservationDto {
  @IsOptional()
  @IsUUID()
  expiredByPersonId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
