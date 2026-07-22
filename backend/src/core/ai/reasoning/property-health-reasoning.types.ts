export type PropertyRiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';


export interface PropertyHealthAdvisory {

  propertyId:
    string;


  healthScore:
    number;


  riskLevel:
    PropertyRiskLevel;


  summary:
    string;


  insights:
    string[];


  actions:
    string[];


  generatedAt:
    string;

}
