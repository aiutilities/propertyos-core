"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  consumeRedirectNotifications,
  defaultNotificationConfiguration,
  getNotificationConfiguration,
  mergeNotificationConfiguration,
  NOTIFICATION_CONFIG_EVENT,
  NOTIFICATION_EVENT,
  NotificationConfiguration,
  NotificationRequest,
  readNotificationOverride,
  setNotificationConfiguration,
} from "@/lib/notifications";

type ActiveNotification =
  NotificationRequest & {
    id: string;
    createdAt: number;
  };

type NotificationContextValue = {
  configuration:
    NotificationConfiguration;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

export const NotificationContext =
  createContext<
    NotificationContextValue | undefined
  >(undefined);

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [
    configuration,
    setConfiguration,
  ] = useState(
    defaultNotificationConfiguration,
  );

  const [
    configurationLoaded,
    setConfigurationLoaded,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState<
    ActiveNotification[]
  >([]);

  const dismiss =
    useCallback(
      (id: string) => {
        setNotifications(
          (current) =>
            current.filter(
              (item) =>
                item.id !== id,
            ),
        );
      },
      [],
    );

  const dismissAll =
    useCallback(
      () => {
        setNotifications([]);
      },
      [],
    );

  const addNotification =
    useCallback(
      (
        request:
          NotificationRequest,
      ) => {
        const currentConfig =
          getNotificationConfiguration();

        if (
          !shouldShow(
            request.tone,
            currentConfig,
          )
        ) {
          return;
        }

        const item:
          ActiveNotification = {
            ...request,
            id:
              request.id ??
              createLocalId(),
            createdAt:
              request.createdAt ??
              Date.now(),
          };

        setNotifications(
          (current) => [
            ...current,
            item,
          ].slice(
            -currentConfig
              .maximumVisible,
          ),
        );

        const duration =
          request.durationMs ??
          currentConfig
            .autoDismissMs;

        if (duration > 0) {
          window.setTimeout(
            () =>
              dismiss(item.id),
            duration,
          );
        }
      },
      [dismiss],
    );

  useEffect(() => {
    let active = true;

    async function loadConfiguration() {
      let installationOverride:
        Partial<
          NotificationConfiguration
        > = {};

      try {
        const response =
          await fetch(
            "/config/notifications.json",
            {
              cache: "no-store",
            },
          );

        if (response.ok) {
          installationOverride =
            await response.json() as
              Partial<
                NotificationConfiguration
              >;
        }
      } catch (error) {
        console.warn(
          "Notification configuration could not be loaded.",
          error,
        );
      }

      if (!active) {
        return;
      }

      const merged =
        mergeNotificationConfiguration(
          mergeNotificationConfiguration(
            defaultNotificationConfiguration,
            installationOverride,
          ),
          readNotificationOverride(),
        );

      setNotificationConfiguration(
        merged,
      );

      setConfiguration(merged);
      setConfigurationLoaded(true);
    }

    void loadConfiguration();

    return () => {
      active = false;
    };
  }, [addNotification]);

  useEffect(() => {
    if (!configurationLoaded) {
      return;
    }

    for (
      const item
      of consumeRedirectNotifications()
    ) {
      addNotification(item);
    }
  }, [
    pathname,
    configurationLoaded,
    addNotification,
  ]);

  useEffect(() => {
    function receiveNotification(
      event: Event,
    ) {
      const customEvent =
        event as
          CustomEvent<
            NotificationRequest
          >;

      addNotification(
        customEvent.detail,
      );
    }

    function receiveConfiguration(
      event: Event,
    ) {
      const customEvent =
        event as
          CustomEvent<
            NotificationConfiguration
          >;

      setConfiguration(
        customEvent.detail,
      );
    }

    window.addEventListener(
      NOTIFICATION_EVENT,
      receiveNotification,
    );

    window.addEventListener(
      NOTIFICATION_CONFIG_EVENT,
      receiveConfiguration,
    );

    return () => {
      window.removeEventListener(
        NOTIFICATION_EVENT,
        receiveNotification,
      );

      window.removeEventListener(
        NOTIFICATION_CONFIG_EVENT,
        receiveConfiguration,
      );
    };
  }, [addNotification]);

  const contextValue =
    useMemo(
      () => ({
        configuration,
        dismiss,
        dismissAll,
      }),
      [
        configuration,
        dismiss,
        dismissAll,
      ],
    );

  return (
    <NotificationContext.Provider
      value={contextValue}
    >
      {children}

      <div
        aria-label="Application notifications"
        aria-live="polite"
        aria-relevant="additions removals"
        className={
          `notification-viewport `
          + `notification-viewport-${configuration.position}`
        }
      >
        {notifications.map(
          (item) => (
            <article
              className={
                `notification-toast `
                + `notification-toast-${item.tone}`
              }
              key={item.id}
              role={
                item.tone === "error"
                  ? "alert"
                  : "status"
              }
            >
              <span
                aria-hidden="true"
                className="notification-toast-icon"
              >
                {getIcon(item.tone)}
              </span>

              <div className="notification-toast-content">
                <strong>
                  {item.title}
                </strong>

                {item.message ? (
                  <p>
                    {item.message}
                  </p>
                ) : null}
              </div>

              {configuration.manualDismiss ? (
                <button
                  aria-label="Dismiss notification"
                  className="notification-toast-dismiss"
                  onClick={() =>
                    dismiss(item.id)
                  }
                  type="button"
                >
                  ×
                </button>
              ) : null}
            </article>
          ),
        )}
      </div>
    </NotificationContext.Provider>
  );
}

function shouldShow(
  tone:
    NotificationRequest["tone"],
  config:
    NotificationConfiguration,
): boolean {
  if (!config.enabled) {
    return false;
  }

  if (tone === "success") {
    return config.showSuccess;
  }

  if (tone === "warning") {
    return config.showWarnings;
  }

  if (tone === "information") {
    return config.showInformation;
  }

  return config.showErrors;
}

function getIcon(
  tone:
    NotificationRequest["tone"],
): string {
  if (tone === "success") {
    return "✓";
  }

  if (tone === "warning") {
    return "⚠";
  }

  if (tone === "information") {
    return "i";
  }

  return "!";
}

function createLocalId():
  string {
  return (
    `toast-${Date.now()}-`
    + Math.random()
      .toString(36)
      .slice(2)
  );
}
