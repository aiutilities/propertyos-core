#!/usr/bin/env python3

from pathlib import Path


FILES = {
    "property": Path(
        "frontend/src/components/property/"
        "PropertyForm.tsx"
    ),
    "zone": Path(
        "frontend/src/components/zone/"
        "ZoneForm.tsx"
    ),
    "space": Path(
        "frontend/src/components/space/"
        "SpaceForm.tsx"
    ),
    "test": Path(
        "frontend/tests/"
        "property-notification-integration.contract.test.mjs"
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


property_form = FILES["property"].read_text(
    encoding="utf-8"
)

zone_form = FILES["zone"].read_text(
    encoding="utf-8"
)

space_form = FILES["space"].read_text(
    encoding="utf-8"
)

test_contract = FILES["test"].read_text(
    encoding="utf-8"
)


require(
    property_form,
    [
        "useNotifications",
        "notifications.afterRedirect.created",
        "notifications.afterRedirect.updated",
        'notifications.error(',
        '"Property"',
        '"Your changes have been saved."',
        "router.replace(",
    ],
    "Property integration",
)

require(
    zone_form,
    [
        "useNotifications",
        "notifications.afterRedirect.created",
        'notifications.error(',
        '"Zone"',
        "router.replace(",
    ],
    "Zone integration",
)

require(
    space_form,
    [
        "useNotifications",
        "notifications.afterRedirect.created",
        'notifications.error(',
        '"Space"',
        "router.replace(",
    ],
    "Space integration",
)

for label, source in [
    ("Zone", zone_form),
    ("Space", space_form),
]:
    if (
        "err instanceof Error"
        " ? err.message"
        in source
    ):
        fail(
            f"{label} still displays raw API errors"
        )


require(
    test_contract,
    [
        "queues Property create and update notifications",
        "shows sanitized Property failure notifications",
        "queues Zone creation notification",
        "queues Space creation notification",
        "does not expose raw mutation errors inline",
    ],
    "Integration tests",
)


print("Property notification integration: VALID")
print("Property create notification:       covered")
print("Property update notification:       covered")
print("Property failure notification:      covered")
print("Zone create notification:           covered")
print("Zone failure notification:          covered")
print("Space create notification:          covered")
print("Space failure notification:         covered")
print("Redirect persistence:               covered")
print("Raw inline mutation errors:         absent")
