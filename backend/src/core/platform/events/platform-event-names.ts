export const PlatformEventNames = {
  PLATFORM_READY: 'platform.ready',

  PLUGIN_INSTALLED: 'plugin.installed',
  PLUGIN_ACTIVATED: 'plugin.activated',
  PLUGIN_DEACTIVATED: 'plugin.deactivated',
  PLUGIN_UNINSTALLED: 'plugin.uninstalled',

  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_TRANSITIONED: 'workflow.transitioned',

  NOTIFICATION_REQUESTED: 'notification.requested',
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed',
} as const;

export type PlatformEventName =
  (typeof PlatformEventNames)[keyof typeof PlatformEventNames];
