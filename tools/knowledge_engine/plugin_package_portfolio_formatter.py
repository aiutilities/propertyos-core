from __future__ import annotations

import json
from typing import Any

from .plugin_package_portfolio_models import (
    PluginPackagePortfolio,
)


def format_plugin_package_portfolio(
    portfolio: PluginPackagePortfolio,
    output_format: str,
) -> str:
    if output_format == "json":
        return (
            json.dumps(
                portfolio.to_dict(),
                indent=2,
                sort_keys=True,
            )
            + "\n"
        )

    if output_format == "markdown":
        return _markdown(portfolio)

    raise ValueError(
        "Unsupported package portfolio format: "
        f"{output_format}"
    )


def _markdown(
    portfolio: PluginPackagePortfolio,
) -> str:
    value = portfolio.to_dict()
    summary = value["summary"]

    lines = [
        "# PropertyOS Plugin Package Portfolio",
        "",
        "## Summary",
        "",
        (
            f"- Modules: "
            f"`{summary['moduleCount']}`"
        ),
        (
            f"- Passed: "
            f"`{summary['passedCount']}`"
        ),
        (
            f"- Failed: "
            f"`{summary['failedCount']}`"
        ),
        (
            f"- Blocked: "
            f"`{summary['blockedCount']}`"
        ),
        (
            f"- Pending: "
            f"`{summary['pendingCount']}`"
        ),
        (
            "- Total package size: "
            f"`{_human_bytes(summary['totalSizeBytes'])}`"
        ),
        (
            "- Portfolio result: "
            f"`{'passed' if summary['successful'] else 'failed'}`"
        ),
        "",
        "## Artifacts",
        "",
        (
            "| Module | Package | Version | Result | "
            "Size | Files | SHA-256 | Artifact |"
        ),
        (
            "|---|---|---:|---|---:|---:|---|---|"
        ),
    ]

    for artifact in value["artifacts"]:
        lines.append(
            "| "
            + " | ".join(
                (
                    _escape(
                        artifact["moduleId"]
                    ),
                    _code(
                        artifact["packageName"]
                    ),
                    _code(
                        artifact["version"]
                    ),
                    artifact["status"],
                    _human_bytes(
                        artifact["sizeBytes"]
                    ),
                    str(
                        artifact["fileCount"]
                    ),
                    _code(
                        artifact["sha256"]
                        or "-"
                    ),
                    _code(
                        artifact[
                            "artifactPath"
                        ]
                        or "-"
                    ),
                )
            )
            + " |"
        )

    for artifact in value["artifacts"]:
        lines.extend(
            (
                "",
                (
                    "## Module: "
                    f"`{_escape(artifact['moduleId'])}`"
                ),
                "",
                (
                    f"- Plugin: "
                    f"`{_escape(artifact['pluginId'])}`"
                ),
                (
                    f"- Package: "
                    f"`{_escape(artifact['packageName'])}`"
                ),
                (
                    f"- Version: "
                    f"`{_escape(artifact['version'])}`"
                ),
                (
                    f"- Workspace: "
                    f"`{_escape(artifact['workspace'])}`"
                ),
                (
                    f"- Result: "
                    f"`{artifact['status']}`"
                ),
                "",
                (
                    "| Stage | Status | Seconds | "
                    "Exit | Detail | Command |"
                ),
                (
                    "|---|---|---:|---:|---|---|"
                ),
            )
        )

        for stage in artifact["stages"]:
            detail = (
                "Command completed successfully."
                if (
                    stage["status"] == "passed"
                    and stage["command"]
                )
                else stage["detail"]
            )

            lines.append(
                "| "
                + " | ".join(
                    (
                        stage["stage"],
                        stage["status"],
                        (
                            f"{stage['durationSeconds']:.3f}"
                        ),
                        (
                            str(stage["exitCode"])
                            if stage["exitCode"]
                            is not None
                            else "-"
                        ),
                        _escape(detail or "-"),
                        _code(
                            " ".join(
                                stage["command"]
                            )
                            or "-"
                        ),
                    )
                )
                + " |"
            )

        if artifact["errors"]:
            lines.extend(
                (
                    "",
                    "### Errors",
                    "",
                )
            )
            lines.extend(
                f"- {_escape(error)}"
                for error
                in artifact["errors"]
            )

        if artifact["warnings"]:
            lines.extend(
                (
                    "",
                    "### Warnings",
                    "",
                )
            )
            lines.extend(
                f"- {_escape(warning)}"
                for warning
                in artifact["warnings"]
            )

    return "\n".join(lines) + "\n"


def _human_bytes(
    size: Any,
) -> str:
    value = float(size)

    for unit in (
        "B",
        "KiB",
        "MiB",
        "GiB",
    ):
        if value < 1024 or unit == "GiB":
            if unit == "B":
                return f"{int(value)} {unit}"

            return f"{value:.1f} {unit}"

        value /= 1024

    return f"{value:.1f} GiB"


def _escape(
    value: Any,
) -> str:
    return (
        str(value)
        .replace("\\", "\\\\")
        .replace("|", "\\|")
        .replace("\n", " ")
    )


def _code(
    value: Any,
) -> str:
    return "`" + _escape(value) + "`"
