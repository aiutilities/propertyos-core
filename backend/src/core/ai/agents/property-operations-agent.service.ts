import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyOperationsIntelligenceService,
} from '../property-intelligence/property-operations-intelligence.service';

import {
  PropertyOperationsInsight,
} from '../types/property-operations-agent.types';


@Injectable()
export class PropertyOperationsAgentService {


  constructor(
    private readonly intelligence:
      PropertyOperationsIntelligenceService,
  ) {}


  async analyze(
    propertyId: string,
  ): Promise<PropertyOperationsInsight> {


    const data =
      await this.intelligence.analyzeProperty(
        propertyId,
      );


    let healthStatus:
      PropertyOperationsInsight['healthStatus'] =
        'HEALTHY';


    const recommendations:
      string[] = [];


    if (
      data.operationalRisk === 'MEDIUM'
    ) {

      healthStatus =
        'WARNING';

      recommendations.push(
        'Review maintenance and helpdesk workload',
      );
    }


    if (
      data.operationalRisk === 'HIGH'
    ) {

      healthStatus =
        'CRITICAL';

      recommendations.push(
        'Immediate operational attention required',
      );
    }


    return {

      propertyId:
        data.propertyId,

      propertyName:
        data.propertyName,

      healthStatus,

      summary:
        `${data.propertyName} operational health: ${healthStatus}`,

      recommendations,

      generatedAt:
        new Date().toISOString(),
    };
  }
}
