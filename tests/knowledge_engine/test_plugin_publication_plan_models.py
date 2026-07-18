from __future__ import annotations

import unittest
from pathlib import PurePosixPath

from tools.knowledge_engine.plugin_publication_plan_models import (
    PluginPublicationPlan,
    PublicationBlocker,
    PublicationBlockerCode,
    PublicationBlockerSeverity,
    PublicationDependency,
    PublicationPackage,
    PublicationPackageKind,
    PublicationPackageStatus,
    PublicationPlanError,
    PublicationRegistry,
)


def ready_package(
    name: str = "@propertyos/plugin-helpdesk",
    order: int = 1,
) -> PublicationPackage:
    return PublicationPackage(
        package_name=name,
        version="0.1.0",
        kind=PublicationPackageKind.PLUGIN,
        order=order,
        artifact_path=PurePosixPath(
            "generated/plugin-artifacts/"
            "package.tgz"
        ),
        sha256="a" * 64,
        integrity="sha512-example",
        marketplace_id="helpdesk",
    )


class PublicationDependencyTest(
    unittest.TestCase
):
    def test_serializes_dependency(
        self,
    ) -> None:
        dependency = PublicationDependency(
            package_name=(
                "@propertyos/core-contracts"
            ),
            version="0.1.0",
        )

        self.assertEqual(
            {
                "packageName": (
                    "@propertyos/core-contracts"
                ),
                "version": "0.1.0",
            },
            dependency.to_dict(),
        )

    def test_rejects_empty_dependency_version(
        self,
    ) -> None:
        with self.assertRaises(
            PublicationPlanError
        ):
            PublicationDependency(
                package_name=(
                    "@propertyos/core-contracts"
                ),
                version="",
            )


class PublicationBlockerTest(
    unittest.TestCase
):
    def test_serializes_blocker(
        self,
    ) -> None:
        blocker = PublicationBlocker(
            code=(
                PublicationBlockerCode
                .PRIVATE_PACKAGE
            ),
            message="Package is private.",
        )

        self.assertEqual(
            "private-package",
            blocker.to_dict()["code"],
        )

    def test_rejects_empty_message(
        self,
    ) -> None:
        with self.assertRaises(
            PublicationPlanError
        ):
            PublicationBlocker(
                code=(
                    PublicationBlockerCode
                    .MISSING_ARTIFACT
                ),
                message="",
            )


class PublicationPackageTest(
    unittest.TestCase
):
    def test_complete_package_is_ready(
        self,
    ) -> None:
        package = ready_package()

        self.assertEqual(
            PublicationPackageStatus.READY,
            package.status,
        )

    def test_private_package_is_blocked(
        self,
    ) -> None:
        package = PublicationPackage(
            package_name=(
                "@propertyos/plugin-helpdesk"
            ),
            version="0.1.0",
            kind=(
                PublicationPackageKind.PLUGIN
            ),
            order=1,
            private=True,
            blockers=(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .PRIVATE_PACKAGE
                    ),
                    message=(
                        "Package is marked private."
                    ),
                ),
            ),
        )

        self.assertEqual(
            PublicationPackageStatus.BLOCKED,
            package.status,
        )

    def test_non_publishable_contract_is_blocked(
        self,
    ) -> None:
        package = PublicationPackage(
            package_name=(
                "@propertyos/core-contracts"
            ),
            version="0.1.0",
            kind=(
                PublicationPackageKind
                .CORE_CONTRACT
            ),
            order=0,
            publishable=False,
            blockers=(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .REPOSITORY_BACKED_SOURCE
                    ),
                    message=(
                        "Contract package re-exports "
                        "repository sources."
                    ),
                ),
            ),
        )

        self.assertEqual(
            PublicationPackageStatus.BLOCKED,
            package.status,
        )

    def test_error_blocker_blocks_package(
        self,
    ) -> None:
        package = PublicationPackage(
            package_name=(
                "@propertyos/plugin-helpdesk"
            ),
            version="0.1.0",
            kind=(
                PublicationPackageKind.PLUGIN
            ),
            order=1,
            blockers=(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .MISSING_ARTIFACT
                    ),
                    message="Artifact is missing.",
                ),
            ),
        )

        self.assertEqual(
            PublicationPackageStatus.BLOCKED,
            package.status,
        )

    def test_warning_does_not_block_complete_package(
        self,
    ) -> None:
        package = PublicationPackage(
            package_name=(
                "@propertyos/plugin-helpdesk"
            ),
            version="0.1.0",
            kind=(
                PublicationPackageKind.PLUGIN
            ),
            order=1,
            artifact_path=PurePosixPath(
                "artifact.tgz"
            ),
            sha256="a" * 64,
            integrity="sha512-example",
            blockers=(
                PublicationBlocker(
                    code=(
                        PublicationBlockerCode
                        .PRIVATE_PACKAGE
                    ),
                    severity=(
                        PublicationBlockerSeverity
                        .WARNING
                    ),
                    message="Warning only.",
                ),
            ),
        )

        self.assertEqual(
            PublicationPackageStatus.READY,
            package.status,
        )

    def test_ready_package_requires_artifact(
        self,
    ) -> None:
        with self.assertRaises(
            PublicationPlanError
        ):
            PublicationPackage(
                package_name=(
                    "@propertyos/plugin-helpdesk"
                ),
                version="0.1.0",
                kind=(
                    PublicationPackageKind.PLUGIN
                ),
                order=1,
            )


