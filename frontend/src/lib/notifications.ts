export type NotificationTone =
  | "success"
  | "error"
  | "warning"
  | "information";

export type NotificationPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

export type NotificationAction =
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "deactivate"
  | "approve"
  | "reject"
  | "submit"
  | "complete"
  | "cancel"
  | "install"
  | "uninstall"
  | "payment"
  | "receipt"
  | "inventoryReceipt"
  | "materialIssue"
  | "materialReturn"
  | "stockAdjustment"
  | "import"
  | "export";

export type NotificationConfiguration = {
  enabled: boolean;
  position: NotificationPosition;
  autoDismissMs: number;
  maximumVisible: number;
  includeEntityName: boolean;
  persistAcrossRedirects: boolean;
  manualDismiss: boolean;
  soundEnabled: boolean;
  showSuccess: boolean;
  showInformation: boolean;
  showWarnings: boolean;
  showErrors: boolean;
  deleteConfirmationRequired: boolean;
  templates: Record<NotificationAction, string>;
};

export type NotificationRequest = {
  id?: string;
  tone: NotificationTone;
  title: string;
  message?: string;
  durationMs?: number;
  createdAt?: number;
};

export const NOTIFICATION_EVENT =
  "propertyos:notification";

export const NOTIFICATION_CONFIG_EVENT =
  "propertyos:notification-config";

export const REDIRECT_NOTIFICATION_KEY =
  "propertyos:redirect-notifications";

export const NOTIFICATION_OVERRIDE_KEY =
  "propertyos:notification-configuration";

export const defaultNotificationConfiguration:
  NotificationConfiguration = {
    enabled: true,
    position: "top-right",
    autoDismissMs: 5000,
    maximumVisible: 5,
    includeEntityName: true,
    persistAcrossRedirects: true,
    manualDismiss: true,
    soundEnabled: false,
    showSuccess: true,
    showInformation: true,
    showWarnings: true,
    showErrors: true,
    deleteConfirmationRequired: true,
    templates: {
      create:
        '{{entityType}} "{{entityName}}" created successfully.',
      update:
        '{{entityType}} "{{entityName}}" updated successfully.',
      delete:
        '{{entityType}} "{{entityName}}" deleted successfully.',
      activate:
        '{{entityType}} "{{entityName}}" activated successfully.',
      deactivate:
        '{{entityType}} "{{entityName}}" deactivated successfully.',
      approve:
        '{{entityType}} "{{entityName}}" approved successfully.',
      reject:
        '{{entityType}} "{{entityName}}" rejected successfully.',
      submit:
        '{{entityType}} "{{entityName}}" submitted successfully.',
      complete:
        '{{entityType}} "{{entityName}}" completed successfully.',
      cancel:
        '{{entityType}} "{{entityName}}" cancelled successfully.',
      install:
        '{{entityType}} "{{entityName}}" installed successfully.',
      uninstall:
        '{{entityType}} "{{entityName}}" removed successfully.',
      payment:
        "Payment recorded successfully.",
      receipt:
        "Receipt generated successfully.",
      inventoryReceipt:
        "Stock received successfully.",
      materialIssue:
        "Material issued successfully.",
      materialReturn:
        "Material returned successfully.",
      stockAdjustment:
        "Stock adjusted successfully.",
      import:
        "Import completed successfully.",
      export:
        "Export completed successfully.",
    },
  };

let runtimeConfiguration =
  defaultNotificationConfiguration;

export function getNotificationConfiguration():
  NotificationConfiguration {
  return runtimeConfiguration;
}

export function setNotificationConfiguration(
  configuration: NotificationConfiguration,
): void {
  runtimeConfiguration = configuration;

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      NOTIFICATION_CONFIG_EVENT,
      {
        detail: configuration,
      },
    ),
  );
}

export function mergeNotificationConfiguration(
  base: NotificationConfiguration,
  override: Partial<NotificationConfiguration>,
): NotificationConfiguration {
  return {
    ...base,
    ...override,
    templates: {
      ...base.templates,
      ...(override.templates ?? {}),
    },
  };
}

