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
