import {
  Type,
} from 'class-transformer';

import {
  IsInt,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class MapsGeocodeQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  query!:
    string;

  @IsOptional()
  @IsISO31661Alpha2()
  countryCode?:
    string;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit?:
    number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  language?:
    string;
}
