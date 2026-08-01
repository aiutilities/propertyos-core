import {
  Injectable,
} from '@nestjs/common';

import {
  PluginPermissionRegistry,
} from '@propertyos/core-contracts';

import {
  PROCUREMENT_PERMISSIONS,
  PROCUREMENT_REGISTRY_ID,
} from '../procurement.constants';

@Injectable()
export class ProcurementBootstrapService {
  constructor(
    permissionRegistry:
      PluginPermissionRegistry,
  ) {
    permissionRegistry.register(
      PROCUREMENT_REGISTRY_ID,
      [
        {
          key: PROCUREMENT_PERMISSIONS.READ,
          description:
            'View purchase requests and procurement metrics',
        },
        {
          key: PROCUREMENT_PERMISSIONS.CREATE,
          description:
            'Create purchase requests',
        },
        {
          key: PROCUREMENT_PERMISSIONS.UPDATE,
          description:
            'Update draft purchase requests',
        },
        {
          key: PROCUREMENT_PERMISSIONS.APPROVE,
          description:
            'Approve or reject purchase requests',
        },
        {
          key: PROCUREMENT_PERMISSIONS.MANAGE,
          description:
            'Manage procurement lifecycle',
        },
        {
          key: PROCUREMENT_PERMISSIONS.RFQ,
          description:
            'Manage RFQs',
        },
        {
          key: PROCUREMENT_PERMISSIONS.QUOTATION,
          description:
            'Manage quotations',
        },
        {
          key: PROCUREMENT_PERMISSIONS.PURCHASE_ORDER,
          description:
            'Manage purchase orders',
        },
        {
          key: PROCUREMENT_PERMISSIONS.GOODS_RECEIPT,
          description:
            'Manage goods receipts',
        },
        {
          key: PROCUREMENT_PERMISSIONS.INVOICE_MATCH,
          description:
            'Manage invoice matching',
        },
        {
          key: PROCUREMENT_PERMISSIONS.PAYMENT_REQUEST,
          description:
            'Manage payment requests',
        },
        {
          key: PROCUREMENT_PERMISSIONS.CONFIGURE,
          description:
            'Configure procurement',
        },
      ],
    );
  }
}
