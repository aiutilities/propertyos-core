export const visitorConfiguration = [
  {
    key: 'visitor.qr.validity_minutes',
    name: 'QR Validity Minutes',
    defaultValue: 1440,
    description: 'Default QR validity period in minutes.',
  },
  {
    key: 'visitor.auto_checkout.enabled',
    name: 'Auto Checkout Enabled',
    defaultValue: true,
    description: 'Whether visitors should be automatically checked out.',
  },
  {
    key: 'visitor.auto_checkout.hours',
    name: 'Auto Checkout Hours',
    defaultValue: 12,
    description: 'Number of hours after which visitor should be auto checked out.',
  },
];
