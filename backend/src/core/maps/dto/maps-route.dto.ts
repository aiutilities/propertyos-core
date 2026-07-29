import {
  MAP_TRAVEL_MODES,
  MapTravelMode,
} from '@forgeos/maps';

import {
  Type,
} from 'class-transformer';

import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import {
  MapsCoordinateDto,
} from './maps-coordinate.dto';

export class MapsRouteDto {
  @ValidateNested()
  @Type(
    () =>
      MapsCoordinateDto,
  )
  origin!:
    MapsCoordinateDto;

  @ValidateNested()
  @Type(
    () =>
      MapsCoordinateDto,
  )
  destination!:
    MapsCoordinateDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @ValidateNested({
    each:
      true,
  })
  @Type(
    () =>
      MapsCoordinateDto,
  )
  waypoints?:
    MapsCoordinateDto[];

  @IsOptional()
  @IsIn(
    MAP_TRAVEL_MODES,
  )
  travelMode?:
    MapTravelMode;

  @IsOptional()
  @IsBoolean()
  alternatives?:
    boolean;

  @IsOptional()
  @IsISO8601()
  departureTime?:
    string;
}
