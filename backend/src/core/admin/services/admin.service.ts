import { Injectable, OnModuleInit } from '@nestjs/common';
import { AdminMenuRegistry } from '../registries/admin-menu.registry';
import { AdminWidgetRegistry } from '../registries/admin-widget.registry';
import { AdminDashboardSummary } from '../types/admin.types';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    private readonly menuRegistry: AdminMenuRegistry,
    private readonly widgetRegistry: AdminWidgetRegistry,
  ) {}

  onModuleInit(): void {
    this.registerCoreMenu();
    this.registerCoreWidgets();
  }

  getDashboard(): AdminDashboardSummary {
    return {
      platform: {
        name: 'PropertyOS',
        status: 'OK',
        version: '0.1.0',
      },
      plugins: {
        installed: 0,
        active: 0,
      },
      workflows: {
        enabled: true,
      },
      notifications: {
        enabled: true,
      },
    };
  }

  getMenu() {
    return this.menuRegistry.list();
  }

  getWidgets() {
    return this.widgetRegistry.list();
  }

  private registerCoreMenu(): void {
    this.menuRegistry.register({
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin',
      order: 1,
    });

    this.menuRegistry.register({
      id: 'plugins',
      label: 'Plugins',
      path: '/admin/plugins',
      order: 10,
    });

    this.menuRegistry.register({
      id: 'workflows',
      label: 'Workflows',
      path: '/admin/workflows',
      order: 20,
    });

    this.menuRegistry.register({
      id: 'notifications',
      label: 'Notifications',
      path: '/admin/notifications',
      order: 30,
    });

    this.menuRegistry.register({
      id: 'audit',
      label: 'Audit Logs',
      path: '/admin/audit',
      order: 40,
    });
  }

  private registerCoreWidgets(): void {
    this.widgetRegistry.register({
      id: 'platform-status',
      title: 'Platform Status',
      type: 'STATUS',
      order: 1,
    });

    this.widgetRegistry.register({
      id: 'installed-plugins',
      title: 'Installed Plugins',
      type: 'STAT',
      order: 2,
    });

    this.widgetRegistry.register({
      id: 'workflow-status',
      title: 'Workflow Status',
      type: 'STATUS',
      order: 3,
    });
  }
}
