import { defineConfiguration } from '../../src/core/plugin/sdk';

export const visitorConfiguration = defineConfiguration([
  {
    code: 'visitor.qr.validity_minutes',
    key: 'visitor.qr.validity_minutes',
    name: 'QR Validity Minutes',
    defaultValue: 1440,
    description: 'Default QR validity period in minutes.',
  },
  {
    code: 'visitor.auto_checkout.enabled',
    key: 'visitor.auto_checkout.enabled',
    name: 'Auto Checkout Enabled',
    defaultValue: true,
    description: 'Whether visitors should be automatically checked out.',
  },
  {
    code: 'visitor.auto_checkout.hours',
    key: 'visitor.auto_checkout.hours',
    name: 'Auto Checkout Hours',
    defaultValue: 12,
    description: 'Number of hours after which visitor should be auto checked out.',
  },
]);
