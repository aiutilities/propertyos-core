import {
  PAYMENT_STATUSES,
  PaymentStatus,
} from '@forgeos/payment';

import {
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListPaymentsQueryDto {
  @IsOptional()
  @IsString()
  providerName?:
    string;

  @IsOptional()
  @IsIn(
    PAYMENT_STATUSES,
  )
  status?:
    PaymentStatus;

  @IsOptional()
  @IsString()
  source?:
    string;

  @IsOptional()
  @IsString()
  sourceReferenceId?:
    string;

  @IsOptional()
  @IsString()
  customerId?:
    string;
}