class PublicationRegistryTest(
    unittest.TestCase
):
    def test_rejects_invalid_access(
        self,
    ) -> None:
        with self.assertRaises(
            PublicationPlanError
        ):
            PublicationRegistry(
                url=(
                    "https://registry.npmjs.org/"
                ),
                authenticated=False,
                access="invalid",
            )


class PluginPublicationPlanTest(
    unittest.TestCase
):
    def test_authenticated_ready_plan_can_publish(
        self,
    ) -> None:
        plan = PluginPublicationPlan(
            schema_version="1.0.0",
            registry=PublicationRegistry(
                url=(
                    "https://registry.npmjs.org/"
                ),
                authenticated=True,
            ),
            packages=(
                ready_package(),
            ),
        )

        self.assertTrue(
            plan.ready_to_publish
        )
        self.assertEqual(
            1,
            plan.ready_count,
        )

    def test_unauthenticated_plan_is_blocked(
        self,
    ) -> None:
        plan = PluginPublicationPlan(
            schema_version="1.0.0",
            registry=PublicationRegistry(
                url=(
                    "https://registry.npmjs.org/"
                ),
                authenticated=False,
            ),
            packages=(
                ready_package(),
            ),
        )

        value = plan.to_dict()

        self.assertFalse(
            plan.ready_to_publish
        )
        self.assertEqual(
            1,
            value["summary"][
                "blockerCount"
            ],
        )
        self.assertEqual(
            (
                "registry-authentication-"
                "required"
            ),
            value["registryBlockers"][0][
                "code"
            ],
        )

    def test_rejects_duplicate_package_names(
        self,
    ) -> None:
        with self.assertRaises(
            PublicationPlanError
        ):
            PluginPublicationPlan(
                schema_version="1.0.0",
                registry=PublicationRegistry(
                    url="registry",
                    authenticated=True,
                ),
                packages=(
                    ready_package(order=1),
                    ready_package(order=2),
                ),
            )

    def test_rejects_unsorted_publication_order(
        self,
    ) -> None:
        with self.assertRaises(
            PublicationPlanError
        ):
            PluginPublicationPlan(
                schema_version="1.0.0",
                registry=PublicationRegistry(
                    url="registry",
                    authenticated=True,
                ),
                packages=(
                    ready_package(
                        "@propertyos/plugin-inventory",
                        order=2,
                    ),
                    ready_package(
                        "@propertyos/plugin-helpdesk",
                        order=1,
                    ),
                ),
            )


if __name__ == "__main__":
    unittest.main()
