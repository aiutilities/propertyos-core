import { Injectable } from "@nestjs/common";

import { PluginPermissionRegistry } from "@propertyos/core-contracts";
import { STAFF_PERMISSIONS, STAFF_REGISTRY_ID } from "../staff.constants";

@Injectable()
export class StaffBootstrapService {
  constructor(permissionRegistry: PluginPermissionRegistry) {
    permissionRegistry.register(STAFF_REGISTRY_ID, [
      {
        key: STAFF_PERMISSIONS.READ,
        description: "View staff records and attendance history",
      },
      {
        key: STAFF_PERMISSIONS.CREATE,
        description: "Register staff members",
      },
      {
        key: STAFF_PERMISSIONS.MANAGE,
        description: "Update, activate, deactivate, suspend, and archive staff",
      },
      {
        key: STAFF_PERMISSIONS.SECURITY,
        description:
          "Look up staff and record check-in or check-out attendance",
      },
    ]);
  }
}
