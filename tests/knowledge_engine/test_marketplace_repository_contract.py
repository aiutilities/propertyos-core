from __future__ import annotations

import copy
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_repository_contract import (
    MarketplaceRepositoryContractValidator,
)


def repository_document():
    return {
        "schemaVersion": "1.0.0",
        "repository": {
            "id": "propertyos-official",
            "name": "PropertyOS Official Marketplace",
            "baseUrl": "https://marketplace.propertyos.example",
            "generatedAt": "2026-08-02T00:00:00Z",
        },
        "publishers": [
            {
                "id": "cogzidel",
                "name": "Cogzidel Technologies",
                "keyIds": [
                    "cogzidel-primary",
                ],
            }
        ],
        "plugins": [
            {
                "id": "inventory",
                "displayName": "Inventory",
                "publisherId": "cogzidel",
                "summary": "Inventory management plugin.",
                "latestVersion": "0.2.0",
                "releases": [
                    {
                        "version": "0.1.0",
                        "manifestUrl": (
                            "https://marketplace.propertyos.example/"
                            "inventory/0.1.0/manifest.json"
                        ),
                        "archiveUrl": (
                            "https://marketplace.propertyos.example/"
                            "inventory/0.1.0/plugin.tgz"
                        ),
                        "archiveSha256": "a" * 64,
                        "signature": {
                            "algorithm": "ed25519",
                            "keyId": "cogzidel-primary",
                            "value": "SIGNATURE",
                        },
                        "publishedAt": "2026-08-01T00:00:00Z",
                        "minimumHostApi": "0.1.0",
                        "maximumHostApi": "0.2.0",
                        "yanked": False,
                    },
                    {
                        "version": "0.2.0",
                        "manifestUrl": (
                            "https://marketplace.propertyos.example/"
                            "inventory/0.2.0/manifest.json"
                        ),
                        "archiveUrl": (
                            "https://marketplace.propertyos.example/"
                            "inventory/0.2.0/plugin.tgz"
                        ),
                        "archiveSha256": "b" * 64,
                        "signature": {
                            "algorithm": "ed25519",
                            "keyId": "cogzidel-primary",
                            "value": "SIGNATURE",
                        },
                        "publishedAt": "2026-08-02T00:00:00Z",
                        "minimumHostApi": "0.1.0",
                        "maximumHostApi": "0.2.0",
                        "yanked": False,
                    },
                ],
            }
        ],
    }


class MarketplaceRepositoryContractValidatorTest(
    unittest.TestCase
):
    def setUp(self) -> None:
        self.validator = (
            MarketplaceRepositoryContractValidator()
        )

    def test_accepts_valid_repository_index(
        self,
    ) -> None:
        result = self.validator.validate(
            repository_document()
        )

        self.assertTrue(
            result.valid
        )
        self.assertEqual(
            result.issues,
            (),
        )

    def test_rejects_unknown_root_field(
        self,
    ) -> None:
        document = repository_document()
        document["unknown"] = True

        result = self.validator.validate(
            document
        )

        self.assertTrue(
            any(
                issue.code
                == "UNKNOWN_FIELD"
                for issue in result.issues
            )
        )

    def test_rejects_http_repository_url(
        self,
    ) -> None:
        document = repository_document()
        document[
            "repository"
        ][
            "baseUrl"
        ] = "http://marketplace.example"

        result = self.validator.validate(
            document
        )

        self.assertTrue(
            any(
                issue.code
                == "REPOSITORY_URL_UNSAFE"
                for issue in result.issues
            )
        )

    def test_rejects_duplicate_plugin_id(
        self,
    ) -> None:
        document = repository_document()
        document["plugins"].append(
            copy.deepcopy(
                document["plugins"][0]
            )
        )

        result = self.validator.validate(
            document
        )

        self.assertTrue(
            any(
                issue.code
                == "PLUGIN_DUPLICATE"
                for issue in result.issues
            )
        )

    def test_rejects_unknown_publisher(
        self,
    ) -> None:
        document = repository_document()
        document[
            "plugins"
        ][
            0
        ][
            "publisherId"
        ] = "unknown"

        result = self.validator.validate(
            document
        )

        self.assertTrue(
            any(
                issue.code
                == "PUBLISHER_UNKNOWN"
                for issue in result.issues
            )
        )

    def test_rejects_unregistered_signing_key(
        self,
    ) -> None:
        document = repository_document()
        document[
            "plugins"
        ][
            0
        ][
            "releases"
        ][
            0
        ][
            "signature"
        ][
            "keyId"
        ] = "unknown-key"

        result = self.validator.validate(
            document
        )

        self.assertTrue(
            any(
                issue.code
                == "SIGNING_KEY_UNKNOWN"
                for issue in result.issues
            )
        )

    def test_rejects_invalid_archive_digest(
        self,
    ) -> None:
        document = repository_document()
        document[
            "plugins"
        ][
            0
        ][
            "releases"
        ][
            0
        ][
            "archiveSha256"
        ] = "invalid"

        result = self.validator.validate(
            document
        )

        self.assertTrue(
            any(
                issue.code
                == "ARCHIVE_SHA256_INVALID"
                for issue in result.issues
            )
        )

    def test_rejects_latest_version_mismatch(
        self,
    ) -> None:
        document = repository_document()
        document[
            "plugins"
        ][
            0
        ][
            "latestVersion"
        ] = "0.1.0"

        result = self.validator.validate(
            document
        )

        self.assertTrue(
            any(
                issue.code
                == "LATEST_VERSION_MISMATCH"
                for issue in result.issues
            )
        )

    def test_rejects_invalid_host_range(
        self,
    ) -> None:
        document = repository_document()
        release = (
            document[
                "plugins"
            ][
                0
            ][
                "releases"
            ][
                0
            ]
        )
        release[
            "minimumHostApi"
        ] = "2.0.0"
        release[
            "maximumHostApi"
        ] = "1.0.0"

        result = self.validator.validate(
            document
        )

        self.assertTrue(
            any(
                issue.code
                == "HOST_API_RANGE_INVALID"
                for issue in result.issues
            )
        )

    def test_result_is_deterministic(
        self,
    ) -> None:
        document = repository_document()
        document["unknown"] = True
        document[
            "repository"
        ][
            "baseUrl"
        ] = "http://unsafe"

        first = self.validator.validate(
            document
        )
        second = self.validator.validate(
            document
        )

        self.assertEqual(
            first,
            second,
        )

    def test_require_valid_raises(
        self,
    ) -> None:
        document = repository_document()
        document[
            "schemaVersion"
        ] = "2.0.0"

        with self.assertRaises(
            ValueError
        ):
            self.validator.require_valid(
                document
            )


if __name__ == "__main__":
    unittest.main()
