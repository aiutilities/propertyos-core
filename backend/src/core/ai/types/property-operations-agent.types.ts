export interface PropertyOperationsAgentContext {

  propertyId: string;

  propertyName: string;

  maintenanceOpenCount: number;

  helpdeskOpenCount: number;

  operationalRisk:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH';

}


export interface PropertyOperationsInsight {

  propertyId: string;

  propertyName: string;

  healthStatus:
    | 'HEALTHY'
    | 'WARNING'
    | 'CRITICAL';

  summary: string;

  recommendations: string[];

  generatedAt: string;
}
