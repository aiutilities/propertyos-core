import { defineScheduler } from '../../src/core/plugin/sdk';

export const visitorSchedulerHandlers = defineScheduler([
  {
    code: 'visitor.no_show',
    name: 'Visitor No Show Handler',
    description: 'Marks visits as no-show when visitor does not arrive within the allowed window.',
  },
  {
    code: 'visitor.qr.expire',
    name: 'Visitor QR Expiry Handler',
    description: 'Expires QR passes after their validity period.',
  },
  {
    code: 'visitor.auto_checkout',
    name: 'Visitor Auto Checkout Handler',
    description: 'Auto-checks out visitors after configured duration.',
  },
]);
