import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiAgentSupervisorService,
} from './property-ai-agent-supervisor.service';


describe(
  'PropertyAiAgentSupervisorService',
  () => {


    it(
      'plans and executes agent goal',
      () => {


        const service =
          new PropertyAiAgentSupervisorService(

            new (class {

              createPlan(
                agentId:string,
                goal:string,
                capabilities:string[],
              ) {

                return {

                  id:'plan-001',

                  agentId,

                  goal,

                  steps:
                    capabilities.map(
                      (
                        capabilityId,
                        index,
                      ) => ({

                        order:index + 1,

                        capabilityId,

                        description:'execute',

                        status:'PENDING',

                      }),

                    ),

                  status:'CREATED',

                  createdAt:
                    new Date()
                      .toISOString(),

                };

              }

              ready(plan:any) {

                return {
                  ...plan,
                  status:'READY',
                };

              }

            })() as any,


            {
              execute:
                () => ({

                  success:true,

                  agentId:'agent-001',

                  capabilityId:'maintenance',

                  stepOrder:1,

                  status:'EXECUTED',

                  evidenceEvent:'completed',

                  reason:'done',

                }),

            } as any,

          );


        const result =
          service.supervise(

            {

              id:'goal-001',

              agentId:'agent-001',

              propertyId:'property-001',

              goal:'Reduce maintenance backlog',

              priority:'HIGH',

              status:'ACTIVE',

              createdAt:
                new Date()
                  .toISOString(),

            },

            {

              id:'agent-001',

              name:'Operations Agent',

              status:'ACTIVE',

              capabilities:[
                'maintenance',
              ],

              permissions:[],

            } as any,


            [
              'maintenance',
            ],

          );


        expect(
          result.completed,
        )
        .toBe(
          true,
        );


        expect(
          result.executions.length,
        )
        .toBe(
          1,
        );


      },
    );


  },
);
