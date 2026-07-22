from __future__ import annotations

import json

from .authorization_models import AuthorizationReport


def format_json(
    report: AuthorizationReport,
) -> str:
    return (
        json.dumps(
            report.to_dict(),
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )


def format_markdown(
    report: AuthorizationReport,
) -> str:
    lines = [
        "# Authorization Assurance Report",
        "",
        f"**Status:** {report.status}",
        "",
        "## Summary",
        "",
        "| Metric | Value |",
        "|---|---:|",
        f"| Controllers | {report.controller_count} |",
        f"| Endpoints | {report.endpoint_count} |",
        (
            "| Public endpoints | "
            f"{report.public_endpoint_count} |"
        ),
        (
            "| Authenticated endpoints | "
            f"{report.authenticated_endpoint_count} |"
        ),
        (
            "| Permission-protected endpoints | "
            f"{report.permission_protected_endpoint_count} |"
        ),
        (
            "| Permission coverage | "
            f"{report.permission_coverage_percent:.2f}% |"
        ),
        (
            "| Permission definitions | "
            f"{report.permission_definition_count} |"
        ),
        (
            "| Permission references | "
            f"{report.permission_reference_count} |"
        ),
        (
            "| Blocking violations | "
            f"{len(report.violations)} |"
        ),
        (
            "| Unused permission definitions | "
            f"{len(report.unused_permission_definitions)} |"
        ),
        "",
        "## Blocking Violations",
        "",
    ]

    if report.violations:
        lines.extend(
            [
                "| Code | Location | Message |",
                "|---|---|---|",
            ]
        )

        for violation in report.violations:
            location = violation.path

            if violation.line is not None:
                location += f":{violation.line}"

            message = violation.message.replace(
                "|",
                "\\|",
            )

            lines.append(
                f"| {violation.code} "
                f"| `{location}` "
                f"| {message} |"
            )
    else:
        lines.append(
            "No blocking authorization violations were detected."
        )

    lines.extend(
        [
            "",
            "## Governance Findings",
            "",
            "Unused permission definitions do not fail the check.",
            "",
        ]
    )

    if report.unused_permission_definitions:
        for definition in report.unused_permission_definitions:
            lines.append(
                f"- `{definition.name}` → `{definition.value}`"
            )
    else:
        lines.append(
            "No unused permission definitions were detected."
        )

    lines.extend(
        [
            "",
            "## Endpoint Classification",
            "",
            "| Classification | Count |",
            "|---|---:|",
            (
                "| Public | "
                f"{report.public_endpoint_count} |"
            ),
            (
                "| Authenticated | "
                f"{report.authenticated_endpoint_count} |"
            ),
            (
                "| Permission protected | "
                f"{report.permission_protected_endpoint_count} |"
            ),
            "",
        ]
    )

    return "\n".join(lines)


def format_report(
    report: AuthorizationReport,
    output_format: str,
) -> str:
    if output_format == "json":
        return format_json(report)

    if output_format == "markdown":
        return format_markdown(report)

    raise ValueError(
        f"Unsupported output format: {output_format}"
    )
