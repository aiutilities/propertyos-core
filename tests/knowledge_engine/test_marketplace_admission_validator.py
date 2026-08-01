from __future__ import annotations

import copy
import hashlib
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_admission_validator import (
    MarketplaceAdmissionRequest,
    MarketplaceAdmissionValidator,
)


ROOT = Path(__file__).resolve().parents[2]

SCHEMA_PATH = (
    ROOT
    / "tools"
    / "knowledge_engine"
    / "contracts"
    / "marketplace_plugin_manifest.schema.json"
)


def manifest():
    return {
        "schemaVersion": "1.0.0",
        "id": "agreement",
        "displayName": "Agreement",
        "version": "0.1.0",
        "publisher": {
            "id": "cogzidel",
            "name": "Cogzidel Technologies",
            "keyId": "cogzidel-primary",
        },
        "engine": {
            "hostApi": {
                "minimum": "0.1.0",
                "maximum": "0.2.0",
            },
            "node": ">=20",
        },
        "contracts": [
            {
                "package": "@propertyos/core-contracts",
                "version": "0.1.0",
            }
        ],
        "entrypoint": "dist/index.js",
        "permissions": [
            "agreement:create",
            "agreement:read",
        ],
        "capabilities": [
            "search",
        ],
        "dependencies": [],
        "migrations": {
            "strategy": "none",
            "reversible": True,
        },
        "integrity": {
            "algorithm": "sha256",
            "archiveSha256": "a" * 64,
            "signature": {
                "algorithm": "ed25519",
                "keyId": "cogzidel-primary",
                "value": "SIGNATURE",
            },
        },
    }


def request(
    candidate=None,
    **overrides,
):
    values = {
        "manifest": (
            candidate
            if candidate is not None
            else manifest()
        ),
        "active_host_api_version": "0.1.0",
        "active_node_version": "20.12.0",
        "available_contract_versions": {
            "@propertyos/core-contracts": "0.1.0"
        },
        "available_plugin_versions": {},
        "installed_plugin_versions": {},
        "trusted_publishers": {
            "cogzidel": (
                "cogzidel-primary",
            )
        },
        "archive_path": None,
        "allow_downgrade": False,
    }

    values.update(overrides)

    return MarketplaceAdmissionRequest(
        **values
    )


class MarketplaceAdmissionValidatorTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.validator = (
            MarketplaceAdmissionValidator(
                SCHEMA_PATH
            )
        )

    def test_accepts_compatible_plugin(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request()
        )

        self.assertTrue(
            decision.accepted
        )

        self.assertEqual(
            decision.decision,
            "ACCEPT",
        )

        self.assertEqual(
            decision.issues,
            (),
        )

    def test_rejects_schema_failure_first(
        self,
    ) -> None:
        candidate = manifest()
        candidate["unknown"] = True

        decision = self.validator.evaluate(
            request(candidate)
        )

        self.assertFalse(
            decision.accepted
        )

        self.assertTrue(
            any(
                issue.code
                == "SCHEMA_UNKNOWN_PROPERTY"
                for issue in decision.issues
            )
        )

    def test_rejects_host_api_incompatibility(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request(
                active_host_api_version="1.0.0"
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "HOST_API_INCOMPATIBLE"
                for issue in decision.issues
            )
        )

    def test_rejects_node_incompatibility(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request(
                active_node_version="18.0.0"
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "NODE_VERSION_INCOMPATIBLE"
                for issue in decision.issues
            )
        )

    def test_rejects_missing_contract(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request(
                available_contract_versions={}
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "CONTRACT_UNAVAILABLE"
                for issue in decision.issues
            )
        )

    def test_rejects_contract_version_mismatch(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request(
                available_contract_versions={
                    "@propertyos/core-contracts": "0.2.0"
                }
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "CONTRACT_VERSION_INCOMPATIBLE"
                for issue in decision.issues
            )
        )

    def test_rejects_untrusted_publisher(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request(
                trusted_publishers={}
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "PUBLISHER_UNTRUSTED"
                for issue in decision.issues
            )
        )

    def test_rejects_untrusted_signing_key(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request(
                trusted_publishers={
                    "cogzidel": (
                        "different-key",
                    )
                }
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "SIGNING_KEY_UNTRUSTED"
                for issue in decision.issues
            )
        )

    def test_rejects_missing_required_plugin_dependency(
        self,
    ) -> None:
        candidate = manifest()
        candidate["dependencies"] = [
            {
                "pluginId": "inventory",
                "version": "0.1.0",
                "optional": False,
            }
        ]

        decision = self.validator.evaluate(
            request(candidate)
        )

        self.assertTrue(
            any(
                issue.code
                == "PLUGIN_DEPENDENCY_UNAVAILABLE"
                for issue in decision.issues
            )
        )

    def test_allows_missing_optional_dependency(
        self,
    ) -> None:
        candidate = manifest()
        candidate["dependencies"] = [
            {
                "pluginId": "inventory",
                "version": "0.1.0",
                "optional": True,
            }
        ]

        decision = self.validator.evaluate(
            request(candidate)
        )

        self.assertTrue(
            decision.accepted
        )

    def test_rejects_dependency_version_mismatch(
        self,
    ) -> None:
        candidate = manifest()
        candidate["dependencies"] = [
            {
                "pluginId": "inventory",
                "version": "0.1.0",
                "optional": False,
            }
        ]

        decision = self.validator.evaluate(
            request(
                candidate,
                available_plugin_versions={
                    "inventory": "0.2.0"
                },
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "PLUGIN_DEPENDENCY_VERSION_INCOMPATIBLE"
                for issue in decision.issues
            )
        )

    def test_rejects_self_dependency(
        self,
    ) -> None:
        candidate = manifest()
        candidate["dependencies"] = [
            {
                "pluginId": "agreement",
                "version": "0.1.0",
                "optional": False,
            }
        ]

        decision = self.validator.evaluate(
            request(
                candidate,
                available_plugin_versions={
                    "agreement": "0.1.0"
                },
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "SELF_DEPENDENCY"
                for issue in decision.issues
            )
        )

    def test_rejects_downgrade_by_default(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request(
                installed_plugin_versions={
                    "agreement": "0.2.0"
                }
            )
        )

        self.assertTrue(
            any(
                issue.code
                == "DOWNGRADE_NOT_ALLOWED"
                for issue in decision.issues
            )
        )

    def test_allows_explicit_downgrade(
        self,
    ) -> None:
        decision = self.validator.evaluate(
            request(
                installed_plugin_versions={
                    "agreement": "0.2.0"
                },
                allow_downgrade=True,
            )
        )

        self.assertTrue(
            decision.accepted
        )

    def test_rejects_archive_digest_mismatch(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            archive = (
                Path(temporary)
                / "plugin.zip"
            )

            archive.write_bytes(
                b"candidate"
            )

            decision = self.validator.evaluate(
                request(
                    archive_path=archive
                )
            )

        self.assertTrue(
            any(
                issue.code
                == "ARCHIVE_SHA256_MISMATCH"
                for issue in decision.issues
            )
        )

    def test_accepts_matching_archive_digest(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            archive = (
                Path(temporary)
                / "plugin.zip"
            )

            content = b"candidate"
            archive.write_bytes(content)

            candidate = manifest()
            candidate[
                "integrity"
            ][
                "archiveSha256"
            ] = hashlib.sha256(
                content
            ).hexdigest()

            decision = self.validator.evaluate(
                request(
                    candidate,
                    archive_path=archive,
                )
            )

        self.assertTrue(
            decision.accepted
        )

    def test_issue_order_is_deterministic(
        self,
    ) -> None:
        first = self.validator.evaluate(
            request(
                active_host_api_version="1.0.0",
                active_node_version="18.0.0",
                available_contract_versions={},
                trusted_publishers={},
            )
        )

        second = self.validator.evaluate(
            request(
                active_host_api_version="1.0.0",
                active_node_version="18.0.0",
                available_contract_versions={},
                trusted_publishers={},
            )
        )

        self.assertEqual(
            first,
            second,
        )

        self.assertEqual(
            first.issues,
            tuple(
                sorted(
                    first.issues,
                    key=(
                        lambda issue:
                        issue.sort_key()
                    ),
                )
            ),
        )

    def test_require_admitted_raises_on_reject(
        self,
    ) -> None:
        with self.assertRaises(
            ValueError
        ):
            self.validator.require_admitted(
                request(
                    trusted_publishers={}
                )
            )


if __name__ == "__main__":
    unittest.main()
