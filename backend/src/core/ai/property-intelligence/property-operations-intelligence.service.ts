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

import {
  InventoryService,
} from '../../inventory/services/inventory.service';

import {
  MaintenanceRiskAnalyzerService,
} from './maintenance-risk-analyzer.service';

import {
  HelpdeskRiskAnalyzerService,
} from './helpdesk-risk-analyzer.service';

import {
  InventoryRiskAnalyzerService,
} from './inventory-risk-analyzer.service';

import {
  PropertyRiskAggregationService,
} from './property-risk-aggregation.service';

import {
  PropertyHealthAdvisoryService,
} from './property-health-advisory.service';


@Injectable()
export class PropertyOperationsIntelligenceService {


  constructor(
    private readonly propertyService:
      PropertyService,

    private readonly maintenanceService:
      MaintenanceService,

    private readonly helpdeskService:
      HelpdeskService,

    private readonly inventoryService:
      InventoryService,

    private readonly maintenanceRiskAnalyzer:
      MaintenanceRiskAnalyzerService,

    private readonly helpdeskRiskAnalyzer:
      HelpdeskRiskAnalyzerService,

    private readonly inventoryRiskAnalyzer:
      InventoryRiskAnalyzerService,

    private readonly riskAggregator:
      PropertyRiskAggregationService,

    private readonly healthAdvisory:
      PropertyHealthAdvisoryService,
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


    const inventory =
      await this.inventoryService.listStockBalances({
        propertyId,
      });


    const maintenanceCount =
      maintenance.length;


    const helpdeskCount =
      helpdesk.length;


    const maintenanceSignals =
      this.maintenanceRiskAnalyzer.analyze(
        maintenance,
      );


    const helpdeskSignals =
      this.helpdeskRiskAnalyzer.analyze(
        helpdesk,
      );


    const inventorySignals =
      this.inventoryRiskAnalyzer.analyze(
        inventory,
      );


    const evaluation =
      this.riskAggregator.evaluate(
        [
          ...maintenanceSignals,
          ...helpdeskSignals,
          ...inventorySignals,
        ],
      );


    const advisory =
      this.healthAdvisory.advise(
        evaluation,
      );


    return {

      propertyId,

      propertyName:
        property.name,

      maintenanceOpenCount:
        maintenanceCount,

      helpdeskOpenCount:
        helpdeskCount,

      inventorySignalCount:
        inventorySignals.length,

      operationalRisk:
        evaluation.overallRisk,

      advisory,

      summary:
        advisory.summary,
    };
  }
}
