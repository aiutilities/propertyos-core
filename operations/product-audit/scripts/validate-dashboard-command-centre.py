#!/usr/bin/env python3

from pathlib import Path

PAGE = Path(
    "frontend/src/app/dashboard/page.tsx"
)

DASHBOARD = Path(
    "frontend/src/components/dashboard/"
    "DashboardOverview.tsx"
)

STYLES = Path(
    "frontend/src/app/styles.css"
)

for path in [
    PAGE,
    DASHBOARD,
    STYLES,
]:
    if not path.is_file():
        raise SystemExit(
            f"ERROR: Missing dashboard file: {path}"
        )

page = PAGE.read_text(
    encoding="utf-8"
)

dashboard = DASHBOARD.read_text(
    encoding="utf-8"
)

styles = STYLES.read_text(
    encoding="utf-8"
)

required_page = [
    "<DashboardOverview />",
    "<AdminShell>",
    "<ProtectedRoute>",
]

for value in required_page:
    if value not in page:
        raise SystemExit(
            "ERROR: Dashboard page contract "
            f"missing: {value}"
        )

if "<h1>Dashboard</h1>" in page:
    raise SystemExit(
        "ERROR: Duplicate dashboard heading remains"
    )

required_dashboard = [
    "What needs attention today?",
    "Priorities and exceptions",
    "Quick actions",
    "Operating health",
    "Monthly position",
    "Service readiness",
    'href: "/tenants/new"',
    'href: "/receipts/new"',
    'href: "/maintenance/new"',
    'href: "/properties/new"',
    'href: "/procurement/requests/new"',
    'href: "/procurement/goods-receipts/new"',
    "Outstanding rent",
    "Overdue invoices",
    "Vacant spaces",
    'aria-label="Loading dashboard"',
    "Retry dashboard",
    "Create first property",
    'currency: "INR"',
    '"en-IN"',
]

for value in required_dashboard:
    if value not in dashboard:
        raise SystemExit(
            "ERROR: Dashboard command-centre "
            f"contract missing: {value}"
        )

required_styles = [
    ".command-centre-hero",
    ".priority-grid",
    ".quick-action-grid",
    ".command-metric-grid",
    ".command-centre-columns",
    ".command-centre-loading",
    "@media (max-width: 760px)",
]

for value in required_styles:
    if value not in styles:
        raise SystemExit(
            "ERROR: Dashboard style "
            f"contract missing: {value}"
        )

print("Dashboard command centre: VALID")
print("Duplicate H1:              absent")
print("Priority section:          present")
print("Quick actions:             6")
print("Portfolio metrics:         present")
print("Financial position:        present")
print("Platform readiness:        present")
print("Loading state:             structured")
print("Error recovery:            present")
print("Empty state:               actionable")
print("Responsive layout:         covered")
print("Currency locale:           en-IN / INR")
