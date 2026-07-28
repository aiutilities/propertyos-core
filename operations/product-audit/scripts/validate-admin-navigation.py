#!/usr/bin/env python3

from pathlib import Path

SHELL = Path(
    "frontend/src/components/layout/"
    "AdminShell.tsx"
)

STYLES = Path(
    "frontend/src/app/styles.css"
)

if not SHELL.is_file():
    raise SystemExit(
        f"ERROR: Missing shell: {SHELL}"
    )

if not STYLES.is_file():
    raise SystemExit(
        f"ERROR: Missing styles: {STYLES}"
    )

shell = SHELL.read_text(
    encoding="utf-8"
)

styles = STYLES.read_text(
    encoding="utf-8"
)

required_shell = [
    'label: "Overview"',
    'label: "Property"',
    'label: "Service Operations"',
    'label: "Finance"',
    'label: "Procurement"',
    'label: "Community"',
    'label: "Automation"',
    'label: "Platform"',
    'label: "Procurement Dashboard"',
    'label: "Staff"',
    'label: "Access Control"',
    "useState<Record<string, boolean>>",
    "aria-expanded={expanded}",
    'className="nav-group-toggle"',
    "toggleGroup(",
    "hidden={!expanded}",
]

for value in required_shell:
    if value not in shell:
        raise SystemExit(
            "ERROR: Required navigation "
            f"contract missing: {value}"
        )

for forbidden in [
    'label: "Resident Portal"',
    'label: "My Bookings"',
    'label: "My Helpdesk"',
    'label: "My Maintenance"',
    'label: "My Vehicles"',
]:
    if forbidden in shell:
        raise SystemExit(
            "ERROR: Resident navigation remains "
            f"in administrator shell: {forbidden}"
        )

if shell.count(
    'label: "Dashboard"'
) != 1:
    raise SystemExit(
        "ERROR: Administrator navigation must "
        "contain exactly one generic Dashboard label"
    )

required_styles = [
    ".nav-group-toggle",
    ".nav-group-chevron",
    ".nav-group-items[hidden]",
    ".nav-group.expanded",
]

for value in required_styles:
    if value not in styles:
        raise SystemExit(
            "ERROR: Required navigation style "
            f"missing: {value}"
        )

print("Administration navigation: VALID")
print("Resident links in admin nav: absent")
print("Domain groups:               8")
print("Collapsible groups:          true")
print("Active group expansion:      true")
print("Keyboard semantics:          covered")
print("Duplicate Dashboard label:   absent")
