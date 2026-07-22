export interface PropertyHealthAdvisory {

  riskLevel:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH';

  summary:
    string;

  actions:
    string[];

}
