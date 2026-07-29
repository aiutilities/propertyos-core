import {
  Type,
} from 'class-transformer';

import {
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  PaymentCustomerDto,
} from './payment-customer.dto';

import {
  PaymentMoneyDto,
} from './payment-money.dto';

export class CreatePaymentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  idempotencyKey!:
    string;

  @ValidateNested()
  @Type(
    () =>
      PaymentMoneyDto,
  )
  money!:
    PaymentMoneyDto;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  source!:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceReferenceId?:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?:
    string;

  @IsOptional()
  @ValidateNested()
  @Type(
    () =>
      PaymentCustomerDto,
  )
  customer?:
    PaymentCustomerDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  receiptReference?:
    string;

  @IsOptional()
  @IsUrl({
    require_tld:
      false,
  })
  returnUrl?:
    string;

  @IsOptional()
  @IsObject()
  metadata?:
    Record<string, unknown>;
}
