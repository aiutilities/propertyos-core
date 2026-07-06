import { ThemeManifest } from '../../types/theme.types';

export class RegisterThemePackageDto {
  name!: string;
  version!: string;
  sourcePath?: string;
  manifest!: ThemeManifest;
  metadata?: Record<string, unknown>;
}
