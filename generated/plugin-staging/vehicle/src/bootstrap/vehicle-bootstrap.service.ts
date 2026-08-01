import { Injectable } from '@nestjs/common';

import { PluginPermissionRegistry } from '@propertyos/core-contracts';
import {
  VEHICLE_PERMISSIONS,
  VEHICLE_REGISTRY_ID,
} from '../vehicle.constants';

@Injectable()
export class VehicleBootstrapService {
  constructor(
    permissionRegistry:
      PluginPermissionRegistry,
  ) {
    permissionRegistry.register(
      VEHICLE_REGISTRY_ID,
      [
        {
          key: VEHICLE_PERMISSIONS.READ,
          description:
            'View registered vehicles and movement history',
        },
        {
          key: VEHICLE_PERMISSIONS.CREATE,
          description:
            'Register resident and tenant vehicles',
        },
        {
          key: VEHICLE_PERMISSIONS.MANAGE,
          description:
            'Verify, reject, suspend, archive, and update vehicles',
        },
        {
          key: VEHICLE_PERMISSIONS.SECURITY,
          description:
            'Look up vehicles and record gate entry or exit',
        },
      ],
    );
  }
}
