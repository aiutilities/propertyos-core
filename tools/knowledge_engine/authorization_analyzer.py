from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path
from typing import Iterable

from .authorization_models import (
    AuthorizationReport,
    AuthorizationViolation,
    EndpointAuthorization,
    PermissionDefinition,
    PermissionReference,
)


PERMISSION_DEFINITION_PATTERN = re.compile(
    r'^\s*([A-Z][A-Z0-9_]*)\s*:\s*'
    r'["\']([^"\']+)["\']\s*,?',
    re.MULTILINE,
)

PERMISSION_REFERENCE_PATTERN = re.compile(
    r"\bPermissions\.([A-Z][A-Z0-9_]*)\b"
)

CONTROLLER_PATTERN = re.compile(
    r"export\s+class\s+([A-Za-z_][A-Za-z0-9_]*Controller)\b"
)

HTTP_DECORATOR_PATTERN = re.compile(
    r"@(?P<method>Get|Post|Put|Patch|Delete|Options|Head|All)"
    r"\s*\((?P<route>[\s\S]*?)\)"
)

METHOD_DECLARATION_PATTERN = re.compile(
    r"(?:public\s+|private\s+|protected\s+)?"
    r"(?:async\s+)?"
    r"(?P<method>[A-Za-z_][A-Za-z0-9_]*)\s*\("
)

REQUIRE_PERMISSION_PATTERN = re.compile(
    r"@RequirePermission\s*\(\s*"
    r"Permissions\.([A-Z][A-Z0-9_]*)\s*\)"
)

USE_GUARDS_PATTERN = re.compile(
    r"@UseGuards\s*\((?P<body>[\s\S]*?)\)"
)

PUBLIC_PATTERN = re.compile(
    r"@Public\s*\(\s*\)"
)

API_BEARER_PATTERN = re.compile(
    r"@ApiBearerAuth(?:\s*\([^)]*\))?"
)

DECORATOR_LINE_PATTERN = re.compile(
    r"^\s*@"
)


def _relative(
    path: Path,
    root: Path,
) -> str:
    return path.resolve().relative_to(
        root.resolve()
    ).as_posix()


def parse_permission_definitions(
    registry_path: Path,
) -> list[PermissionDefinition]:
    source = registry_path.read_text(
        encoding="utf-8",
    )

    return [
        PermissionDefinition(
            name=name,
            value=value,
        )
        for name, value
        in PERMISSION_DEFINITION_PATTERN.findall(source)
    ]


def find_permission_references(
    source_root: Path,
    repository_root: Path,
) -> list[PermissionReference]:
    references: list[PermissionReference] = []

    for path in sorted(source_root.rglob("*.ts")):
        source = path.read_text(
            encoding="utf-8",
            errors="replace",
        )

        for line_number, line in enumerate(
            source.splitlines(),
            start=1,
        ):
            for name in PERMISSION_REFERENCE_PATTERN.findall(line):
                references.append(
                    PermissionReference(
                        name=name,
                        path=_relative(
                            path,
                            repository_root,
                        ),
                        line=line_number,
                    )
                )

    return references


def discover_controller_files(
    controller_roots: Iterable[Path],
) -> list[Path]:
    paths: set[Path] = set()

    for root in controller_roots:
        if not root.exists():
            continue

        for path in root.rglob("*controller.ts"):
            if path.is_file():
                paths.add(path.resolve())

    return sorted(paths)


def _line_number(
    source: str,
    offset: int,
) -> int:
    return source.count(
        "\n",
        0,
        offset,
    ) + 1


def _class_decorator_context(
    source: str,
    class_offset: int,
) -> str:
    prefix = source[:class_offset]
    lines = prefix.splitlines()

    context: list[str] = []
    collecting = False
    balance = 0

    for line in reversed(lines):
        stripped = line.strip()

        if not stripped:
            if context:
                continue
            continue

        if stripped.startswith("@") or collecting:
            context.append(line)

            balance += (
                stripped.count("(")
                - stripped.count(")")
            )

            collecting = balance > 0
            continue

        break

    return "\n".join(
        reversed(context)
    )


def _endpoint_decorator_context(
    source: str,
    endpoint_start: int,
    endpoint_end: int,
) -> tuple[str, str]:
    tail = source[endpoint_end:]

    method_match = METHOD_DECLARATION_PATTERN.search(
        tail
    )

    if method_match is None:
        return (
            source[
                endpoint_start:endpoint_end
            ],
            "<unknown>",
        )

    method_name = method_match.group(
        "method"
    )

    method_offset = (
        endpoint_end
        + method_match.start()
    )

    block_start = endpoint_start
    prefix = source[:endpoint_start]

    prefix_lines = prefix.splitlines(
        keepends=True,
    )

    consumed = len(prefix)

    for line in reversed(prefix_lines):
        stripped = line.strip()
        consumed -= len(line)

        if not stripped:
            block_start = consumed
            continue

        if DECORATOR_LINE_PATTERN.match(line):
            block_start = consumed
            continue

        break

    return (
        source[
            block_start:method_offset
        ],
        method_name,
    )


