from __future__ import annotations

import copy
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_publisher_authentication import (
    MarketplacePublisherKeyRegistry,
    MarketplacePublisherKeyState,
    MarketplacePublisherReleaseSigner,
    MarketplacePublisherReleaseVerifier,
    canonical_release_bytes,
    generate_publisher_private_key,
)


class MarketplacePublisherAuthenticationTest(
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
        self.registry = (
            MarketplacePublisherKeyRegistry(
                self.root
                / "publisher-keys.json"
            )
        )
        self.private_key = (
            generate_publisher_private_key()
        )
        self.signer = (
            MarketplacePublisherReleaseSigner(
                publisher_id="cogzidel",
                key_id="cogzidel-primary",
                private_key=(
                    self.private_key
                ),
            )
        )
        self.registry.register(
            self.signer.public_key_record()
        )

    def tearDown(
        self,
    ) -> None:
        self.temporary.cleanup()

    def payload(
        self,
    ):
        return {
            "archiveSha256": "a" * 64,
            "archiveUrl": (
                "https://marketplace.propertyos.example/"
                "inventory/0.1.0/plugin.tgz"
            ),
            "manifestUrl": (
                "https://marketplace.propertyos.example/"
                "inventory/0.1.0/manifest.json"
            ),
            "maximumHostApi": "0.2.0",
            "minimumHostApi": "0.1.0",
            "pluginId": "inventory",
            "publisherId": "cogzidel",
            "version": "0.1.0",
            "yanked": False,
        }

    def test_registers_active_publisher_key(
        self,
    ) -> None:
        records = self.registry.load()

        self.assertEqual(
            records[
                "cogzidel-primary"
            ].state,
            MarketplacePublisherKeyState.ACTIVE,
        )

    def test_signs_and_verifies_release(
        self,
    ) -> None:
        payload = self.payload()
        signature = self.signer.sign(
            payload
        )

        (
            MarketplacePublisherReleaseVerifier()
            .verify(
                publisher_id="cogzidel",
                payload=payload,
                signature=(
                    signature.to_dict()
                ),
                registry=(
                    self.registry
                ),
            )
        )

    def test_rejects_tampered_release(
        self,
    ) -> None:
        payload = self.payload()
        signature = self.signer.sign(
            payload
        )
        tampered = copy.deepcopy(
            payload
        )
        tampered["version"] = "0.2.0"

        with self.assertRaises(
            ValueError
        ):
            (
                MarketplacePublisherReleaseVerifier()
                .verify(
                    publisher_id="cogzidel",
                    payload=tampered,
                    signature=(
                        signature.to_dict()
                    ),
                    registry=(
                        self.registry
                    ),
                )
            )

    def test_rejects_unknown_key(
        self,
    ) -> None:
        payload = self.payload()
        signature = self.signer.sign(
            payload
        ).to_dict()
        signature[
            "keyId"
        ] = "unknown"

        with self.assertRaises(
            ValueError
        ):
            (
                MarketplacePublisherReleaseVerifier()
                .verify(
                    publisher_id="cogzidel",
                    payload=payload,
                    signature=signature,
                    registry=(
                        self.registry
                    ),
                )
            )

    def test_rejects_key_owned_by_other_publisher(
        self,
    ) -> None:
        payload = self.payload()
        signature = self.signer.sign(
            payload
        )

        with self.assertRaises(
            ValueError
        ):
            (
                MarketplacePublisherReleaseVerifier()
                .verify(
                    publisher_id="other",
                    payload=payload,
                    signature=(
                        signature.to_dict()
                    ),
                    registry=(
                        self.registry
                    ),
                )
            )

    def test_revoked_key_is_rejected(
        self,
    ) -> None:
        payload = self.payload()
        signature = self.signer.sign(
            payload
        )

        self.registry.revoke(
            publisher_id="cogzidel",
            key_id="cogzidel-primary",
        )

        with self.assertRaises(
            ValueError
        ):
            (
                MarketplacePublisherReleaseVerifier()
                .verify(
                    publisher_id="cogzidel",
                    payload=payload,
                    signature=(
                        signature.to_dict()
                    ),
                    registry=(
                        self.registry
                    ),
                )
            )

    def test_registry_output_is_deterministic(
        self,
    ) -> None:
        first = (
            self.registry.path
            .read_bytes()
        )

        records = self.registry.load()
        self.registry.write(
            records
        )

        second = (
            self.registry.path
            .read_bytes()
        )

        self.assertEqual(
            first,
            second,
        )

    def test_canonical_release_bytes_are_deterministic(
        self,
    ) -> None:
        first = canonical_release_bytes(
            self.payload()
        )

        reversed_payload = {
            key: self.payload()[key]
            for key in reversed(
                list(
                    self.payload()
                )
            )
        }

        second = canonical_release_bytes(
            reversed_payload
        )

        self.assertEqual(
            first,
            second,
        )

    def test_duplicate_key_id_with_different_owner_is_rejected(
        self,
    ) -> None:
        other_signer = (
            MarketplacePublisherReleaseSigner(
                publisher_id="other",
                key_id="cogzidel-primary",
                private_key=(
                    generate_publisher_private_key()
                ),
            )
        )

        with self.assertRaises(
            ValueError
        ):
            self.registry.register(
                other_signer.public_key_record()
            )


if __name__ == "__main__":
    unittest.main()
