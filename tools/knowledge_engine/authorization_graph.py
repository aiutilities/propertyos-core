from __future__ import annotations

from collections import defaultdict
from pathlib import Path, PurePosixPath

from .authorization_graph_models import (
    AuthorizationEndpointReference,
    AuthorizationGraph,
    ControllerPermissionMapping,
    ModuleAuthorizationSummary,
    PermissionEndpointMapping,
)
from .authorization_models import AuthorizationReport


def _module_name(path: str) -> str:
    parts = PurePosixPath(path).parts

    for root in ("core", "plugins"):
        if root not in parts:
            continue

        index = parts.index(root)

        if index + 1 < len(parts):
            return parts[index + 1]

    return "unknown"


def build_authorization_graph(
    report: AuthorizationReport,
) -> AuthorizationGraph:
    permission_definitions = {
        definition.name: definition.value
        for definition in _permission_definitions(report)
    }

    permission_endpoints: dict[
        str,
        list[AuthorizationEndpointReference],
    ] = defaultdict(list)

    controller_endpoints: dict[
        tuple[str, str],
        list,
    ] = defaultdict(list)

    module_controllers: dict[
        str,
        set[tuple[str, str]],
    ] = defaultdict(set)

    module_endpoints: dict[
        str,
        list,
    ] = defaultdict(list)

    for endpoint in report.endpoints:
        controller_key = (
            endpoint.controller,
            endpoint.path,
        )
        controller_endpoints[controller_key].append(endpoint)

        module = _module_name(endpoint.path)
        module_controllers[module].add(controller_key)
        module_endpoints[module].append(endpoint)

        if endpoint.permission is None:
            continue

        permission_endpoints[endpoint.permission].append(
            AuthorizationEndpointReference(
                path=endpoint.path,
                controller=endpoint.controller,
                method=endpoint.method,
                http_method=endpoint.http_method,
                route=endpoint.route,
                line=endpoint.line,
            )
        )

    permission_to_endpoints = []

    for permission_name in sorted(permission_definitions):
        endpoints = sorted(
            permission_endpoints.get(permission_name, []),
            key=lambda endpoint: (
                endpoint.path,
                endpoint.line,
                endpoint.http_method,
                endpoint.route,
                endpoint.method,
            ),
        )

        permission_to_endpoints.append(
            PermissionEndpointMapping(
                permission_name=permission_name,
                permission_value=permission_definitions[
                    permission_name
                ],
                endpoints=endpoints,
            )
        )

    controller_to_permissions = []

    for controller_key in sorted(
        controller_endpoints,
        key=lambda item: (item[1], item[0]),
    ):
        controller, path = controller_key
        endpoints = controller_endpoints[controller_key]

        permissions = sorted(
            {
                endpoint.permission
                for endpoint in endpoints
                if endpoint.permission is not None
            }
        )

        controller_to_permissions.append(
            ControllerPermissionMapping(
                controller=controller,
                path=path,
                permissions=permissions,
                endpoint_count=len(endpoints),
                permission_protected_endpoint_count=sum(
                    1
                    for endpoint in endpoints
                    if endpoint.permission is not None
                ),
            )
        )

    module_summaries = []

    for module in sorted(module_endpoints):
        endpoints = module_endpoints[module]

        module_summaries.append(
            ModuleAuthorizationSummary(
                module=module,
                controller_count=len(
                    module_controllers[module]
                ),
                endpoint_count=len(endpoints),
                permission_protected_endpoint_count=sum(
                    1
                    for endpoint in endpoints
                    if endpoint.permission is not None
                ),
                permissions=sorted(
                    {
                        endpoint.permission
                        for endpoint in endpoints
                        if endpoint.permission is not None
                    }
                ),
            )
        )

    permissions_without_endpoints = sorted(
        permission_name
        for permission_name in permission_definitions
        if not permission_endpoints.get(permission_name)
    )

    return AuthorizationGraph(
        schema_version=1,
        permission_to_endpoints=permission_to_endpoints,
        controller_to_permissions=controller_to_permissions,
        module_summaries=module_summaries,
        permissions_without_endpoints=permissions_without_endpoints,
    )


def _permission_definitions(report: AuthorizationReport):
    from .authorization_analyzer import parse_permission_definitions

    repository_root = Path(report.repository_root)

    if not repository_root.is_absolute():
        repository_root = repository_root.resolve()

    definitions = parse_permission_definitions(
        repository_root / report.permission_registry
    )

    return sorted(
        definitions,
        key=lambda definition: definition.name,
    )
