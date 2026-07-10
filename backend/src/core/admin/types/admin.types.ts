export interface AdminMenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  order?: number;
  pluginId?: string;
}

export interface AdminDashboardWidget {
  id: string;
  title: string;
  type: 'STAT' | 'LIST' | 'CHART' | 'STATUS';
  order?: number;
  pluginId?: string;
}

export interface AdminDashboardSummary {
  platform: {
    name: string;
    status: 'OK' | 'WARNING' | 'ERROR';
    version: string;
  };
  business: {
    properties: number;
    tenants: number;
    activeLeases: number;
    rentLedgers: number;
    outstandingRent: number;
    receipts: number;
    invoices: number;
    overdueInvoices: number;
  };
  plugins: {
    installed: number;
    active: number;
  };
  workflows: {
    enabled: boolean;
  };
  notifications: {
    enabled: boolean;
  };
}
