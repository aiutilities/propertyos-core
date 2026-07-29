import {
  Type,
} from 'class-transformer';

import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  MapsCoordinateDto,
} from './maps-coordinate.dto';

export class MapsReverseGeocodeDto {
  @ValidateNested()
  @Type(
    () =>
      MapsCoordinateDto,
  )
  coordinate!:
    MapsCoordinateDto;

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
