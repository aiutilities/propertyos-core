import {
  IsInt,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class PaymentMoneyDto {
  @IsInt()
  @Min(1)
  amountMinor!:
    number;

  @IsString()
  @Matches(
    /^[A-Z]{3}$/,
  )
  currency!:
    string;
}
