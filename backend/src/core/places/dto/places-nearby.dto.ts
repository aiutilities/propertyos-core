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

export class PlacesNearbyDto {
  @ValidateNested()
  @Type(
    () =>
      PlacesCoordinateDto,
  )
  coordinate!:
    PlacesCoordinateDto;

  @Type(
    () =>
      Number,
  )
  @IsNumber()
  @Min(1)
  @Max(50000)
  radiusMeters!:
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
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  keyword?:
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
