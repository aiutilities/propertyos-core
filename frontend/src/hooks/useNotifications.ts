"use client";

import {
  useContext,
  useMemo,
} from "react";

import {
  NotificationContext,
} from "@/components/notification/NotificationProvider";

import {
  createEntityNotification,
  dispatchNotification,
  NotificationAction,
  queueRedirectNotification,
  sanitizeNotificationError,
} from "@/lib/notifications";

export function useNotifications() {
  const context =
    useContext(
      NotificationContext,
    );

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider.",
    );
  }

  return useMemo(
    () => {
      function entity(
        action:
          NotificationAction,
        redirect = false,
      ) {
        return (
          entityType: string,
          entityName?: string,
          message?: string,
        ) => {
          const notification =
            createEntityNotification(
              action,
              entityType,
              entityName,
              message,
            );

          if (redirect) {
            queueRedirectNotification(
              notification,
            );
          } else {
            dispatchNotification(
              notification,
            );
          }
        };
      }

      return {
        configuration:
          context.configuration,

        dismiss:
          context.dismiss,

        dismissAll:
          context.dismissAll,

        success(
          title: string,
          message?: string,
        ) {
          dispatchNotification({
            tone: "success",
            title,
            message,
          });
        },

        warning(
          title: string,
          message?: string,
        ) {
          dispatchNotification({
            tone: "warning",
            title,
            message,
          });
        },

        information(
          title: string,
          message?: string,
        ) {
          dispatchNotification({
            tone: "information",
            title,
            message,
          });
        },

        error(
          error: unknown,
          title =
            "The operation could not be completed.",
        ) {
          dispatchNotification({
            tone: "error",
            title,
            message:
              sanitizeNotificationError(
                error,
              ),
            durationMs: 8000,
          });
        },

        created:
          entity("create"),

        updated:
          entity("update"),

        deleted:
          entity("delete"),

        activated:
          entity("activate"),

        deactivated:
          entity("deactivate"),

        approved:
          entity("approve"),

        rejected:
          entity("reject"),

        submitted:
          entity("submit"),

        completed:
          entity("complete"),

        cancelled:
          entity("cancel"),

        installed:
          entity("install"),

        uninstalled:
          entity("uninstall"),

        afterRedirect: {
          created:
            entity(
              "create",
              true,
            ),

          updated:
            entity(
              "update",
              true,
            ),

          deleted:
            entity(
              "delete",
              true,
            ),

          approved:
            entity(
              "approve",
              true,
            ),

          rejected:
            entity(
              "reject",
              true,
            ),

          completed:
            entity(
              "complete",
              true,
            ),
        },
      };
    },
    [context],
  );
}
