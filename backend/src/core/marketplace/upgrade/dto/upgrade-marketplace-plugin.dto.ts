import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpgradeMarketplacePluginDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
