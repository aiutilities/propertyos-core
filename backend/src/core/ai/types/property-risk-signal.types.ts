export type PropertyRiskCategory =
  | 'MAINTENANCE'
  | 'HELPDESK'
  | 'PAYMENT'
  | 'TENANT'
  | 'INVENTORY';


export type PropertyRiskSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';


export interface PropertyRiskSignal {

  category:
    PropertyRiskCategory;

  severity:
    PropertyRiskSeverity;

  message:
    string;

  source:
    string;

}
