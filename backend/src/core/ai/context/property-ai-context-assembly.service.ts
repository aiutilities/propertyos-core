import {
  Injectable,
} from '@nestjs/common';

import {
  MaintenanceService,
} from '../../maintenance/services/maintenance.service';

import {
  HelpdeskService,
} from '../../helpdesk/services/helpdesk.service';

import {
  TenantService,
} from '../../tenant/services/tenant.service';

import {
  RentService,
} from '../../rent/services/rent.service';

import {
  PropertyAiContext,
} from './property-ai-context.types';


@Injectable()
export class PropertyAiContextAssemblyService {


  constructor(

    private readonly maintenance:
      MaintenanceService,

    private readonly helpdesk:
      HelpdeskService,

    private readonly tenant:
      TenantService,

    private readonly rent:
      RentService,

  ) {}


  async assemble(
    propertyId:
      string,
  ):
    Promise<PropertyAiContext> {


    const [
      maintenanceTickets,
      helpdeskTickets,
      tenants,
      occupancy,
      rentLedgers,
    ] =
      await Promise.all([

        this.maintenance.list({
          propertyId,
        }),

        this.helpdesk.list({
          propertyId,
        }),

        this.tenant.listTenants(),

        this.tenant.getOccupancyCounts(),

        this.rent.listRentLedgers(),

      ]);


    return {

      propertyId,

      propertyName:
        `Property ${propertyId}`,

      maintenance: {

        openTickets:
          maintenanceTickets.length,

        overdueTickets:
          maintenanceTickets.filter(
            ticket =>
              ticket.slaDueAt &&
              new Date(ticket.slaDueAt)
                < new Date(),
          ).length,

        highPriorityTickets:
          maintenanceTickets.filter(
            ticket =>
              String(ticket.priority)
                .toUpperCase()
                === 'HIGH',
          ).length,

      },


      helpdesk: {

        openTickets:
          helpdeskTickets.length,

        escalatedTickets:
          helpdeskTickets.filter(
            ticket =>
              String(ticket.status)
                .toUpperCase()
                .includes('ESCAL'),
          ).length,

      },


      tenants: {

        total:
          tenants.length,

        active:
          occupancy.activeTenants,

      },


      financials: {

        pendingRentAmount:
          rentLedgers.reduce(
            (
              total,
              ledger,
            ) =>
              total +
              Number(
                ledger.balanceAmount ?? 0,
              ),

            0,
          ),

        overdueCount:
          rentLedgers.filter(
            ledger =>
              String(ledger.status)
                .toUpperCase()
                === 'UNPAID',
          ).length,

      },


      generatedAt:
        new Date()
          .toISOString(),

    };

  }

}
