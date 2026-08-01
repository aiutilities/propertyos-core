from __future__ import annotations

import unittest

from tools.knowledge_engine.approved_host_surface import (
    load_approved_host_surface,
)
from tools.knowledge_engine.approved_host_surface_models import (
    normalize_approved_module_id,
)


class ApprovedHostSurfaceModuleAliasTest(
    unittest.TestCase
):
    @classmethod
    def setUpClass(cls) -> None:
        cls.surface = load_approved_host_surface()

    def test_database_module_qualified_id(
        self,
    ) -> None:
        self.assertTrue(
            self.surface.permits(
                module_id="database:database",
                symbol="DatabaseModule",
                kind="runtime",
            )
        )

    def test_postgres_symbols_qualified_id(
        self,
    ) -> None:
        self.assertTrue(
            self.surface.permits(
                module_id="database:postgres",
                symbol="POSTGRES_POOL",
                kind="runtime",
            )
        )

        self.assertTrue(
            self.surface.permits(
                module_id="database:postgres",
                symbol="PostgresModule",
                kind="runtime",
            )
        )

    def test_default_deny_is_preserved(
        self,
    ) -> None:
        self.assertFalse(
            self.surface.permits(
                module_id="database:database",
                symbol="UnknownDatabaseSymbol",
                kind="runtime",
            )
        )

        self.assertFalse(
            self.surface.permits(
                module_id="database:database",
                symbol="DatabaseModule",
                kind="type",
            )
        )

    def test_normalization_is_deterministic(
        self,
    ) -> None:
        self.assertEqual(
            normalize_approved_module_id(
                "database:database"
            ),
            "database-database",
        )

        self.assertEqual(
            normalize_approved_module_id(
                "database:postgres"
            ),
            "database-postgres",
        )


if __name__ == "__main__":
    unittest.main()
