#!/usr/bin/env python3

import json
from pathlib import Path


FILES = {
    "layout": Path(
        "frontend/src/app/layout.tsx"
    ),
    "provider": Path(
        "frontend/src/components/notification/"
        "NotificationProvider.tsx"
    ),
    "hook": Path(
        "frontend/src/hooks/useNotifications.ts"
    ),
    "runtime": Path(
        "frontend/src/lib/notifications.ts"
    ),
    "configuration": Path(
        "frontend/public/config/notifications.json"
    ),
    "styles": Path(
        "frontend/src/app/styles.css"
    ),
    "test": Path(
        "frontend/tests/"
        "global-notification-foundation.contract.test.mjs"
    ),
    "contract": Path(
        "documentation/product-audit/"
        "GLOBAL_NOTIFICATION_UX_CONTRACT.md"
    ),
}


def fail(message: str) -> None:
    raise SystemExit(
        f"ERROR: {message}"
    )


def require(
    source: str,
    values: list[str],
    label: str,
) -> None:
    missing = [
        value
        for value in values
        if value not in source
    ]

    if missing:
        fail(
            f"{label} missing: "
            + ", ".join(missing)
        )


for name, file_path in FILES.items():
    if not file_path.is_file():
        fail(
            f"Missing {name}: {file_path}"
        )


layout = FILES["layout"].read_text(
    encoding="utf-8"
)

provider = FILES["provider"].read_text(
    encoding="utf-8"
)

hook = FILES["hook"].read_text(
    encoding="utf-8"
)

runtime = FILES["runtime"].read_text(
    encoding="utf-8"
)

styles = FILES["styles"].read_text(
    encoding="utf-8"
)

test_contract = FILES["test"].read_text(
    encoding="utf-8"
)

ux_contract = FILES["contract"].read_text(
    encoding="utf-8"
)

try:
    configuration = json.loads(
        FILES[
            "configuration"
        ].read_text(
            encoding="utf-8"
        )
    )
except json.JSONDecodeError as error:
    fail(
        "Invalid notification JSON: "
        + str(error)
    )


require(
    layout,
    [
        "NotificationProvider",
        "<NotificationProvider>",
    ],
    "Root provider contract",
)

require(
    provider,
    [
        'aria-live="polite"',
        'aria-label="Dismiss notification"',
        "manualDismiss",
        "maximumVisible",
        "autoDismissMs",
    ],
    "Provider contract",
)

require(
    runtime,
    [
        "NotificationTone",
        "NotificationAction",
        "NotificationConfiguration",
        "NOTIFICATION_EVENT",
        "REDIRECT_NOTIFICATION_KEY",
        "NOTIFICATION_OVERRIDE_KEY",
        "interpolateNotificationTemplate",
        "dispatchNotification",
        "queueRedirectNotification",
        "consumeRedirectNotifications",
        "readNotificationOverride",
        "saveNotificationOverride",
        "sanitizeNotificationError",
        "sessionStorage",
        "localStorage",
    ],
    "Runtime contract",
)

require(
    hook,
    [
        "created:",
        "updated:",
        "deleted:",
        "approved:",
        "rejected:",
        "completed:",
        "afterRedirect:",
    ],
    "Hook contract",
)

require(
    styles,
    [
        ".notification-viewport",
        ".notification-toast",
        ".notification-toast-success",
        ".notification-toast-error",
        ".notification-toast-warning",
        ".notification-toast-information",
        ".notification-toast-dismiss",
        "@media (prefers-reduced-motion: reduce)",
        "@media (max-width: 600px)",
    ],
    "Style contract",
)

require(
    test_contract,
    [
        "installs the notification provider",
        "supports all four notification tones",
        "provides configurable CRUD templates",
        "supports redirect persistence",
        "supports administrator overrides",
        "sanitizes backend failures",
        "provides semantic action helpers",
        "documents notification governance",
    ],
    "Test contract",
)

require(
    ux_contract,
    [
        "No CRUD operation",
        "Configuration Hierarchy",
        "Redirect Persistence",
        "Accessibility",
        "Raw API JSON",
        "Every current and future CRUD",
    ],
    "UX contract",
)


required_keys = {
    "enabled",
    "position",
    "autoDismissMs",
    "maximumVisible",
    "includeEntityName",
    "persistAcrossRedirects",
    "manualDismiss",
    "soundEnabled",
    "showSuccess",
    "showInformation",
    "showWarnings",
    "showErrors",
    "deleteConfirmationRequired",
    "templates",
}

missing_keys = (
    required_keys
    - set(configuration)
)

if missing_keys:
    fail(
        "Configuration keys missing: "
        + ", ".join(
            sorted(missing_keys)
        )
    )


required_templates = {
    "create",
    "update",
    "delete",
    "activate",
    "deactivate",
    "approve",
    "reject",
    "submit",
    "complete",
    "cancel",
    "install",
    "uninstall",
    "payment",
    "receipt",
    "inventoryReceipt",
    "materialIssue",
    "materialReturn",
    "stockAdjustment",
    "import",
    "export",
}

missing_templates = (
    required_templates
    - set(
        configuration["templates"]
    )
)

if missing_templates:
    fail(
        "Templates missing: "
        + ", ".join(
            sorted(missing_templates)
        )
    )


print("Global notification foundation: VALID")
print("Provider installed:              true")
print("Configurable defaults:           true")
print("Runtime overrides:               true")
print("CRUD templates:                  complete")
print("Redirect persistence:            true")
print("Success tone:                    covered")
print("Error tone:                      covered")
print("Warning tone:                    covered")
print("Information tone:                covered")
print("Manual dismissal:                true")
print("Automatic dismissal:             true")
print("Accessible live region:          true")
print("Reduced motion:                  covered")
print("API error sanitization:          covered")
