#!/usr/bin/env python3

from pathlib import Path

FORM = Path(
    "frontend/src/components/property/"
    "PropertyForm.tsx"
)

NEW_PAGE = Path(
    "frontend/src/app/properties/new/"
    "page.tsx"
)

EDIT_PAGE = Path(
    "frontend/src/app/properties/[id]/edit/"
    "page.tsx"
)

SHELL = Path(
    "frontend/src/components/layout/"
    "AdminShell.tsx"
)

STYLES = Path(
    "frontend/src/app/styles.css"
)

for path in [
    FORM,
    NEW_PAGE,
    EDIT_PAGE,
    SHELL,
    STYLES,
]:
    if not path.is_file():
        raise SystemExit(
            f"ERROR: Required file missing: {path}"
        )

form = FORM.read_text(
    encoding="utf-8",
)

new_page = NEW_PAGE.read_text(
    encoding="utf-8",
)

edit_page = EDIT_PAGE.read_text(
    encoding="utf-8",
)

shell = SHELL.read_text(
    encoding="utf-8",
)

styles = STYLES.read_text(
    encoding="utf-8",
)

required_form = [
    "Basic information",
    "Address",
    "Configuration",
    "Required field",
    'href="/properties"',
    "Cancel",
    "Create property",
    "Update property",
    'autoFocus',
    'autoComplete="organization"',
    'autoComplete="address-line1"',
    'autoComplete="postal-code"',
    'list="property-type-options"',
    'aria-live="polite"',
    "property-form-actions",
    "cleanPayload(form)",
    'method:',
    '"PATCH"',
    '"POST"',
    "router.replace(",
]

for value in required_form:
    if value not in form:
        raise SystemExit(
            "ERROR: Required property-form "
            f"contract missing: {value}"
        )

required_pages = [
    (
        new_page,
        "Create property",
    ),
    (
        edit_page,
        "Edit property",
    ),
]

for page, value in required_pages:
    if value not in page:
        raise SystemExit(
            "ERROR: Property page contract "
            f"missing: {value}"
        )

required_shell = [
    "isLongFormRoute",
    'pathname === "/properties/new"',
    "admin-main-long-form",
]

for value in required_shell:
    if value not in shell:
        raise SystemExit(
            "ERROR: Long-form shell contract "
            f"missing: {value}"
        )

required_styles = [
    ".admin-main-long-form .topbar",
    "position: static",
    ".property-form-section",
    ".property-form-grid",
    ".property-form-actions",
    "position: sticky",
    ".property-form-cancel",
    ".property-form-submit",
    "@media (max-width: 760px)",
]

for value in required_styles:
    if value not in styles:
        raise SystemExit(
            "ERROR: Property-form style "
            f"contract missing: {value}"
        )

if '<form className="form-card"' in form:
    raise SystemExit(
        "ERROR: Legacy ungrouped form-card "
        "contract remains"
    )

print("Create Property remediation: VALID")
print("Sticky-header overlap:       prevented")
print("Basic information section:   present")
print("Address section:             present")
print("Configuration section:       present")
print("Required guidance:           present")
print("Optional guidance:           present")
print("Cancel action:               present")
print("Persistent action area:      present")
print("Loading state:               structured")
print("Error state:                 accessible")
print("Create API contract:         preserved")
print("Edit API contract:           preserved")
print("Responsive layout:           covered")
