import {
  AiDecisionAuditRecord,
} from './ai-decision-audit.repository.types';


export interface AiDecisionAuditRepository {


  create(
    audit:
      AiDecisionAuditRecord,
  ):
    Promise<AiDecisionAuditRecord>;


  findByProperty(
    propertyId:
      string,
  ):
    Promise<AiDecisionAuditRecord[]>;


  count():
    Promise<number>;

}
