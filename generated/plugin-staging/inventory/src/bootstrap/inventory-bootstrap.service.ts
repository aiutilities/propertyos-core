import {
  Injectable,
} from '@nestjs/common';

import {
  PluginPermissionRegistry,
} from '@propertyos/core-contracts';

import {
  INVENTORY_PERMISSIONS,
  INVENTORY_REGISTRY_ID,
} from '../inventory.constants';

@Injectable()
export class InventoryBootstrapService {
  constructor(
    permissionRegistry:
      PluginPermissionRegistry,
  ) {
    permissionRegistry.register(
      INVENTORY_REGISTRY_ID,
      [
        {
          key:
            INVENTORY_PERMISSIONS.READ,
          description:
            'View Inventory items, stores, bins, and stock balances',
        },
        {
          key:
            INVENTORY_PERMISSIONS.CREATE,
          description:
            'Create Inventory records',
        },
        {
          key:
            INVENTORY_PERMISSIONS.UPDATE,
          description:
            'Update Inventory records',
        },
        {
          key:
            INVENTORY_PERMISSIONS.MANAGE,
          description:
            'Manage Inventory configuration and lifecycle',
        },
        {
          key:
            INVENTORY_PERMISSIONS.ITEMS,
          description:
            'Manage Inventory item master',
        },
        {
          key:
            INVENTORY_PERMISSIONS.STORES,
          description:
            'Manage Inventory stores and bin locations',
        },
        {
          key:
            INVENTORY_PERMISSIONS.STOCK,
          description:
            'View and manage stock balances and movements',
        },
        {
          key:
            INVENTORY_PERMISSIONS.TRANSFER,
          description:
            'Transfer stock between stores and bins',
        },
        {
          key:
            INVENTORY_PERMISSIONS.ADJUST,
          description:
            'Perform controlled stock adjustments',
        },
        {
          key:
            INVENTORY_PERMISSIONS.ISSUE,
          description:
            'Create and post controlled Inventory Material Issues',
        },
        {
          key:
            INVENTORY_PERMISSIONS.RETURN,
          description:
            'Create and post controlled Inventory Material Returns',
        },
        {
          key:
            INVENTORY_PERMISSIONS.COUNT,
          description:
            'Perform physical stock counts',
        },
        {
          key:
            INVENTORY_PERMISSIONS.CONFIGURE,
          description:
            'Configure Inventory categories, brands, and Units of Measure',
        },
      ],
    );
  }
}
