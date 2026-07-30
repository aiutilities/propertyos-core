import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PlaceDetailsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  placeId!:
    string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  providerName?:
    string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  language?:
    string;
}
