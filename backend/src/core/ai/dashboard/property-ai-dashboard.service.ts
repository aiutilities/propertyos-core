import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiDashboard,
} from '../types/property-ai-dashboard.types';


@Injectable()
export class PropertyAiDashboardService {


  getDashboard(
    propertyId:
      string,
  ):
    PropertyAiDashboard {


    return {

      propertyId,

      healthStatus:
        'HEALTHY',

      riskLevel:
        'LOW',

      activeRisks:
        [],

      recommendations:
        [
          'Continue regular monitoring',
        ],

      pendingApprovals:
        0,

      lastUpdated:
        new Date()
          .toISOString(),

    };

  }

}
