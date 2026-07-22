export interface PropertyOperationsAgentContext {

  propertyId: string;

  propertyName: string;

  occupancy?: number;

  openMaintenanceIssues?: number;

  pendingPayments?: number;

  alerts?: string[];
}


export interface PropertyOperationsInsight {

  propertyId: string;

  healthStatus:
    | 'HEALTHY'
    | 'WARNING'
    | 'CRITICAL';

  summary: string;

  recommendations: string[];

  generatedAt: string;
}
