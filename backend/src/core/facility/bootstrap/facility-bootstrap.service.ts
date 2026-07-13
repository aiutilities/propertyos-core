import { Injectable } from '@nestjs/common';

import { PluginPermissionRegistry } from '../../plugin/registries/plugin-permission.registry';
import { PluginWorkflowRegistry } from '../../plugin/registries/plugin-workflow.registry';
import {
  FACILITY_PERMISSIONS,
  FACILITY_REGISTRY_ID,
} from '../facility.constants';
import {
  FACILITY_ASSET_WORKFLOW_DEFINITION,
} from '../facility-workflow.definition';

@Injectable()
export class FacilityBootstrapService {
  constructor(
    permissionRegistry: PluginPermissionRegistry,
    workflowRegistry: PluginWorkflowRegistry,
  ) {
    permissionRegistry.register(
      FACILITY_REGISTRY_ID,
      [
        {
          key: FACILITY_PERMISSIONS.READ,
          description:
            'View facilities, assets, and preventive-maintenance plans',
        },
        {
          key: FACILITY_PERMISSIONS.CREATE,
          description:
            'Create facility assets',
        },
        {
          key: FACILITY_PERMISSIONS.MANAGE,
          description:
            'Manage facility assets and preventive-maintenance plans',
        },
      ],
    );

    workflowRegistry.register(
      FACILITY_REGISTRY_ID,
      [FACILITY_ASSET_WORKFLOW_DEFINITION],
    );
  }
}
