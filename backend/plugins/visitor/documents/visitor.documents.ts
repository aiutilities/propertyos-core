import { defineDocuments } from '../../../src/core/plugin/sdk';

export const visitorDocumentTemplates = defineDocuments([
  {
    code: 'visitor.qr_pass',
    name: 'Visitor QR Pass',
    description: 'QR pass document generated for approved visitors.',
  },
]);
