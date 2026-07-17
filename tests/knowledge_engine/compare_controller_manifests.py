from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

LEGACY_PATH = (
    REPOSITORY_ROOT
    / "generated"
    / "knowledge"
    / "controllers.json"
)

AST_PATH = (
    REPOSITORY_ROOT
    / "generated"
    / "knowledge"
    / "controllers.ast.json"
)


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def route_key(route: dict[str, Any]) -> tuple[str, ...]:
    return (
        route["controllerId"],
        route["httpMethod"],
        route["fullPath"],
        route["handler"],
    )


def controller_map(
    manifest: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    return {
        controller["id"]: controller
        for controller in manifest["controllers"]
    }


def route_map(
    manifest: dict[str, Any],
) -> dict[tuple[str, ...], dict[str, Any]]:
    return {
        route_key(route): route
        for controller in manifest["controllers"]
        for route in controller["routes"]
    }


def main() -> int:
    legacy = load(LEGACY_PATH)
    ast = load(AST_PATH)

    legacy_controllers = controller_map(legacy)
    ast_controllers = controller_map(ast)

    legacy_routes = route_map(legacy)
    ast_routes = route_map(ast)

    missing_controllers = sorted(
        set(legacy_controllers) - set(ast_controllers)
    )

    extra_controllers = sorted(
        set(ast_controllers) - set(legacy_controllers)
    )

    missing_routes = sorted(
        set(legacy_routes) - set(ast_routes)
    )

    extra_routes = sorted(
        set(ast_routes) - set(legacy_routes)
    )

    field_differences: list[str] = []

    controller_fields = (
        "moduleId",
        "className",
        "basePath",
        "guards",
        "bearerAuth",
        "routeCount",
        "source",
    )

    for controller_id in sorted(
        set(legacy_controllers) &
        set(ast_controllers)
    ):
        left = legacy_controllers[controller_id]
        right = ast_controllers[controller_id]

        for field in controller_fields:
            if left[field] != right[field]:
                field_differences.append(
                    f"controller {controller_id} "
                    f"field {field}: "
                    f"legacy={left[field]!r} "
                    f"ast={right[field]!r}"
                )

    route_fields = (
        "controllerClassName",
        "moduleId",
        "path",
        "permissions",
        "bearerAuth",
        "handlerLine",
        "source",
    )

    for key in sorted(
        set(legacy_routes) & set(ast_routes)
    ):
        left = legacy_routes[key]
        right = ast_routes[key]

        for field in route_fields:
            if left[field] != right[field]:
                field_differences.append(
                    f"route {key} field {field}: "
                    f"legacy={left[field]!r} "
                    f"ast={right[field]!r}"
                )

    print("===== Controller AST Parity =====")
    print(
        "Legacy controllers:",
        legacy["controllerCount"],
    )
    print(
        "AST controllers:",
        ast["controllerCount"],
    )
    print(
        "Legacy routes:",
        legacy["routeCount"],
    )
    print(
        "AST routes:",
        ast["routeCount"],
    )

    legacy_methods = Counter(
        route["httpMethod"]
        for route in legacy_routes.values()
    )

    ast_methods = Counter(
        route["httpMethod"]
        for route in ast_routes.values()
    )

    print("Legacy HTTP methods:", dict(sorted(legacy_methods.items())))
    print("AST HTTP methods:", dict(sorted(ast_methods.items())))
    print("Missing controllers:", len(missing_controllers))
    print("Extra controllers:", len(extra_controllers))
    print("Missing routes:", len(missing_routes))
    print("Extra routes:", len(extra_routes))
    print("Field differences:", len(field_differences))

    if missing_controllers:
        print("\nMissing controllers:")
        for value in missing_controllers[:20]:
            print(" -", value)

    if extra_controllers:
        print("\nExtra controllers:")
        for value in extra_controllers[:20]:
            print(" -", value)

    if missing_routes:
        print("\nMissing routes:")
        for value in missing_routes[:20]:
            print(" -", value)

    if extra_routes:
        print("\nExtra routes:")
        for value in extra_routes[:20]:
            print(" -", value)

    if field_differences:
        print("\nFirst field differences:")
        for value in field_differences[:40]:
            print(" -", value)

    structural_parity = (
        not missing_controllers
        and not extra_controllers
        and not missing_routes
        and not extra_routes
    )

    if structural_parity:
        print("\nSTRUCTURAL PARITY: PASS")
    else:
        print("\nSTRUCTURAL PARITY: FAIL")

    exact_parity = (
        structural_parity
        and not field_differences
    )

    if exact_parity:
        print("EXACT PARITY: PASS")
        return 0

    print("EXACT PARITY: NOT YET ACHIEVED")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
