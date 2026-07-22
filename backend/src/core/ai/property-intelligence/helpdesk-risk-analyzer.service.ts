import {
  Injectable,
} from '@nestjs/common';

import {
  HelpdeskTicket,
} from '../../helpdesk/types/helpdesk.types';

import {
  PropertyRiskSignal,
} from '../types/property-risk-signal.types';


@Injectable()
export class HelpdeskRiskAnalyzerService {


  analyze(
    tickets:
      HelpdeskTicket[],
  ): PropertyRiskSignal[] {


    const signals:
      PropertyRiskSignal[] = [];


    for (
      const ticket of tickets
    ) {


      if (
        ticket.priority === 'URGENT' ||
        ticket.priority === 'CRITICAL'
      ) {

        signals.push({

          category:
            'HELPDESK',

          severity:
            'HIGH',

          message:
            `Urgent helpdesk request: ${ticket.title}`,

          source:
            'helpdesk',
        });

      }


      if (
        ticket.status === 'ESCALATED'
      ) {

        signals.push({

          category:
            'HELPDESK',

          severity:
            'HIGH',

          message:
            `Escalated helpdesk ticket: ${ticket.title}`,

          source:
            'helpdesk',
        });

      }


    }


    return signals;
  }
}
