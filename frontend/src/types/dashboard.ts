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
