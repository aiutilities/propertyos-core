import {
  LeaseSpecialistBootstrapService,
} from '../../src/core/ai/specialists/lease-specialist-bootstrap.service';

import {
  LEASE_ANALYSIS_CAPABILITY,
  LEASE_SPECIALIST_AGENT_ID,
  LeaseSpecialistService,
} from '../../src/core/ai/specialists/lease-specialist.service';

import {
  PropertySpecialistAgentRegistryService,
} from '../../src/core/ai/agents/property-specialist-agent.registry.service';

import {
  PropertySpecialistAgentRuntimeService,
} from '../../src/core/ai/agents/runtime/property-specialist-agent-runtime.service';


describe(
  'LeaseSpecialistService',
  () => {


    const createRuntime =
      () => {


        const registry =
          new PropertySpecialistAgentRegistryService();


        const runtime =
          new PropertySpecialistAgentRuntimeService();


        const specialist =
          new LeaseSpecialistService();


        const bootstrap =
          new LeaseSpecialistBootstrapService(
            registry,
            runtime,
            specialist,
          );


        bootstrap.onModuleInit();


        return {
          registry,
          runtime,
          specialist,
          bootstrap,
        };

      };


    it(
      'registers lease metadata and executable runtime exactly once',
      () => {


        const {
          registry,
          runtime,
          bootstrap,
        } =
          createRuntime();


        bootstrap.onModuleInit();


        expect(
          registry.getByCapability(
            LEASE_ANALYSIS_CAPABILITY,
          ),
        )
        .toHaveLength(
          1,
        );


        expect(
          registry.getByAgentId(
            LEASE_SPECIALIST_AGENT_ID,
          ),
        )
        .toEqual(
          expect.objectContaining({

            domain:
              'LEASE',

            expertiseWeight:
              1.25,

          }),
        );


        expect(
          runtime.has(
            LEASE_SPECIALIST_AGENT_ID,
          ),
        )
        .toBe(
          true,
        );


        expect(
          runtime.list(),
        )
        .toHaveLength(
          1,
        );

      },
    );


    it(
      'recommends renewal review for an expiring lease',
      async () => {


        const {
          runtime,
        } =
          createRuntime();


        await expect(
          runtime.execute(

            LEASE_SPECIALIST_AGENT_ID,

            {
              propertyId:
                'property-001',

              capability:
                LEASE_ANALYSIS_CAPABILITY,

              objective:
                'Lease expiry is approaching and renewal notice must be reviewed',
            },

          ),
        )
        .resolves
        .toEqual(
          expect.objectContaining({

            agentId:
              LEASE_SPECIALIST_AGENT_ID,

            recommendation:
              'REVIEW_LEASE_RENEWAL',

            confidence:
              0.91,

          }),
        );

      },
    );


    it(
      'recommends deposit reconciliation when the objective concerns deposit',
      async () => {


        const {
          runtime,
        } =
          createRuntime();


        const result =
          await runtime.execute(

            LEASE_SPECIALIST_AGENT_ID,

            {
              propertyId:
                'property-002',

              capability:
                LEASE_ANALYSIS_CAPABILITY,

              objective:
                'Reconcile the tenant security deposit before lease closure',
            },

          );


        expect(
          result.recommendation,
        )
        .toBe(
          'RECONCILE_LEASE_DEPOSIT',
        );


        expect(
          result.reasoning,
        )
        .toContain(
          'property-002',
        );

      },
    );


    it(
      'recommends payment-risk review for overdue rent',
      async () => {


        const {
          runtime,
        } =
          createRuntime();


        const result =
          await runtime.execute(

            LEASE_SPECIALIST_AGENT_ID,

            {
              propertyId:
                'property-003',

              capability:
                LEASE_ANALYSIS_CAPABILITY,

              objective:
                'Tenant rent payment is overdue',
            },

          );


        expect(
          result.recommendation,
        )
        .toBe(
          'REVIEW_LEASE_PAYMENT_RISK',
        );


        expect(
          result.confidence,
        )
        .toBe(
          0.92,
        );

      },
    );


    it(
      'rejects unsupported capabilities through the authoritative runtime',
      async () => {


        const {
          runtime,
        } =
          createRuntime();


        await expect(
          runtime.execute(

            LEASE_SPECIALIST_AGENT_ID,

            {
              propertyId:
                'property-004',

              capability:
                'MAINTENANCE_ANALYSIS',

              objective:
                'Review maintenance risk',
            },

          ),
        )
        .rejects
        .toThrow(
          'does not support capability',
        );

      },
    );


  },
);
