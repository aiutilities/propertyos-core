import { Injectable } from "@nestjs/common";

import { PluginPermissionRegistry } from "../../plugin/registries/plugin-permission.registry";
import {
  ACCESS_CONTROL_PERMISSIONS,
  ACCESS_CONTROL_REGISTRY_ID,
} from "../access-control.constants";

@Injectable()
export class AccessControlBootstrapService {
  constructor(permissionRegistry: PluginPermissionRegistry) {
    permissionRegistry.register(ACCESS_CONTROL_REGISTRY_ID, [
      {
        key: ACCESS_CONTROL_PERMISSIONS.READ,
        description: "View access points, grants, events, and metrics",
      },
      {
        key: ACCESS_CONTROL_PERMISSIONS.CREATE,
        description: "Create access points and access grants",
      },
      {
        key: ACCESS_CONTROL_PERMISSIONS.MANAGE,
        description: "Update access points and revoke access grants",
      },
      {
        key: ACCESS_CONTROL_PERMISSIONS.OPERATE,
        description: "Evaluate credentials and record access decisions",
      },
      {
        key: ACCESS_CONTROL_PERMISSIONS.OVERRIDE,
        description: "Perform emergency access-control overrides",
      },
    ]);
  }
}
