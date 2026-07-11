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
    zones: number;
    spaces: number;
    occupiedSpaces: number;
    vacantSpaces: number;
    occupancyPercentage: number;
    tenants: number;
    activeTenants: number;
    activeLeases: number;
    rentLedgers: number;
    currentMonthExpectedRent: number;
    currentMonthCollectedRent: number;
    outstandingRent: number;
    collectionPercentage: number;
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
