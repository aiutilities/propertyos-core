export type PropertyAiLearningPattern =
  | 'SUCCESSFUL'
  | 'UNSTABLE'
  | 'UNSUCCESSFUL';


export interface PropertyAiLearningAction {

  action:
    string;

  confidenceAdjustment:
    number;

  pattern:
    PropertyAiLearningPattern;

  executionCount:
    number;

  successRate:
    number;

}


export interface PropertyAiLearningProfile {

  propertyId:
    string;

  actions:
    PropertyAiLearningAction[];

  generatedAt:
    string;

}
