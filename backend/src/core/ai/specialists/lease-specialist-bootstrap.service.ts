import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  PropertySpecialistAgentRegistryService,
} from '../agents/property-specialist-agent.registry.service';

import {
  PropertySpecialistAgentRuntimeService,
} from '../agents/runtime/property-specialist-agent-runtime.service';

import {
  LEASE_ANALYSIS_CAPABILITY,
  LEASE_SPECIALIST_AGENT_ID,
  LeaseSpecialistService,
} from './lease-specialist.service';


@Injectable()
export class LeaseSpecialistBootstrapService
  implements OnModuleInit {


  constructor(
    private readonly registry:
      PropertySpecialistAgentRegistryService,

    private readonly runtime:
      PropertySpecialistAgentRuntimeService,

    private readonly specialist:
      LeaseSpecialistService,
  ) {}


  onModuleInit(): void {


    if (
      !this.registry.getByAgentId(
        LEASE_SPECIALIST_AGENT_ID,
      )
    ) {

      this.registry.register({

        domain:
          'LEASE',

        expertiseWeight:
          1.25,

        agent:
          {

            id:
              LEASE_SPECIALIST_AGENT_ID,

            name:
              'Lease Specialist',

            description:
              'Analyzes lease obligations, renewals, payments, notices, and deposits.',

            capabilities:
              [
                LEASE_ANALYSIS_CAPABILITY,
              ],

            permissions:
              [],

            autonomyLevel:
              'SUPERVISED',

            status:
              'ACTIVE',

            createdAt:
              new Date().toISOString(),

          },

      });

    }


    if (
      !this.runtime.has(
        LEASE_SPECIALIST_AGENT_ID,
      )
    ) {

      this.runtime.register(
        this.specialist,
      );

    }

  }

}
