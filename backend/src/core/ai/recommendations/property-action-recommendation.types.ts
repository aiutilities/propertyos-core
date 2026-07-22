export type PropertyRecommendationPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';


export interface PropertyActionRecommendation {

  propertyId:
    string;


  action:
    string;


  reason:
    string;


  confidence:
    number;


  priority:
    PropertyRecommendationPriority;


  requiresApproval:
    boolean;

}
