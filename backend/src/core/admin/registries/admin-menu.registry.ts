import { Injectable } from '@nestjs/common';
import { AdminMenuItem } from '../types/admin.types';

@Injectable()
export class AdminMenuRegistry {
  private readonly items = new Map<string, AdminMenuItem>();

  register(item: AdminMenuItem): void {
    this.items.set(item.id, item);
  }

  list(): AdminMenuItem[] {
    return [...this.items.values()].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    );
  }
}
