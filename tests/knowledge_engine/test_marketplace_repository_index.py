from __future__ import annotations

import copy
import tempfile
import unittest

from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
)

from tools.knowledge_engine.marketplace_publisher_authentication import (
    MarketplacePublisherReleaseSigner,
)
from tools.knowledge_engine.marketplace_repository_index import (
    MarketplaceRepositoryBuildRequest,
    MarketplaceRepositoryIndexBuilder,
    MarketplaceRepositoryIndexSigner,
    MarketplaceRepositoryIndexVerifier,
    MarketplaceRepositoryPublisherInput,
    MarketplaceRepositoryReleaseInput,
)


class MarketplaceRepositoryIndexTest(
    unittest.TestCase
):
    def setUp(
        self,
    ) -> None:
        self.temporary = (
            tempfile.TemporaryDirectory()
        )
        self.root = Path(
            self.temporary.name
        )

        self.archive_1 = (
            self.root
            / "inventory-0.1.0.tgz"
        )
        self.archive_2 = (
            self.root
            / "inventory-0.2.0.tgz"
        )

        self.archive_1.write_bytes(
            b"inventory-0.1.0"
        )
        self.archive_2.write_bytes(
            b"inventory-0.2.0"
        )

        self.publisher_key = (
            Ed25519PrivateKey.generate()
        )
        self.repository_key = (
            Ed25519PrivateKey.generate()
        )
        self.publisher_signer = (
            MarketplacePublisherReleaseSigner(
                publisher_id="cogzidel",
                key_id="cogzidel-primary",
                private_key=self.publisher_key,
            )
        )

    def tearDown(
        self,
    ) -> None:
        self.temporary.cleanup()

    def request(
        self,
    ) -> MarketplaceRepositoryBuildRequest:
        common = {
            "plugin_id": "inventory",
            "display_name": "Inventory",
            "summary": "Inventory plugin.",
            "publisher_id": "cogzidel",
            "minimum_host_api": "0.1.0",
            "maximum_host_api": "0.2.0",
            "signer": self.publisher_signer,
        }

        return MarketplaceRepositoryBuildRequest(
            repository_id="propertyos-official",
            repository_name=(
                "PropertyOS Official Marketplace"
            ),
            base_url=(
                "https://marketplace.propertyos.example"
            ),
            generated_at=(
                "2026-08-02T00:00:00Z"
            ),
            publishers=(
                MarketplaceRepositoryPublisherInput(
                    publisher_id="cogzidel",
                    name="Cogzidel Technologies",
                    key_ids=(
                        "cogzidel-primary",
                    ),
                ),
            ),
            releases=(
                MarketplaceRepositoryReleaseInput(
                    version="0.2.0",
                    manifest_url=(
                        "https://marketplace.propertyos.example/"
                        "inventory/0.2.0/manifest.json"
                    ),
                    archive_url=(
                        "https://marketplace.propertyos.example/"
                        "inventory/0.2.0/plugin.tgz"
                    ),
                    archive_path=self.archive_2,
                    published_at=(
                        "2026-08-02T00:00:00Z"
                    ),
                    **common,
                ),
                MarketplaceRepositoryReleaseInput(
                    version="0.1.0",
                    manifest_url=(
                        "https://marketplace.propertyos.example/"
                        "inventory/0.1.0/manifest.json"
                    ),
                    archive_url=(
                        "https://marketplace.propertyos.example/"
                        "inventory/0.1.0/plugin.tgz"
                    ),
                    archive_path=self.archive_1,
                    published_at=(
                        "2026-08-01T00:00:00Z"
                    ),
                    **common,
                ),
            ),
        )

    def signed(
        self,
    ):
        index = (
            MarketplaceRepositoryIndexBuilder()
            .build(
                self.request()
            )
        )

        signed = (
            MarketplaceRepositoryIndexSigner(
                key_id="repository-primary",
                private_key=self.repository_key,
            )
            .sign(index)
        )

        return index, signed

    def test_builds_valid_index(
        self,
    ) -> None:
        index = (
            MarketplaceRepositoryIndexBuilder()
            .build(
                self.request()
            )
        )

        self.assertEqual(
            index["plugins"][0]["latestVersion"],
            "0.2.0",
        )

        releases = (
            index["plugins"][0]["releases"]
        )

        self.assertEqual(
            [
                item["version"]
                for item in releases
            ],
            [
                "0.1.0",
                "0.2.0",
            ],
        )

        self.assertEqual(
            releases[0]["signature"]["keyId"],
            "cogzidel-primary",
        )

        self.assertTrue(
            releases[0]["signature"]["value"]
        )

    def test_index_is_deterministic(
        self,
    ) -> None:
        builder = (
            MarketplaceRepositoryIndexBuilder()
        )

        first = builder.build(
            self.request()
        )
        second = builder.build(
            self.request()
        )

        self.assertEqual(
            first,
            second,
        )

        self.assertEqual(
            builder.canonical_bytes(first),
            builder.canonical_bytes(second),
        )

    def test_archive_hashes_are_calculated(
        self,
    ) -> None:
        index = (
            MarketplaceRepositoryIndexBuilder()
            .build(
                self.request()
            )
        )

        for release in (
            index["plugins"][0]["releases"]
        ):
            self.assertEqual(
                len(release["archiveSha256"]),
                64,
            )

    def test_repository_signature_verifies(
        self,
    ) -> None:
        index, signed = self.signed()

        verified = (
            MarketplaceRepositoryIndexVerifier()
            .verify(
                signed.envelope(),
                trusted_keys={
                    "repository-primary": (
                        self.repository_key
                        .public_key()
                    )
                },
            )
        )

        self.assertEqual(
            verified,
            index,
        )

    def test_tampered_repository_index_is_rejected(
        self,
    ) -> None:
        _, signed = self.signed()
        envelope = copy.deepcopy(
            signed.envelope()
        )

        envelope[
            "index"
        ][
            "repository"
        ][
            "name"
        ] = "Tampered"

        with self.assertRaises(
            ValueError
        ):
            (
                MarketplaceRepositoryIndexVerifier()
                .verify(
                    envelope,
                    trusted_keys={
                        "repository-primary": (
                            self.repository_key
                            .public_key()
                        )
                    },
                )
            )

    def test_untrusted_repository_key_is_rejected(
        self,
    ) -> None:
        _, signed = self.signed()

        with self.assertRaises(
            ValueError
        ):
            (
                MarketplaceRepositoryIndexVerifier()
                .verify(
                    signed.envelope(),
                    trusted_keys={},
                )
            )

    def test_rejects_unregistered_publisher_signer_key(
        self,
    ) -> None:
        request = self.request()
        publisher = request.publishers[0]

        bad = MarketplaceRepositoryBuildRequest(
            repository_id=request.repository_id,
            repository_name=request.repository_name,
            base_url=request.base_url,
            generated_at=request.generated_at,
            publishers=(
                MarketplaceRepositoryPublisherInput(
                    publisher_id=(
                        publisher.publisher_id
                    ),
                    name=publisher.name,
                    key_ids=("different-key",),
                ),
            ),
            releases=request.releases,
        )

        with self.assertRaises(
            ValueError
        ):
            (
                MarketplaceRepositoryIndexBuilder()
                .build(bad)
            )


if __name__ == "__main__":
    unittest.main()
