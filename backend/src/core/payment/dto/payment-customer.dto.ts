import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class PaymentCustomerDto {
  @IsOptional()
  @IsString()
  id?:
    string;

  @IsOptional()
  @IsString()
  name?:
    string;

  @IsOptional()
  @IsEmail()
  email?:
    string;

  @IsOptional()
  @IsString()
  phone?:
    string;

  @IsOptional()
  @IsObject()
  metadata?:
    Record<string, unknown>;
}
