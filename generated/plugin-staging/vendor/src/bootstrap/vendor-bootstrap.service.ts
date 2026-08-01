import {
  Injectable,
} from '@nestjs/common';

import {
  PluginPermissionRegistry,
} from '@propertyos/core-contracts';

import {
  VENDOR_PERMISSIONS,
  VENDOR_REGISTRY_ID,
} from '../vendor.constants';

@Injectable()
export class VendorBootstrapService {
  constructor(
    permissionRegistry:
      PluginPermissionRegistry,
  ) {
    permissionRegistry.register(
      VENDOR_REGISTRY_ID,
      [
        {
          key:
            VENDOR_PERMISSIONS.READ,
          description:
            'View vendors, categories, metrics and vendor details',
        },
        {
          key:
            VENDOR_PERMISSIONS.CREATE,
          description:
            'Create vendors and vendor profiles',
        },
        {
          key:
            VENDOR_PERMISSIONS.UPDATE,
          description:
            'Update vendor profiles and contacts',
        },
        {
          key:
            VENDOR_PERMISSIONS.MANAGE,
          description:
            'Manage vendor lifecycle and status',
        },
        {
          key:
            VENDOR_PERMISSIONS.CONTRACTS,
          description:
            'Manage vendor contracts and contract documents',
        },
        {
          key:
            VENDOR_PERMISSIONS.WORK_ORDERS,
          description:
            'Manage vendor work orders',
        },
        {
          key:
            VENDOR_PERMISSIONS.COMPLIANCE,
          description:
            'Manage vendor compliance documents',
        },
        {
          key:
            VENDOR_PERMISSIONS.RATINGS,
          description:
            'Rate vendor performance',
        },
        {
          key:
            VENDOR_PERMISSIONS.CONFIGURE,
          description:
            'Configure vendor categories and settings',
        },
      ],
    );
  }
}
