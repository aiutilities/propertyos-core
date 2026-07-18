import { Injectable, OnModuleInit } from '@nestjs/common';
import { AgreementService } from '../../agreement/services/agreement.service';
import { PropertyService } from '../../property/services/property.service';
import { RentService } from '../../rent/services/rent.service';
import { TenantService } from '../../tenant/services/tenant.service';
import { PluginService } from '../../plugin/services/plugin.service';
import { PluginPermissionRegistry } from '../../plugin/registries/plugin-permission.registry';
import { PluginWorkflowRegistry } from '../../plugin/registries/plugin-workflow.registry';
import { PluginNotificationRegistry } from '../../plugin/registries/plugin-notification.registry';
import { PluginDocumentRegistry } from '../../plugin/registries/plugin-document.registry';
import { PluginConfigurationRegistry } from '../../plugin/registries/plugin-configuration.registry';
import { PluginSchedulerRegistry } from '../../plugin/registries/plugin-scheduler.registry';
import { PluginSearchRegistry } from '../../plugin/registries/plugin-search.registry';
import { PluginDashboardRegistry } from '../../plugin/registries/plugin-dashboard.registry';
import { AdminMenuRegistry } from '../registries/admin-menu.registry';
import { AdminWidgetRegistry } from '../registries/admin-widget.registry';
import { AdminDashboardSummary } from '../types/admin.types';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    private readonly menuRegistry: AdminMenuRegistry,
    private readonly widgetRegistry: AdminWidgetRegistry,
    private readonly pluginService: PluginService,
    private readonly permissionRegistry: PluginPermissionRegistry,
    private readonly workflowRegistry: PluginWorkflowRegistry,
    private readonly notificationRegistry: PluginNotificationRegistry,
    private readonly documentRegistry: PluginDocumentRegistry,
    private readonly configurationRegistry: PluginConfigurationRegistry,
    private readonly schedulerRegistry: PluginSchedulerRegistry,
    private readonly searchRegistry: PluginSearchRegistry,
    private readonly dashboardRegistry: PluginDashboardRegistry,
    private readonly propertyService: PropertyService,
    private readonly tenantService: TenantService,
    private readonly agreementService: AgreementService,
    private readonly rentService: RentService,
  ) {}

  onModuleInit(): void {
    this.registerCoreMenu();
    this.registerCoreWidgets();
  }

  async getDashboard(): Promise<AdminDashboardSummary> {
    const [
      portfolio,
      occupancy,
      tenants,
      agreements,
      rentLedgers,
      receiptMetrics,
      invoiceMetrics,
      plugins,
    ] = await Promise.all([
      this.propertyService.getPortfolioCounts(),
      this.tenantService.getOccupancyCounts(),
      this.tenantService.listTenants(),
      this.agreementService.listAgreements(),
      this.rentService.listRentLedgers(),
      this.dashboardRegistry.collect('receipt'),
      this.dashboardRegistry.collect('invoice'),
      this.pluginService.list(),
    ]);

    const activePlugins = plugins.filter(
      (plugin) => plugin.status === 'ACTIVE',
    );

    const failedPlugins = plugins.filter(
      (plugin) => plugin.status === 'FAILED',
    );

    const activeLeases = agreements.filter(
      (agreement) => agreement.status === 'ACTIVE',
    ).length;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const currentMonthLedgers = rentLedgers.filter(
      (ledger) =>
        ledger.periodYear === currentYear &&
        ledger.periodMonth === currentMonth,
    );

    const currentMonthExpectedRent = currentMonthLedgers.reduce(
      (total, ledger) => total + Number(ledger.rentAmount ?? 0),
      0,
    );

    const currentMonthCollectedRent = currentMonthLedgers.reduce(
      (total, ledger) => total + Number(ledger.amountPaid ?? 0),
      0,
    );

    const outstandingRent = rentLedgers.reduce(
      (total, ledger) => total + Number(ledger.balanceAmount ?? 0),
      0,
    );

    const vacantSpaces = Math.max(
      portfolio.spaces - occupancy.occupiedSpaces,
      0,
    );

    const occupancyPercentage =
      portfolio.spaces > 0
        ? Number(
            (
              (occupancy.occupiedSpaces / portfolio.spaces) *
              100
            ).toFixed(2),
          )
        : 0;

    const collectionPercentage =
      currentMonthExpectedRent > 0
        ? Number(
            (
              (currentMonthCollectedRent / currentMonthExpectedRent) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      platform: {
        name: 'PropertyOS',
        status: failedPlugins.length > 0 ? 'WARNING' : 'OK',
        version: '0.1.0',
      },
      business: {
        properties: portfolio.properties,
        zones: portfolio.zones,
        spaces: portfolio.spaces,
        occupiedSpaces: occupancy.occupiedSpaces,
        vacantSpaces,
        occupancyPercentage,
        tenants: tenants.length,
        activeTenants: occupancy.activeTenants,
        activeLeases,
        rentLedgers: rentLedgers.length,
        currentMonthExpectedRent,
        currentMonthCollectedRent,
        outstandingRent,
        collectionPercentage,
        receipts: receiptMetrics.receipts ?? 0,
        invoices: invoiceMetrics.invoices ?? 0,
        overdueInvoices: invoiceMetrics.overdueInvoices ?? 0,
      },
      plugins: {
        installed: plugins.length,
        active: activePlugins.length,
      },
      workflows: {
        enabled: true,
      },
      notifications: {
        enabled: true,
      },
    };
  }

  async getPlatformDiagnostics() {
    const plugins = await this.pluginService.list();
    const activePlugins = plugins.filter((plugin) => plugin.status === 'ACTIVE');
    const failedPlugins = plugins.filter((plugin) => plugin.status === 'FAILED');

    const registryCounts = {
      permissions: this.permissionRegistry.list().length,
      workflows: this.workflowRegistry.list().length,
      notifications: this.notificationRegistry.list().length,
      documents: this.documentRegistry.list().length,
      configuration: this.configurationRegistry.list().length,
      scheduler: this.schedulerRegistry.list().length,
      search: this.searchRegistry.list().length,
    };

    const status = failedPlugins.length > 0 ? 'WARNING' : 'READY';

    return {
      platform: {
        name: 'PropertyOS',
        version: '0.1.0',
        status,
        timestamp: new Date().toISOString(),
      },
      plugins: {
        installed: plugins.length,
        active: activePlugins.length,
        failed: failedPlugins.length,
        items: plugins,
      },
      registries: registryCounts,
      engines: {
        pluginRuntime: plugins.length > 0 ? 'READY' : 'EMPTY',
        permissionBootstrap: registryCounts.permissions > 0 ? 'READY' : 'EMPTY',
        workflowBootstrap: registryCounts.workflows > 0 ? 'READY' : 'EMPTY',
        notificationBootstrap: registryCounts.notifications > 0 ? 'READY' : 'EMPTY',
        search: registryCounts.search > 0 ? 'READY' : 'EMPTY',
        document: registryCounts.documents > 0 ? 'READY' : 'EMPTY',
        configuration: registryCounts.configuration > 0 ? 'READY' : 'EMPTY',
        scheduler: registryCounts.scheduler > 0 ? 'READY' : 'EMPTY',
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
