from __future__ import annotations

import json
import shlex
from typing import List

from .extraction_portfolio_models import (
    ExtractionPortfolio,
    ExtractionStageResult,
    ModuleExtractionResult,
)


def format_extraction_portfolio_json(
    portfolio: ExtractionPortfolio,
) -> str:
    return (
        json.dumps(
            portfolio.to_dict(),
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )


def _cell(value: object) -> str:
    return (
        str(value)
        .replace("\n", " ")
        .replace("|", "\\|")
    )


def _command(
    result: ExtractionStageResult,
) -> str:
    if result.command is None:
        return "-"

    return shlex.join(result.command)


def _stage_rows(
    module: ModuleExtractionResult,
) -> List[str]:
    rows = []

    for result in module.stages:
        exit_code = (
            "-"
            if result.exit_code is None
            else str(result.exit_code)
        )

        detail = result.detail or "-"
        command = _command(result)

        rows.append(
            "| "
            + " | ".join(
                (
                    _cell(result.stage.value),
                    _cell(result.status.value),
                    _cell(
                        f"{result.duration_seconds:.3f}"
                    ),
                    _cell(exit_code),
                    _cell(detail),
                    _cell(command),
                )
            )
            + " |"
        )

    if not rows:
        rows.append(
            "| - | pending | 0.000 | - | "
            "No stages executed. | - |"
        )

    return rows


def _module_section(
    module: ModuleExtractionResult,
) -> str:
    lines = [
        f"## Module: `{module.module_id}`",
        "",
        f"- Package: `{module.package_name}`",
        f"- Workspace: `{module.workspace.as_posix()}`",
        f"- Result: `{module.status.value}`",
        "",
        "| Stage | Status | Seconds | Exit | Detail | Command |",
        "|---|---|---:|---:|---|---|",
        *_stage_rows(module),
    ]

    if module.warnings:
        lines.extend(
            (
                "",
                "### Warnings",
                "",
            )
        )

        lines.extend(
            f"- {_cell(warning)}"
            for warning in module.warnings
        )

    if module.errors:
        lines.extend(
            (
                "",
                "### Errors",
                "",
            )
        )

        lines.extend(
            f"- {_cell(error)}"
            for error in module.errors
        )

    return "\n".join(lines)


def format_extraction_portfolio_markdown(
    portfolio: ExtractionPortfolio,
) -> str:
    value = portfolio.to_dict()
    summary = value["summary"]

    lines = [
        "# PropertyOS Module Extraction Portfolio",
        "",
        "## Summary",
        "",
        f"- Modules: `{summary['moduleCount']}`",
        f"- Passed: `{summary['passedCount']}`",
        f"- Failed: `{summary['failedCount']}`",
        f"- Blocked: `{summary['blockedCount']}`",
        f"- Pending: `{summary['pendingCount']}`",
        (
            "- Portfolio result: "
            f"`{'passed' if summary['successful'] else 'failed'}`"
        ),
    ]

    if not portfolio.modules:
        lines.extend(
            (
                "",
                "_No modules were selected._",
            )
        )
    else:
        for module in portfolio.modules:
            lines.extend(
                (
                    "",
                    _module_section(module),
                )
            )

    return "\n".join(lines) + "\n"
