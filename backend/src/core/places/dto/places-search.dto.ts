import {
  PLACE_CATEGORIES,
  PlaceCategory,
} from '@forgeos/places';

import {
  Type,
} from 'class-transformer';

import {
  IsArray,
  IsIn,
  IsInt,
  IsISO31661Alpha2,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  PlacesCoordinateDto,
} from './places-coordinate.dto';

export class PlacesSearchDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  query!:
    string;

  @IsOptional()
  @ValidateNested()
  @Type(
    () =>
      PlacesCoordinateDto,
  )
  coordinateBias?:
    PlacesCoordinateDto;

  @IsOptional()
  @Type(
    () =>
      Number,
  )
  @IsNumber()
  @Min(1)
  @Max(50000)
  radiusMeters?:
    number;

  @IsOptional()
  @IsArray()
  @IsIn(
    PLACE_CATEGORIES,
    {
      each:
        true,
    },
  )
  categories?:
    PlaceCategory[];

  @IsOptional()
  @IsISO31661Alpha2()
  countryCode?:
    string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  language?:
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
}