def _guard_flags(
    class_context: str,
    endpoint_context: str,
) -> tuple[bool, bool]:
    combined = (
        class_context
        + "\n"
        + endpoint_context
    )

    guard_bodies = [
        match.group("body")
        for match
        in USE_GUARDS_PATTERN.finditer(combined)
    ]

    guard_text = "\n".join(
        guard_bodies
    )

    return (
        "JwtAuthGuard" in guard_text,
        "PermissionGuard" in guard_text,
    )


def scan_controller(
    path: Path,
    repository_root: Path,
) -> list[EndpointAuthorization]:
    source = path.read_text(
        encoding="utf-8",
        errors="replace",
    )

    class_match = CONTROLLER_PATTERN.search(
        source
    )

    if class_match is None:
        controller_name = path.stem
        class_offset = 0
    else:
        controller_name = class_match.group(1)
        class_offset = class_match.start()

    class_context = _class_decorator_context(
        source,
        class_offset,
    )

    class_public = bool(
        PUBLIC_PATTERN.search(
            class_context
        )
    )

    class_bearer = bool(
        API_BEARER_PATTERN.search(
            class_context
        )
    )

    endpoints: list[
        EndpointAuthorization
    ] = []

    for match in HTTP_DECORATOR_PATTERN.finditer(
        source
    ):
        endpoint_context, method_name = (
            _endpoint_decorator_context(
                source,
                match.start(),
                match.end(),
            )
        )

        line = _line_number(
            source,
            match.start(),
        )

        permission_match = (
            REQUIRE_PERMISSION_PATTERN.search(
                endpoint_context
            )
        )

        permission = (
            permission_match.group(1)
            if permission_match
            else None
        )

        method_public = bool(
            PUBLIC_PATTERN.search(
                endpoint_context
            )
        )

        is_public = (
            class_public
            or method_public
        )

        (
            has_jwt_guard,
            has_permission_guard,
        ) = _guard_flags(
            class_context,
            endpoint_context,
        )

        has_bearer_auth = (
            class_bearer
            or bool(
                API_BEARER_PATTERN.search(
                    endpoint_context
                )
            )
        )

        if is_public:
            classification = "public"
        elif permission is not None:
            classification = (
                "permission-protected"
            )
        else:
            classification = (
                "authenticated"
            )

        route = " ".join(
            match.group("route").split()
        )

        endpoints.append(
            EndpointAuthorization(
                path=_relative(
                    path,
                    repository_root,
                ),
                controller=controller_name,
                method=method_name,
                http_method=match.group(
                    "method"
                ).upper(),
                route=route,
                line=line,
                classification=classification,
                permission=permission,
                has_jwt_guard=(
                    has_jwt_guard
                ),
                has_permission_guard=(
                    has_permission_guard
                ),
                has_bearer_auth=(
                    has_bearer_auth
                ),
                is_public=is_public,
            )
        )

    return endpoints


