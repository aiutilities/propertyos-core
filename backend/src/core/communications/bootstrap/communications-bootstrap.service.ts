import {
  Injectable,
} from '@nestjs/common';

import {
  PluginPermissionRegistry,
} from '../../plugin/registries/plugin-permission.registry';

import {
  COMMUNICATIONS_PERMISSIONS,
  COMMUNICATIONS_REGISTRY_ID,
} from '../communications.constants';

@Injectable()
export class CommunicationsBootstrapService {
  constructor(
    permissionRegistry:
      PluginPermissionRegistry,
  ) {
    permissionRegistry.register(
      COMMUNICATIONS_REGISTRY_ID,
      [
        {
          key:
            COMMUNICATIONS_PERMISSIONS.READ,
          description:
            'View communications, notices, categories and metrics',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.CREATE,
          description:
            'Create communications and audience targets',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.MANAGE,
          description:
            'Edit draft communications',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.PUBLISH,
          description:
            'Schedule and publish communications',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.ARCHIVE,
          description:
            'Archive and cancel communications',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.READ_RECEIPTS,
          description:
            'View communication read receipts and acknowledgement data',
        },
        {
          key:
            COMMUNICATIONS_PERMISSIONS.CONFIGURE,
          description:
            'Configure communication categories and delivery settings',
        },
      ],
    );
  }
}