export function interpolateNotificationTemplate(
  template: string,
  values: {
    entityType?: string;
    entityName?: string;
  },
): string {
  const entityType =
    values.entityType?.trim() || "Item";

  const entityName =
    values.entityName?.trim() || "";

  return template
    .replaceAll(
      "{{entityType}}",
      entityType,
    )
    .replaceAll(
      "{{entityName}}",
      entityName,
    )
    .replace(/""/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function createEntityNotification(
  action: NotificationAction,
  entityType: string,
  entityName?: string,
  message?: string,
): NotificationRequest {
  const configuration =
    getNotificationConfiguration();

  return {
    tone: "success",
    title:
      interpolateNotificationTemplate(
        configuration.templates[action],
        {
          entityType,
          entityName:
            configuration.includeEntityName
              ? entityName
              : undefined,
        },
      ),
    message,
  };
}

export function dispatchNotification(
  notification: NotificationRequest,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      NOTIFICATION_EVENT,
      {
        detail: {
          ...notification,
          id:
            notification.id ??
            createNotificationId(),
          createdAt:
            notification.createdAt ??
            Date.now(),
        },
      },
    ),
  );
}

export function queueRedirectNotification(
  notification: NotificationRequest,
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (
    !getNotificationConfiguration()
      .persistAcrossRedirects
  ) {
    dispatchNotification(notification);
    return;
  }

  const queued =
    readRedirectNotifications();

  queued.push({
    ...notification,
    id:
      notification.id ??
      createNotificationId(),
    createdAt:
      notification.createdAt ??
      Date.now(),
  });

  window.sessionStorage.setItem(
    REDIRECT_NOTIFICATION_KEY,
    JSON.stringify(
      queued.slice(-10),
    ),
  );
}

export function consumeRedirectNotifications():
  NotificationRequest[] {
  if (typeof window === "undefined") {
    return [];
  }

  const queued =
    readRedirectNotifications();

  window.sessionStorage.removeItem(
    REDIRECT_NOTIFICATION_KEY,
  );

  return queued;
}

export function readNotificationOverride():
  Partial<NotificationConfiguration> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw =
    window.localStorage.getItem(
      NOTIFICATION_OVERRIDE_KEY,
    );

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as
      Partial<NotificationConfiguration>;
  } catch {
    return {};
  }
}

export function saveNotificationOverride(
  override:
    Partial<NotificationConfiguration>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    NOTIFICATION_OVERRIDE_KEY,
    JSON.stringify(override),
  );
}

export function sanitizeNotificationError(
  error: unknown,
  fallback =
    "The operation could not be completed. Please try again.",
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const raw =
    extractApiMessage(
      error.message,
    );

  if (!raw) {
    return fallback;
  }

  const normalized =
    raw.toLowerCase();

  if (
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden")
  ) {
    return (
      "You do not have permission "
      + "to complete this operation."
    );
  }

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network")
  ) {
    return (
      "The server could not be reached. "
      + "Please check your connection."
    );
  }

  if (
    normalized.includes("should not exist") ||
    raw.length > 240
  ) {
    return fallback;
  }

  return raw;
}

function extractApiMessage(
  raw: string,
): string {
  const trimmed = raw.trim();

  if (!trimmed.startsWith("{")) {
    return trimmed;
  }

  try {
    const payload =
      JSON.parse(trimmed) as {
        message?: unknown;
        error?: unknown;
      };

    for (
      const candidate
      of [
        payload.message,
        payload.error,
      ]
    ) {
      if (
        typeof candidate === "string"
      ) {
        return candidate;
      }

      if (
        Array.isArray(candidate)
      ) {
        return candidate
          .filter(
            (item):
              item is string =>
                typeof item === "string",
          )
          .join(" ");
      }
    }
  } catch {
    return "";
  }

  return "";
}

function readRedirectNotifications():
  NotificationRequest[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw =
    window.sessionStorage.getItem(
      REDIRECT_NOTIFICATION_KEY,
    );

  if (!raw) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(raw) as
        NotificationRequest[];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function createNotificationId():
  string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return (
    `notification-${Date.now()}-`
    + Math.random()
      .toString(36)
      .slice(2)
  );
}
