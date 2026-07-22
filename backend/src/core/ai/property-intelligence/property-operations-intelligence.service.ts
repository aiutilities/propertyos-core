import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyService,
} from '../../property/services/property.service';

import {
  MaintenanceService,
} from '../../maintenance/services/maintenance.service';

import {
  HelpdeskService,
} from '../../helpdesk/services/helpdesk.service';


@Injectable()
export class PropertyOperationsIntelligenceService {


  constructor(
    private readonly propertyService:
      PropertyService,

    private readonly maintenanceService:
      MaintenanceService,

    private readonly helpdeskService:
      HelpdeskService,
  ) {}


  async analyzeProperty(
    propertyId: string,
  ) {

    const property =
      await this.propertyService.findPropertyById(
        propertyId,
      );


    if (!property) {

      throw new Error(
        `Property not found: ${propertyId}`,
      );
    }


    const maintenance =
      await this.maintenanceService.list({
        propertyId,
      });


    const helpdesk =
      await this.helpdeskService.list({
        propertyId,
      });


    const maintenanceCount =
      maintenance.length;


    const helpdeskCount =
      helpdesk.length;


    let risk:
      'LOW' | 'MEDIUM' | 'HIGH' =
      'LOW';


    if (
      maintenanceCount > 5 ||
      helpdeskCount > 5
    ) {
      risk =
        'MEDIUM';
    }


    return {

      propertyId,

      propertyName:
        property.name,

      maintenanceOpenCount:
        maintenanceCount,

      helpdeskOpenCount:
        helpdeskCount,

      operationalRisk:
        risk as 'LOW' | 'MEDIUM' | 'HIGH',

      summary:
        `${property.name} has ${maintenanceCount} maintenance issues and ${helpdeskCount} helpdesk issues`,
    };
  }
}
