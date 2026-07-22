import {
  PropertyRiskSignal,
} from './property-risk-signal.types';


export interface PropertyRiskEvaluation {

  signals:
    PropertyRiskSignal[];

  overallRisk:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH';

}
