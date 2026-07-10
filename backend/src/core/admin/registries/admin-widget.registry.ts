import { Injectable } from '@nestjs/common';
import { AdminDashboardWidget } from '../types/admin.types';

@Injectable()
export class AdminWidgetRegistry {
  private readonly widgets = new Map<string, AdminDashboardWidget>();

  register(widget: AdminDashboardWidget): void {
    this.widgets.set(widget.id, widget);
  }

  list(): AdminDashboardWidget[] {
    return [...this.widgets.values()].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    );
  }
}
