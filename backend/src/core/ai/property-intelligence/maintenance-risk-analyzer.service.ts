import {
  Injectable,
} from '@nestjs/common';

import {
  MaintenanceTicket,
} from '../../maintenance/types/maintenance.types';

import {
  PropertyRiskSignal,
} from '../types/property-risk-signal.types';


@Injectable()
export class MaintenanceRiskAnalyzerService {


  analyze(
    tickets:
      MaintenanceTicket[],
  ): PropertyRiskSignal[] {


    const signals:
      PropertyRiskSignal[] = [];


    for (
      const ticket of tickets
    ) {


      if (
        ticket.slaDueAt &&
        ticket.slaDueAt.getTime() < Date.now()
      ) {

        signals.push({

          category:
            'MAINTENANCE',

          severity:
            'HIGH',

          message:
            `Maintenance ticket ${ticket.ticketNumber} exceeded SLA`,

          source:
            'maintenance',
        });

      }


      if (
        ticket.priority === 'HIGH' ||
        ticket.priority === 'URGENT'
      ) {

        signals.push({

          category:
            'MAINTENANCE',

          severity:
            'HIGH',

          message:
            `High priority maintenance issue: ${ticket.title}`,

          source:
            'maintenance',
        });

      }

    }


    return signals;
  }
}
