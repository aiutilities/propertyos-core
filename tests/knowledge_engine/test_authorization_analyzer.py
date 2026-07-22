from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.authorization_analyzer import (
    analyze_authorization,
    parse_permission_definitions,
    scan_controller,
)


class AuthorizationAnalyzerTest(unittest.TestCase):
    def test_parses_permission_definitions(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            registry = root / "permissions.ts"

            registry.write_text(
                """
export const Permissions = {
  USER_READ: "user.read",
  USER_WRITE: "user.write",
} as const;
""",
                encoding="utf-8",
            )

            definitions = parse_permission_definitions(
                registry
            )

            self.assertEqual(
                [
                    ("USER_READ", "user.read"),
                    ("USER_WRITE", "user.write"),
                ],
                [
                    (
                        definition.name,
                        definition.value,
                    )
                    for definition in definitions
                ],
            )

    def test_classifies_public_endpoint(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            controller = root / "health.controller.ts"

            controller.write_text(
                """
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return {};
  }
}
""",
                encoding="utf-8",
            )

            endpoints = scan_controller(
                controller,
                root,
            )

            self.assertEqual(1, len(endpoints))
            self.assertEqual(
                "public",
                endpoints[0].classification,
            )
            self.assertTrue(
                endpoints[0].is_public
            )

    def test_classifies_permission_protected_endpoint(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            controller = root / "users.controller.ts"

            controller.write_text(
                """
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("users")
export class UsersController {
  @RequirePermission(Permissions.USER_READ)
  @Get()
  listUsers() {
    return [];
  }
}
""",
                encoding="utf-8",
            )

            endpoints = scan_controller(
                controller,
                root,
            )

            self.assertEqual(1, len(endpoints))

            endpoint = endpoints[0]

            self.assertEqual(
                "permission-protected",
                endpoint.classification,
            )
            self.assertEqual(
                "USER_READ",
                endpoint.permission,
            )
            self.assertTrue(
                endpoint.has_jwt_guard
            )
            self.assertTrue(
                endpoint.has_permission_guard
            )
            self.assertTrue(
                endpoint.has_bearer_auth
            )


    def test_reports_missing_authorization_controls(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)

            registry = root / "permissions.ts"
            registry.write_text(
                """
export const Permissions = {
  USER_READ: "user.read",
} as const;
""",
                encoding="utf-8",
            )

            source_root = root / "src"
            source_root.mkdir()

            controller = (
                source_root
                / "users.controller.ts"
            )

            controller.write_text(
                """
@Controller("users")
export class UsersController {
  @RequirePermission(Permissions.USER_READ)
  @Get()
  listUsers() {
    return [];
  }
}
""",
                encoding="utf-8",
            )

            report = analyze_authorization(
                repository_root=root,
                permission_registry=registry,
                controller_roots=[source_root],
                source_root=source_root,
            )

            codes = {
                violation.code
                for violation in report.violations
            }

            self.assertIn(
                "JWT_GUARD_MISSING",
                codes,
            )
            self.assertIn(
                "PERMISSION_GUARD_MISSING",
                codes,
            )
            self.assertIn(
                "BEARER_AUTH_MISSING",
                codes,
            )
            self.assertEqual(
                "FAIL",
                report.status,
            )

    def test_reports_public_route_with_permission(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)

            registry = root / "permissions.ts"
            registry.write_text(
                """
export const Permissions = {
  USER_READ: "user.read",
} as const;
""",
                encoding="utf-8",
            )

            source_root = root / "src"
            source_root.mkdir()

            controller = (
                source_root
                / "users.controller.ts"
            )

            controller.write_text(
                """
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("users")
export class UsersController {
  @Public()
  @RequirePermission(Permissions.USER_READ)
  @Get()
  listUsers() {
    return [];
  }
}
""",
                encoding="utf-8",
            )

            report = analyze_authorization(
                repository_root=root,
                permission_registry=registry,
                controller_roots=[source_root],
                source_root=source_root,
            )

            self.assertIn(
                "PUBLIC_ROUTE_HAS_PERMISSION",
                {
                    violation.code
                    for violation
                    in report.violations
                },
            )

    def test_reports_duplicate_permission_values(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)

            registry = root / "permissions.ts"
            registry.write_text(
                """
export const Permissions = {
  USER_READ: "user.read",
  USER_VIEW: "user.read",
} as const;
""",
                encoding="utf-8",
            )

            source_root = root / "src"
            source_root.mkdir()

            report = analyze_authorization(
                repository_root=root,
                permission_registry=registry,
                controller_roots=[source_root],
                source_root=source_root,
            )

            self.assertEqual(
                {
                    "user.read": [
                        "USER_READ",
                        "USER_VIEW",
                    ]
                },
                report.duplicate_permission_values,
            )

            self.assertIn(
                "DUPLICATE_PERMISSION_VALUE",
                {
                    violation.code
                    for violation
                    in report.violations
                },
            )

    def test_reports_undefined_permission_reference(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)

            registry = root / "permissions.ts"
            registry.write_text(
                """
export const Permissions = {
  USER_READ: "user.read",
} as const;
""",
                encoding="utf-8",
            )

            source_root = root / "src"
            source_root.mkdir()

            controller = (
                source_root
                / "users.controller.ts"
            )

            controller.write_text(
                """
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("users")
export class UsersController {
  @RequirePermission(Permissions.USER_DELETE)
  @Delete()
  deleteUser() {
    return {};
  }
}
""",
                encoding="utf-8",
            )

            report = analyze_authorization(
                repository_root=root,
                permission_registry=registry,
                controller_roots=[source_root],
                source_root=source_root,
            )

            codes = [
                violation.code
                for violation in report.violations
            ]

            self.assertIn(
                "UNDEFINED_PERMISSION_REFERENCE",
                codes,
            )
            self.assertIn(
                "ENDPOINT_PERMISSION_UNDEFINED",
                codes,
            )

    def test_unused_permissions_are_non_blocking(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)

            registry = root / "permissions.ts"
            registry.write_text(
                """
export const Permissions = {
  USER_READ: "user.read",
} as const;
""",
                encoding="utf-8",
            )

            source_root = root / "src"
            source_root.mkdir()

            report = analyze_authorization(
                repository_root=root,
                permission_registry=registry,
                controller_roots=[source_root],
                source_root=source_root,
            )

            self.assertEqual(
                "PASS",
                report.status,
            )
            self.assertEqual(
                ["USER_READ"],
                [
                    definition.name
                    for definition
                    in report.unused_permission_definitions
                ],
            )


    def test_report_output_is_deterministic(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)

            registry = root / "permissions.ts"
            registry.write_text(
                """
export const Permissions = {
  USER_READ: "user.read",
} as const;
""",
                encoding="utf-8",
            )

            source_root = root / "src"
            source_root.mkdir()

            controller = (
                source_root
                / "users.controller.ts"
            )

            controller.write_text(
                """
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller("users")
export class UsersController {
  @RequirePermission(Permissions.USER_READ)
  @Get()
  listUsers() {
    return [];
  }
}
""",
                encoding="utf-8",
            )

            first = analyze_authorization(
                repository_root=root,
                permission_registry=registry,
                controller_roots=[source_root],
                source_root=source_root,
            )

            second = analyze_authorization(
                repository_root=root,
                permission_registry=registry,
                controller_roots=[source_root],
                source_root=source_root,
            )

            self.assertEqual(
                first.to_dict(),
                second.to_dict(),
            )


if __name__ == "__main__":
    unittest.main()
