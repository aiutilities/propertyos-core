from __future__ import annotations

import unittest

from tools.knowledge_engine.contract_manifest import (
    ContractManifestGenerator,
)
from tools.knowledge_engine.contract_manifest_models import (
    ContractExport,
)


class ContractManifestOwnershipIsolationTest(
    unittest.TestCase
):
    def test_postgres_pool_is_owned_by_postgres(
        self,
    ) -> None:
        export = ContractExport(
            symbol="POSTGRES_POOL",
            source_path=(
                "backend/src/database/postgres/"
                "postgres.types.ts"
            ),
            export_kind="value",
            target_module="database:database",
            package_name="@propertyos/core-contracts",
        )

        corrected = (
            ContractManifestGenerator
            ._canonicalize_export_owner(export)
        )

        self.assertEqual(
            corrected.target_module,
            "database:postgres",
        )

    def test_database_module_remains_database(
        self,
    ) -> None:
        export = ContractExport(
            symbol="DatabaseModule",
            source_path=(
                "backend/src/database/"
                "database.module.ts"
            ),
            export_kind="class",
            target_module="database:database",
            package_name="@propertyos/core-contracts",
        )

        corrected = (
            ContractManifestGenerator
            ._canonicalize_export_owner(export)
        )

        self.assertEqual(
            corrected.target_module,
            "database:database",
        )

    def test_unrelated_export_is_unchanged(
        self,
    ) -> None:
        export = ContractExport(
            symbol="AuditModule",
            source_path=(
                "backend/src/core/audit/"
                "audit.module.ts"
            ),
            export_kind="class",
            target_module="audit",
            package_name="@propertyos/core-contracts",
        )

        corrected = (
            ContractManifestGenerator
            ._canonicalize_export_owner(export)
        )

        self.assertIs(corrected, export)


if __name__ == "__main__":
    unittest.main()
