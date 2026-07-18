from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from tools.knowledge_engine.plugin_publication_plan_models import (
    PublicationBlockerCode,
    PublicationPackageStatus,
)
from tools.knowledge_engine.plugin_publication_planner import (
    PluginPublicationPlanner,
)


class PluginPublicationPlannerTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.temporary = (
            tempfile.TemporaryDirectory()
        )
        self.root = Path(
            self.temporary.name
        )

        self.contract_root = (
            self.root
            / "generated/contracts/core-contracts"
        )
        self.contract_root.mkdir(
            parents=True
        )
        (
            self.contract_root
            / "package.json"
        ).write_text(
            json.dumps(
                {
                    "name": (
                        "@propertyos/core-contracts"
                    ),
                    "version": "0.1.0",
                    "private": True,
                    "propertyos": {
                        "publishable": False,
                        "sourceStrategy": (
                            "repository-reexport"
                        ),
                    },
                }
            ),
            encoding="utf-8",
        )

        self.artifact_root = (
            self.root
            / "generated/plugin-artifacts"
        )
        self.artifact_root.mkdir(
            parents=True
        )

        self.metadata = {
            "helpdesk.tgz": {
                "name": (
                    "@propertyos/plugin-helpdesk"
                ),
                "version": "0.1.0",
                "private": True,
                "dependencies": {
                    "@propertyos/core-contracts": (
                        "0.1.0"
                    ),
                },
            },
            "inventory.tgz": {
                "name": (
                    "@propertyos/plugin-inventory"
                ),
                "version": "0.1.0",
                "private": True,
                "dependencies": {
                    "@propertyos/core-contracts": (
                        "0.1.0"
                    ),
                },
            },
            "procurement.tgz": {
                "name": (
                    "@propertyos/plugin-procurement"
                ),
                "version": "0.1.0",
                "private": True,
                "dependencies": {
                    "@propertyos/core-contracts": (
                        "0.1.0"
                    ),
                    "@propertyos/plugin-inventory": (
                        "0.1.0"
                    ),
                },
            },
        }

        for filename in self.metadata:
            (
                self.artifact_root
                / filename
            ).write_bytes(b"artifact")

        self.portfolio_path = (
            self.root
            / "generated/knowledge/portfolio.json"
        )
        self.portfolio_path.parent.mkdir(
            parents=True
        )
        self._write_portfolio(
            (
                "helpdesk",
                "inventory",
                "procurement",
            )
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _write_portfolio(
        self,
        module_ids,
    ) -> None:
        artifacts = []

        for module_id in module_ids:
            artifacts.append(
                {
                    "moduleId": module_id,
                    "pluginId": module_id,
                    "packageName": (
                        "@propertyos/plugin-"
                        + module_id
                    ),
                    "version": "0.1.0",
                    "artifactPath": (
                        "generated/plugin-artifacts/"
                        + module_id
                        + ".tgz"
                    ),
                    "sha256": "a" * 64,
                    "integrity": (
                        "sha512-example"
                    ),
                }
            )

        self.portfolio_path.write_text(
            json.dumps(
                {
                    "artifacts": artifacts
                }
            ),
            encoding="utf-8",
        )

    def _planner(
        self,
        authenticated=False,
    ) -> PluginPublicationPlanner:
        return PluginPublicationPlanner(
            repository_root=self.root,
            package_portfolio_path=(
                self.portfolio_path
            ),
            core_contract_root=(
                self.contract_root
            ),
            registry_url=(
                "https://registry.npmjs.org/"
            ),
            authenticated=authenticated,
            artifact_metadata_loader=(
                lambda path: self.metadata[
                    path.name
                ]
            ),
        )

    def test_plans_core_contract_first(
        self,
    ) -> None:
        plan = self._planner().plan()

        self.assertEqual(
            "@propertyos/core-contracts",
            plan.packages[0].package_name,
        )

    def test_orders_inventory_before_procurement(
        self,
    ) -> None:
        plan = self._planner().plan()

        names = tuple(
            package.package_name
            for package in plan.packages
        )

        self.assertLess(
            names.index(
                "@propertyos/plugin-inventory"
            ),
            names.index(
                "@propertyos/plugin-procurement"
            ),
        )

    def test_core_contract_reports_all_blockers(
        self,
    ) -> None:
        package = (
            self._planner().plan()
            .packages[0]
        )

        codes = {
            blocker.code
            for blocker in package.blockers
        }

        self.assertIn(
            PublicationBlockerCode.PRIVATE_PACKAGE,
            codes,
        )
        self.assertIn(
            (
                PublicationBlockerCode
                .NON_PUBLISHABLE_PACKAGE
            ),
            codes,
        )
        self.assertIn(
            (
                PublicationBlockerCode
                .REPOSITORY_BACKED_SOURCE
            ),
            codes,
        )
        self.assertIn(
            (
                PublicationBlockerCode
                .MISSING_ARTIFACT
            ),
            codes,
        )

    def test_plugins_report_private_blocker(
        self,
    ) -> None:
        plan = self._planner().plan()

        helpdesk = next(
            package
            for package in plan.packages
            if package.marketplace_id
            == "helpdesk"
        )

        self.assertEqual(
            PublicationPackageStatus.BLOCKED,
            helpdesk.status,
        )
        self.assertIn(
            PublicationBlockerCode.PRIVATE_PACKAGE,
            {
                blocker.code
                for blocker
                in helpdesk.blockers
            },
        )

    def test_dependency_blockers_are_propagated(
        self,
    ) -> None:
        plan = self._planner().plan()

        procurement = next(
            package
            for package in plan.packages
            if package.marketplace_id
            == "procurement"
        )

        blocked_dependencies = {
            blocker.dependency
            for blocker
            in procurement.blockers
            if blocker.code
            == (
                PublicationBlockerCode
                .DEPENDENCY_BLOCKED
            )
        }

        self.assertEqual(
            {
                "@propertyos/core-contracts",
                "@propertyos/plugin-inventory",
            },
            blocked_dependencies,
        )

    def test_registry_authentication_alone_is_insufficient(
        self,
    ) -> None:
        plan = self._planner(
            authenticated=True
        ).plan()

        self.assertFalse(
            plan.ready_to_publish
        )
        self.assertGreater(
            plan.blocked_count,
            0,
        )

    def test_missing_artifact_is_blocked(
        self,
    ) -> None:
        (
            self.artifact_root
            / "helpdesk.tgz"
        ).unlink()

        plan = self._planner().plan()

        helpdesk = next(
            package
            for package in plan.packages
            if package.marketplace_id
            == "helpdesk"
        )

        self.assertIn(
            (
                PublicationBlockerCode
                .MISSING_ARTIFACT
            ),
            {
                blocker.code
                for blocker
                in helpdesk.blockers
            },
        )

    def test_rejects_dependency_cycle(
        self,
    ) -> None:
        self.metadata[
            "inventory.tgz"
        ]["dependencies"][
            "@propertyos/plugin-procurement"
        ] = "0.1.0"

        with self.assertRaisesRegex(
            ValueError,
            "cycle",
        ):
            self._planner().plan()


if __name__ == "__main__":
    unittest.main()