def analyze_authorization(
    repository_root: Path,
    permission_registry: Path,
    controller_roots: Iterable[Path],
    source_root: Path,
) -> AuthorizationReport:
    repository_root = repository_root.resolve()
    permission_registry = permission_registry.resolve()
    source_root = source_root.resolve()

    resolved_controller_roots = [
        path.resolve()
        for path in controller_roots
    ]

    definitions = parse_permission_definitions(
        permission_registry
    )

    references = find_permission_references(
        source_root,
        repository_root,
    )

    definitions_by_name = {
        item.name: item
        for item in definitions
    }

    definitions_by_value: dict[
        str,
        list[str],
    ] = defaultdict(list)

    for definition in definitions:
        definitions_by_value[
            definition.value
        ].append(definition.name)

    duplicates = {
        value: sorted(names)
        for value, names
        in definitions_by_value.items()
        if len(names) > 1
    }

    undefined_references = [
        reference
        for reference in references
        if reference.name
        not in definitions_by_name
    ]

    referenced_names = {
        reference.name
        for reference in references
    }

    unused_definitions = sorted(
        (
            definition
            for definition in definitions
            if definition.name
            not in referenced_names
        ),
        key=lambda item: item.name,
    )

    controller_files = discover_controller_files(
        resolved_controller_roots
    )

    endpoints: list[
        EndpointAuthorization
    ] = []

    for controller_file in controller_files:
        endpoints.extend(
            scan_controller(
                controller_file,
                repository_root,
            )
        )

    endpoints.sort(
        key=lambda item: (
            item.path,
            item.line,
            item.http_method,
        )
    )

    violations: list[
        AuthorizationViolation
    ] = []

    for value, names in sorted(
        duplicates.items()
    ):
        violations.append(
            AuthorizationViolation(
                code="DUPLICATE_PERMISSION_VALUE",
                path=_relative(
                    permission_registry,
                    repository_root,
                ),
                line=None,
                message=(
                    f"Permission value {value!r} "
                    "is assigned to "
                    + ", ".join(names)
                ),
            )
        )

    for reference in undefined_references:
        violations.append(
            AuthorizationViolation(
                code="UNDEFINED_PERMISSION_REFERENCE",
                path=reference.path,
                line=reference.line,
                message=(
                    f"Permissions.{reference.name} "
                    "is not defined in the registry"
                ),
            )
        )

    for endpoint in endpoints:
        if endpoint.is_public:
            if endpoint.permission is not None:
                violations.append(
                    AuthorizationViolation(
                        code="PUBLIC_ROUTE_HAS_PERMISSION",
                        path=endpoint.path,
                        line=endpoint.line,
                        message=(
                            f"{endpoint.controller}."
                            f"{endpoint.method} is public "
                            "but also declares "
                            f"Permissions.{endpoint.permission}"
                        ),
                    )
                )

            continue

        if endpoint.permission is None:
            continue

        if (
            endpoint.permission
            not in definitions_by_name
        ):
            violations.append(
                AuthorizationViolation(
                    code="ENDPOINT_PERMISSION_UNDEFINED",
                    path=endpoint.path,
                    line=endpoint.line,
                    message=(
                        f"{endpoint.controller}."
                        f"{endpoint.method} references "
                        "undefined permission "
                        f"Permissions.{endpoint.permission}"
                    ),
                )
            )

        if not endpoint.has_jwt_guard:
            violations.append(
                AuthorizationViolation(
                    code="JWT_GUARD_MISSING",
                    path=endpoint.path,
                    line=endpoint.line,
                    message=(
                        f"{endpoint.controller}."
                        f"{endpoint.method} declares a "
                        "permission without JwtAuthGuard"
                    ),
                )
            )

        if not endpoint.has_permission_guard:
            violations.append(
                AuthorizationViolation(
                    code="PERMISSION_GUARD_MISSING",
                    path=endpoint.path,
                    line=endpoint.line,
                    message=(
                        f"{endpoint.controller}."
                        f"{endpoint.method} declares a "
                        "permission without PermissionGuard"
                    ),
                )
            )

        if not endpoint.has_bearer_auth:
            violations.append(
                AuthorizationViolation(
                    code="BEARER_AUTH_MISSING",
                    path=endpoint.path,
                    line=endpoint.line,
                    message=(
                        f"{endpoint.controller}."
                        f"{endpoint.method} declares a "
                        "permission without @ApiBearerAuth"
                    ),
                )
            )

    public_count = sum(
        endpoint.classification == "public"
        for endpoint in endpoints
    )

    authenticated_count = sum(
        endpoint.classification == "authenticated"
        for endpoint in endpoints
    )

    permission_count = sum(
        endpoint.classification
        == "permission-protected"
        for endpoint in endpoints
    )

    non_public_count = (
        len(endpoints)
        - public_count
    )

    coverage = (
        round(
            (
                permission_count
                / non_public_count
            )
            * 100,
            2,
        )
        if non_public_count
        else 100.0
    )

    violations.sort(
        key=lambda item: (
            item.code,
            item.path,
            item.line or 0,
        )
    )

    return AuthorizationReport(
        schema_version=1,
        status=(
            "PASS"
            if not violations
            else "FAIL"
        ),
        repository_root=".",
        permission_registry=_relative(
            permission_registry,
            repository_root,
        ),
        controller_roots=[
            _relative(
                root,
                repository_root,
            )
            for root
            in resolved_controller_roots
        ],
        controller_count=len(
            controller_files
        ),
        endpoint_count=len(
            endpoints
        ),
        public_endpoint_count=(
            public_count
        ),
        authenticated_endpoint_count=(
            authenticated_count
        ),
        permission_protected_endpoint_count=(
            permission_count
        ),
        permission_coverage_percent=(
            coverage
        ),
        permission_definition_count=len(
            definitions
        ),
        permission_reference_count=len(
            references
        ),
        duplicate_permission_values=(
            duplicates
        ),
        undefined_permission_references=(
            undefined_references
        ),
        unused_permission_definitions=(
            unused_definitions
        ),
        violations=violations,
        endpoints=endpoints,
    )
