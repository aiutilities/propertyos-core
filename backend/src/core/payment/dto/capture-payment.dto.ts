import {
  Type,
} from 'class-transformer';

import {
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  PaymentMoneyDto,
} from './payment-money.dto';

export class CapturePaymentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  idempotencyKey!:
    string;

  @IsOptional()
  @ValidateNested()
  @Type(
    () =>
      PaymentMoneyDto,
  )
  money?:
    PaymentMoneyDto;

  @IsOptional()
  @IsObject()
  metadata?:
    Record<string, unknown>;
}
