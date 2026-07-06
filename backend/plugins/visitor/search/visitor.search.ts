import { defineSearchProviders } from '../../src/core/plugin/sdk';

export const visitorSearchProviders = defineSearchProviders([
  {
    code: 'visitor.search',
    name: 'Visitor Search Provider',
    entityTypes: ['visitor', 'visitor.visit'],
    description: 'Allows VisitorOS records to participate in global search.',
  },
]);
