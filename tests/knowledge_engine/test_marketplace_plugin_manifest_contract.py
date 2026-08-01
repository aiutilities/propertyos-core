from __future__ import annotations

import json
import re
import unittest

from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

SCHEMA_PATH = (
    ROOT
    / "tools"
    / "knowledge_engine"
    / "contracts"
    / "marketplace_plugin_manifest.schema.json"
)

EXAMPLE_PATH = (
    ROOT
    / "tools"
    / "knowledge_engine"
    / "contracts"
    / "examples"
    / "marketplace_plugin_manifest.example.json"
)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(
        path.read_text(encoding="utf-8")
    )


class MarketplacePluginManifestContractTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.schema = load_json(SCHEMA_PATH)
        self.example = load_json(EXAMPLE_PATH)

    def test_schema_identity_is_stable(
        self,
    ) -> None:
        self.assertEqual(
            self.schema["$schema"],
            (
                "https://json-schema.org/"
                "draft/2020-12/schema"
            ),
        )

        self.assertEqual(
            self.schema["$id"],
            (
                "https://propertyos.org/contracts/"
                "marketplace-plugin-manifest.schema.json"
            ),
        )

    def test_schema_is_closed_by_default(
        self,
    ) -> None:
        self.assertFalse(
            self.schema["additionalProperties"]
        )

    def test_required_marketplace_contract(
        self,
    ) -> None:
        required = set(
            self.schema["required"]
        )

        self.assertEqual(
            required,
            {
                "schemaVersion",
                "id",
                "displayName",
                "version",
                "publisher",
                "engine",
                "contracts",
                "permissions",
                "migrations",
                "integrity",
            },
        )

    def test_schema_version_is_frozen(
        self,
    ) -> None:
        self.assertEqual(
            self.schema[
                "properties"
            ][
                "schemaVersion"
            ][
                "const"
            ],
            "1.0.0",
        )

    def test_integrity_uses_sha256(
        self,
    ) -> None:
        integrity = self.schema[
            "properties"
        ][
            "integrity"
        ]

        self.assertEqual(
            integrity[
                "properties"
            ][
                "algorithm"
            ][
                "const"
            ],
            "sha256",
        )

        self.assertEqual(
            integrity[
                "properties"
            ][
                "archiveSha256"
            ][
                "pattern"
            ],
            "^[a-f0-9]{64}$",
        )

    def test_signature_algorithm_is_explicit(
        self,
    ) -> None:
        algorithms = self.schema[
            "properties"
        ][
            "integrity"
        ][
            "properties"
        ][
            "signature"
        ][
            "properties"
        ][
            "algorithm"
        ][
            "enum"
        ]

        self.assertEqual(
            algorithms,
            ["ed25519"],
        )

    def test_lifecycle_contract_is_bounded(
        self,
    ) -> None:
        lifecycle = self.schema[
            "properties"
        ][
            "lifecycle"
        ]

        self.assertFalse(
            lifecycle[
                "additionalProperties"
            ]
        )

        self.assertEqual(
            set(
                lifecycle[
                    "properties"
                ]
            ),
            {
                "install",
                "activate",
                "deactivate",
                "uninstall",
            },
        )

    def test_capability_contract_matches_registries(
        self,
    ) -> None:
        capabilities = set(
            self.schema[
                "properties"
            ][
                "capabilities"
            ][
                "items"
            ][
                "enum"
            ]
        )

        self.assertEqual(
            capabilities,
            {
                "configuration",
                "dashboard",
                "documents",
                "notifications",
                "permissions",
                "scheduler",
                "search",
                "workflow",
            },
        )

    def test_example_contains_required_fields(
        self,
    ) -> None:
        missing = (
            set(self.schema["required"])
            - set(self.example)
        )

        self.assertEqual(
            missing,
            set(),
        )

    def test_example_plugin_id_matches_pattern(
        self,
    ) -> None:
        pattern = self.schema[
            "properties"
        ][
            "id"
        ][
            "pattern"
        ]

        self.assertIsNotNone(
            re.fullmatch(
                pattern,
                self.example["id"],
            )
        )

    def test_example_version_matches_pattern(
        self,
    ) -> None:
        pattern = self.schema[
            "properties"
        ][
            "version"
        ][
            "pattern"
        ]

        self.assertIsNotNone(
            re.fullmatch(
                pattern,
                self.example["version"],
            )
        )

    def test_example_sha256_matches_pattern(
        self,
    ) -> None:
        pattern = self.schema[
            "properties"
        ][
            "integrity"
        ][
            "properties"
        ][
            "archiveSha256"
        ][
            "pattern"
        ]

        value = self.example[
            "integrity"
        ][
            "archiveSha256"
        ]

        self.assertIsNotNone(
            re.fullmatch(
                pattern,
                value,
            )
        )

    def test_default_deny_permissions(
        self,
    ) -> None:
        permissions = self.schema[
            "properties"
        ][
            "permissions"
        ]

        self.assertEqual(
            permissions["type"],
            "array",
        )

        self.assertTrue(
            permissions["uniqueItems"]
        )

        self.assertEqual(
            self.example["permissions"],
            [
                "agreement:create",
                "agreement:read",
                "agreement:update",
            ],
        )

    def test_migration_strategy_is_explicit(
        self,
    ) -> None:
        strategies = self.schema[
            "properties"
        ][
            "migrations"
        ][
            "properties"
        ][
            "strategy"
        ][
            "enum"
        ]

        self.assertEqual(
            strategies,
            [
                "none",
                "ordered-sql",
            ],
        )

    def test_host_api_range_is_required(
        self,
    ) -> None:
        host_api = self.schema[
            "properties"
        ][
            "engine"
        ][
            "properties"
        ][
            "hostApi"
        ]

        self.assertEqual(
            set(host_api["required"]),
            {
                "minimum",
                "maximum",
            },
        )


if __name__ == "__main__":
    unittest.main()
