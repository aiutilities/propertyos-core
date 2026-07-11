export interface DashboardApiResponse {
  success: boolean;
  data: DashboardSummary;
}

export interface DashboardSummary {
  platform: {
    name: string;
    status: string;
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
