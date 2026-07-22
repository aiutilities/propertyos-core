export type PropertyAiHealthStatus =
  | 'HEALTHY'
  | 'WARNING'
  | 'CRITICAL';


export interface PropertyAiDashboard {


  propertyId:
    string;


  healthStatus:
    PropertyAiHealthStatus;


  riskLevel:
    string;


  activeRisks:
    string[];


  recommendations:
    string[];


  pendingApprovals:
    number;


  lastUpdated:
    string;

}
