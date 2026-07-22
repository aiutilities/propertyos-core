from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.authorization_graph import (
    _module_name,
    build_authorization_graph,
)
from tools.knowledge_engine.authorization_models import (
    AuthorizationReport,
    EndpointAuthorization,
    PermissionDefinition,
)


class AuthorizationGraphTest(unittest.TestCase):
    def test_extracts_core_module_name(self) -> None:
        self.assertEqual(
            _module_name(
                "backend/src/core/"
                "identity/controllers/"
                "identity.controller.ts"
            ),
            "identity",
        )

    def test_extracts_plugin_module_name(self) -> None:
        self.assertEqual(
            _module_name(
                "backend/src/plugins/"
                "maintenance/controllers/"
                "maintenance.controller.ts"
            ),
            "maintenance",
        )

    def test_returns_unknown_for_unrecognized_path(self) -> None:
        self.assertEqual(
            _module_name(
                "backend/src/controllers/"
                "health.controller.ts"
            ),
            "unknown",
        )

    def test_builds_deterministic_authorization_graph(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repository_root = Path(directory)

            registry = (
                repository_root
                / "backend/src/core/auth/constants/"
                "permissions.ts"
            )
            registry.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            registry.write_text(
                """export const Permissions = {
  PERSON_READ: "person.read",
  PERSON_CREATE: "person.create",
  UNUSED_READ: "unused.read",
} as const;
""",
                encoding="utf-8",
            )

            report = AuthorizationReport(
                schema_version=1,
                status="PASS",
                repository_root=str(
                    repository_root
                ),
                permission_registry=(
                    "backend/src/core/auth/constants/"
                    "permissions.ts"
                ),
                controller_roots=[
                    "backend/src/core",
                    "backend/src/plugins",
                ],
                controller_count=2,
                endpoint_count=4,
                public_endpoint_count=1,
                authenticated_endpoint_count=1,
                permission_protected_endpoint_count=2,
                permission_coverage_percent=50.0,
                permission_definition_count=3,
                permission_reference_count=2,
                unused_permission_definitions=[
                    PermissionDefinition(
                        name="UNUSED_READ",
                        value="unused.read",
                    )
                ],
                endpoints=[
                    EndpointAuthorization(
                        path=(
                            "backend/src/core/identity/"
                            "controllers/"
                            "identity.controller.ts"
                        ),
                        controller="IdentityController",
                        method="listPersons",
                        http_method="GET",
                        route='"persons"',
                        line=40,
                        classification=(
                            "permission-protected"
                        ),
                        permission="PERSON_READ",
                        has_jwt_guard=True,
                        has_permission_guard=True,
                        has_bearer_auth=True,
                        is_public=False,
                    ),
                    EndpointAuthorization(
                        path=(
                            "backend/src/core/identity/"
                            "controllers/"
                            "identity.controller.ts"
                        ),
                        controller="IdentityController",
                        method="createPerson",
                        http_method="POST",
                        route='"persons"',
                        line=60,
                        classification=(
                            "permission-protected"
                        ),
                        permission="PERSON_CREATE",
                        has_jwt_guard=True,
                        has_permission_guard=True,
                        has_bearer_auth=True,
                        is_public=False,
                    ),
                    EndpointAuthorization(
                        path=(
                            "backend/src/plugins/"
                            "maintenance/controllers/"
                            "maintenance.controller.ts"
                        ),
                        controller=(
                            "MaintenanceController"
                        ),
                        method="listRequests",
                        http_method="GET",
                        route='"requests"',
                        line=20,
                        classification="authenticated",
                        permission=None,
                        has_jwt_guard=True,
                        has_permission_guard=False,
                        has_bearer_auth=True,
                        is_public=False,
                    ),
                    EndpointAuthorization(
                        path=(
                            "backend/src/plugins/"
                            "maintenance/controllers/"
                            "maintenance.controller.ts"
                        ),
                        controller=(
                            "MaintenanceController"
                        ),
                        method="health",
                        http_method="GET",
                        route='"health"',
                        line=10,
                        classification="public",
                        permission=None,
                        has_jwt_guard=False,
                        has_permission_guard=False,
                        has_bearer_auth=False,
                        is_public=True,
                    ),
                ],
            )

            first = build_authorization_graph(report)
            second = build_authorization_graph(report)

            self.assertEqual(
                first.to_dict(),
                second.to_dict(),
            )

            self.assertEqual(
                len(first.permission_to_endpoints),
                3,
            )

            self.assertEqual(
                [
                    mapping.permission_name
                    for mapping
                    in first.permission_to_endpoints
                ],
                [
                    "PERSON_CREATE",
                    "PERSON_READ",
                    "UNUSED_READ",
                ],
            )

            person_create = next(
                mapping
                for mapping
                in first.permission_to_endpoints
                if mapping.permission_name
                == "PERSON_CREATE"
            )

            self.assertEqual(
                person_create.permission_value,
                "person.create",
            )
            self.assertEqual(
                len(person_create.endpoints),
                1,
            )
            self.assertEqual(
                person_create.endpoints[0].method,
                "createPerson",
            )

            self.assertEqual(
                first.permissions_without_endpoints,
                ["UNUSED_READ"],
            )

            self.assertEqual(
                len(first.controller_to_permissions),
                2,
            )

            identity_controller = next(
                mapping
                for mapping
                in first.controller_to_permissions
                if mapping.controller
                == "IdentityController"
            )

            self.assertEqual(
                identity_controller.permissions,
                [
                    "PERSON_CREATE",
                    "PERSON_READ",
                ],
            )
            self.assertEqual(
                identity_controller.endpoint_count,
                2,
            )
            self.assertEqual(
                identity_controller
                .permission_protected_endpoint_count,
                2,
            )

            maintenance_controller = next(
                mapping
                for mapping
                in first.controller_to_permissions
                if mapping.controller
                == "MaintenanceController"
            )

            self.assertEqual(
                maintenance_controller.permissions,
                [],
            )
            self.assertEqual(
                maintenance_controller.endpoint_count,
                2,
            )
            self.assertEqual(
                maintenance_controller
                .permission_protected_endpoint_count,
                0,
            )

            self.assertEqual(
                [
                    summary.module
                    for summary
                    in first.module_summaries
                ],
                [
                    "identity",
                    "maintenance",
                ],
            )

            identity_summary = next(
                summary
                for summary
                in first.module_summaries
                if summary.module == "identity"
            )

            self.assertEqual(
                identity_summary.controller_count,
                1,
            )
            self.assertEqual(
                identity_summary.endpoint_count,
                2,
            )
            self.assertEqual(
                identity_summary
                .permission_protected_endpoint_count,
                2,
            )
            self.assertEqual(
                identity_summary.permissions,
                [
                    "PERSON_CREATE",
                    "PERSON_READ",
                ],
            )

    def test_sorts_endpoint_references(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repository_root = Path(directory)

            registry = (
                repository_root
                / "backend/src/core/auth/constants/"
                "permissions.ts"
            )
            registry.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            registry.write_text(
                """export const Permissions = {
  PERSON_READ: "person.read",
} as const;
""",
                encoding="utf-8",
            )

            report = AuthorizationReport(
                schema_version=1,
                status="PASS",
                repository_root=str(
                    repository_root
                ),
                permission_registry=(
                    "backend/src/core/auth/constants/"
                    "permissions.ts"
                ),
                controller_roots=[
                    "backend/src/core",
                ],
                controller_count=1,
                endpoint_count=2,
                public_endpoint_count=0,
                authenticated_endpoint_count=0,
                permission_protected_endpoint_count=2,
                permission_coverage_percent=100.0,
                permission_definition_count=1,
                permission_reference_count=2,
                endpoints=[
                    EndpointAuthorization(
                        path=(
                            "backend/src/core/identity/"
                            "controllers/"
                            "identity.controller.ts"
                        ),
                        controller="IdentityController",
                        method="second",
                        http_method="GET",
                        route='"second"',
                        line=80,
                        classification=(
                            "permission-protected"
                        ),
                        permission="PERSON_READ",
                        has_jwt_guard=True,
                        has_permission_guard=True,
                        has_bearer_auth=True,
                        is_public=False,
                    ),
                    EndpointAuthorization(
                        path=(
                            "backend/src/core/identity/"
                            "controllers/"
                            "identity.controller.ts"
                        ),
                        controller="IdentityController",
                        method="first",
                        http_method="GET",
                        route='"first"',
                        line=20,
                        classification=(
                            "permission-protected"
                        ),
                        permission="PERSON_READ",
                        has_jwt_guard=True,
                        has_permission_guard=True,
                        has_bearer_auth=True,
                        is_public=False,
                    ),
                ],
            )

            graph = build_authorization_graph(report)

            mapping = graph.permission_to_endpoints[0]

            self.assertEqual(
                [
                    endpoint.method
                    for endpoint in mapping.endpoints
                ],
                [
                    "first",
                    "second",
                ],
            )


if __name__ == "__main__":
    unittest.main()
