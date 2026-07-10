import { Injectable } from '@nestjs/common';
import { RegisterThemePackageDto } from '../dto/register-theme-package.dto';

@Injectable()
export class ThemePackageValidator {
  validate(dto: RegisterThemePackageDto): string[] {
    const errors: string[] = [];

    if (!dto.name?.trim()) {
      errors.push('Theme package name is required');
    }

    if (!dto.version?.trim()) {
      errors.push('Theme package version is required');
    }

    if (!dto.manifest) {
      errors.push('Theme manifest is required');
      return errors;
    }

    if (!dto.manifest.name?.trim()) {
      errors.push('Theme manifest name is required');
    }

    if (!dto.manifest.version?.trim()) {
      errors.push('Theme manifest version is required');
    }

    return errors;
  }
}
