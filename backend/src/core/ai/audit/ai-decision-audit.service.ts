import {
  Injectable,
} from '@nestjs/common';

import {
  AiDecisionAuditRecord,
} from './ai-decision-audit.repository.types';


@Injectable()
export class AiDecisionAuditService {


  private readonly records:
    AiDecisionAuditRecord[] =
    [];


  record(
    audit:
      AiDecisionAuditRecord,
  ):
    AiDecisionAuditRecord {

    this.records.push(
      audit,
    );

    return audit;

  }


  listByProperty(
    propertyId:
      string,
  ):
    AiDecisionAuditRecord[] {

    return this.records.filter(
      item =>
        item.propertyId
          === propertyId,
    );

  }


  count():
    number {

    return this.records.length;

  }

}
