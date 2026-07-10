import { Injectable } from '@nestjs/common';
import { ThemeEntity } from '../types/theme.types';

@Injectable()
export class ThemeRegistry {
  private readonly themes = new Map<string, ThemeEntity>();
  private activeThemeId?: string;

  register(theme: ThemeEntity): void {
    this.themes.set(theme.id, theme);
  }

  list(): ThemeEntity[] {
    return [...this.themes.values()];
  }

  get(id: string): ThemeEntity | undefined {
    return this.themes.get(id);
  }

  activate(id: string): ThemeEntity | undefined {
    const theme = this.themes.get(id);

    if (!theme) {
      return undefined;
    }

    for (const existingTheme of this.themes.values()) {
      existingTheme.status = 'INACTIVE';
    }

    theme.status = 'ACTIVE';
    theme.activatedAt = new Date();
    this.activeThemeId = id;

    return theme;
  }

  getActive(): ThemeEntity | undefined {
    if (!this.activeThemeId) {
      return undefined;
    }

    return this.themes.get(this.activeThemeId);
  }
}
