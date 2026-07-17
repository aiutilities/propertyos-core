from __future__ import annotations

from typing import Sequence

from .query_models import QueryRequest


COMMAND_ALIASES = {
    "summary": "summary",
    "repo-summary": "summary",
    "repository-summary": "summary",

    "module": "module",
    "show-module": "module",

    "dependencies": "dependencies",
    "dependency": "dependencies",
    "deps": "dependencies",

    "dependents": "dependents",
    "dependent": "dependents",
    "reverse-dependencies": "dependents",

    "blast-radius": "blast-radius",
    "blast": "blast-radius",
    "impact": "blast-radius",

    "routes": "routes",
    "module-routes": "routes",

    "controllers": "controllers",
    "module-controllers": "controllers",

    "components": "components",
    "module-components": "components",

    "violations": "violations",
    "architecture-violations": "violations",

    "plugin-candidates": "plugin-candidates",
    "migration-candidates": "plugin-candidates",

    "critical": "critical",
    "critical-modules": "critical",

    "high-risk": "high-risk",
    "high-risk-modules": "high-risk",

    "top-risk": "top-risk",
    "risk-ranking": "top-risk",

    "top-routes": "top-routes",
    "largest-modules": "top-routes",

    "find-module": "find-module",
    "search-module": "find-module",

    "find-controller": "find-controller",
    "search-controller": "find-controller",

    "find-route": "find-route",
    "search-route": "find-route",

    "permission": "permission",
    "routes-by-permission": "permission",
}


COMMANDS_REQUIRING_ARGUMENT = {
    "module",
    "dependencies",
    "dependents",
    "blast-radius",
    "routes",
    "controllers",
    "components",
    "find-module",
    "find-controller",
    "find-route",
    "permission",
}


COMMANDS_SUPPORTING_LIMIT = {
    "top-risk",
    "top-routes",
    "plugin-candidates",
    "violations",
    "critical",
    "high-risk",
    "find-module",
    "find-controller",
    "find-route",
    "permission",
}


COMMANDS_SUPPORTING_TRANSITIVE = {
    "dependencies",
    "dependents",
}


def _parse_positive_integer(
    value: str,
    field_name: str,
) -> int:
    try:
        parsed = int(value)
    except ValueError as error:
        raise ValueError(
            f"{field_name} must be a positive integer: "
            f"{value}"
        ) from error

    if parsed <= 0:
        raise ValueError(
            f"{field_name} must be greater than zero."
        )

    return parsed


def parse_query(
    arguments: Sequence[str],
) -> QueryRequest:
    if not arguments:
        raise ValueError(
            "A query command is required."
        )

    raw_command = arguments[0].strip().lower()

    if raw_command not in COMMAND_ALIASES:
        supported = ", ".join(
            sorted(set(COMMAND_ALIASES.values()))
        )

        raise ValueError(
            f"Unknown query command: {raw_command}. "
            f"Supported commands: {supported}"
        )

    command = COMMAND_ALIASES[raw_command]

    positional: list[str] = []
    limit = None
    transitive = False

    index = 1

    while index < len(arguments):
        value = arguments[index]

        if value == "--transitive":
            if command not in (
                COMMANDS_SUPPORTING_TRANSITIVE
            ):
                raise ValueError(
                    f"--transitive is not supported "
                    f"for command: {command}"
                )

            transitive = True
            index += 1
            continue

        if value == "--limit":
            if command not in (
                COMMANDS_SUPPORTING_LIMIT
            ):
                raise ValueError(
                    f"--limit is not supported "
                    f"for command: {command}"
                )

            if index + 1 >= len(arguments):
                raise ValueError(
                    "--limit requires a value."
                )

            limit = _parse_positive_integer(
                arguments[index + 1],
                "Limit",
            )

            index += 2
            continue

        positional.append(value)
        index += 1

    if command in COMMANDS_REQUIRING_ARGUMENT:
        if not positional:
            raise ValueError(
                f"Command '{command}' requires "
                f"an argument."
            )

        argument = " ".join(positional).strip()
    else:
        argument = None

        if positional:
            if (
                command in COMMANDS_SUPPORTING_LIMIT
                and len(positional) == 1
            ):
                limit = _parse_positive_integer(
                    positional[0],
                    "Limit",
                )
            else:
                raise ValueError(
                    f"Command '{command}' does not "
                    f"accept these arguments: "
                    f"{' '.join(positional)}"
                )

    return QueryRequest(
        command=command,
        argument=argument,
        limit=limit,
        transitive=transitive,
    )
