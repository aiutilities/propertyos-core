from __future__ import annotations

import json
from typing import Any

from .query_models import QueryResult


def _string(value: Any) -> str:
    if value is None:
        return ""

    if isinstance(value, bool):
        return "yes" if value else "no"

    return str(value)


def _json_safe_result(
    result: QueryResult,
) -> dict[str, Any]:
    return {
        "queryType": result.query_type,
        "title": result.title,
        "columns": [
            {
                "key": column.key,
                "title": column.title,
            }
            for column in result.columns
        ],
        "rows": list(result.rows),
        "metadata": result.metadata,
    }


def format_json(
    result: QueryResult,
) -> str:
    return json.dumps(
        _json_safe_result(result),
        indent=2,
        sort_keys=True,
    )


def format_markdown(
    result: QueryResult,
) -> str:
    lines = [
        f"# {result.title}",
        "",
    ]

    if result.rows:
        headers = [
            column.title
            for column in result.columns
        ]

        lines.append(
            "| "
            + " | ".join(headers)
            + " |"
        )

        lines.append(
            "|"
            + "|".join(
                "---"
                for _ in headers
            )
            + "|"
        )

        for row in result.rows:
            values = []

            for column in result.columns:
                value = _string(
                    row.get(column.key, "")
                )

                value = (
                    value
                    .replace("|", r"\|")
                    .replace("\n", " ")
                )

                values.append(value)

            lines.append(
                "| "
                + " | ".join(values)
                + " |"
            )
    else:
        lines.append("_No results._")

    if result.metadata:
        lines.extend(
            [
                "",
                "## Metadata",
                "",
                "```json",
                json.dumps(
                    result.metadata,
                    indent=2,
                    sort_keys=True,
                ),
                "```",
            ]
        )

    return "\n".join(lines) + "\n"


def format_table(
    result: QueryResult,
) -> str:
    if not result.rows:
        return (
            f"{result.title}\n"
            "No results.\n"
        )

    widths = {}

    for column in result.columns:
        values = [
            _string(
                row.get(column.key, "")
            )
            for row in result.rows
        ]

        widths[column.key] = max(
            [len(column.title)]
            + [len(value) for value in values]
        )

    header = "  ".join(
        column.title.ljust(
            widths[column.key]
        )
        for column in result.columns
    )

    separator = "  ".join(
        "-" * widths[column.key]
        for column in result.columns
    )

    lines = [
        result.title,
        header,
        separator,
    ]

    for row in result.rows:
        lines.append(
            "  ".join(
                _string(
                    row.get(column.key, "")
                ).ljust(
                    widths[column.key]
                )
                for column in result.columns
            )
        )

    lines.append("")
    lines.append(
        f"Results: {len(result.rows)}"
    )

    return "\n".join(lines) + "\n"
