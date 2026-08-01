from __future__ import annotations

import hashlib
import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_publication_pipeline import (
    MarketplacePublicationPipeline,
    MarketplacePublicationRequest,
    MarketplacePublicationState,
)
from tools.knowledge_engine.marketplace_publisher_authentication import (
    MarketplacePublisherKeyRegistry,
    MarketplacePublisherReleaseSigner,
    generate_publisher_private_key,
)


class MarketplacePublicationPipelineTest(
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
        self.manifest_path = (
            self.root
            / "plugin.json"
        )
        self.archive_path = (
            self.root
            / "inventory-0.1.0.tgz"
        )
        self.registry_path = (
            self.root
            / "publisher-keys.json"
        )
        self.repository_root = (
            self.root
            / "repository"
        )
        self.work_root = (
            self.root
            / "work"
        )
        self.journal_root = (
            self.root
            / "journals"
        )

        self.manifest_path.write_text(
            json.dumps(
                {
                    "id": "inventory",
                    "version": "0.1.0",
                    "publisher": {
                        "id": "cogzidel",
                    },
                }
            )
            + "\n",
            encoding="utf-8",
        )
        self.archive_path.write_bytes(
            b"inventory-0.1.0"
        )

        self.signer = (
            MarketplacePublisherReleaseSigner(
                publisher_id="cogzidel",
                key_id="cogzidel-primary",
                private_key=(
                    generate_publisher_private_key()
                ),
            )
        )

        registry = (
            MarketplacePublisherKeyRegistry(
                self.registry_path
            )
        )
        registry.register(
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
            "archiveSha256": hashlib.sha256(
                self.archive_path.read_bytes()
            ).hexdigest(),
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
            "publishedAt": (
                "2026-08-02T00:00:00Z"
            ),
            "version": "0.1.0",
            "yanked": False,
        }

    def request(
        self,
        *,
        signature=None,
    ) -> MarketplacePublicationRequest:
        payload = self.payload()

        if signature is None:
            signature = (
                self.signer
                .sign(
                    payload
                )
                .to_dict()
            )

        return MarketplacePublicationRequest(
            plugin_id="inventory",
            publisher_id="cogzidel",
            version="0.1.0",
            manifest_path=(
                self.manifest_path
            ),
            archive_path=(
                self.archive_path
            ),
            signature=signature,
            publisher_registry_path=(
                self.registry_path
            ),
            repository_root=(
                self.repository_root
            ),
            work_root=(
                self.work_root
            ),
            journal_root=(
                self.journal_root
            ),
            manifest_url=(
                payload[
                    "manifestUrl"
                ]
            ),
            archive_url=(
                payload[
                    "archiveUrl"
                ]
            ),
            published_at=(
                payload[
                    "publishedAt"
                ]
            ),
            minimum_host_api=(
                payload[
                    "minimumHostApi"
                ]
            ),
            maximum_host_api=(
                payload[
                    "maximumHostApi"
                ]
            ),
        )

    def test_publishes_valid_release(
        self,
    ) -> None:
        result = (
            MarketplacePublicationPipeline(
                self.request(),
                transaction_id="publication-1",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertTrue(
            (
                result.release_directory
                / "manifest.json"
            ).is_file()
        )
        self.assertTrue(
            (
                result.release_directory
                / "plugin.tgz"
            ).is_file()
        )
        self.assertTrue(
            result.release_record_path
            .is_file()
        )

    def test_release_record_contains_signature(
        self,
    ) -> None:
        result = (
            MarketplacePublicationPipeline(
                self.request(),
                transaction_id="publication-2",
            )
            .execute()
        )

        record = json.loads(
            result.release_record_path
            .read_text(
                encoding="utf-8"
            )
        )

        self.assertEqual(
            record[
                "release"
            ][
                "signature"
            ][
                "keyId"
            ],
            "cogzidel-primary",
        )

    def test_rejects_duplicate_release(
        self,
    ) -> None:
        first = (
            MarketplacePublicationPipeline(
                self.request(),
                transaction_id="publication-3a",
            )
            .execute()
        )

        second = (
            MarketplacePublicationPipeline(
                self.request(),
                transaction_id="publication-3b",
            )
            .execute()
        )

        self.assertTrue(
            first.succeeded
        )
        self.assertEqual(
            second.state,
            MarketplacePublicationState.ROLLED_BACK,
        )

    def test_rejects_tampered_signature(
        self,
    ) -> None:
        signature = (
            self.signer
            .sign(
                self.payload()
            )
            .to_dict()
        )
        signature["value"] = (
            signature["value"][:-2]
            + "AA"
        )

        result = (
            MarketplacePublicationPipeline(
                self.request(
                    signature=signature
                ),
                transaction_id="publication-4",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePublicationState.ROLLED_BACK,
        )

    def test_rejects_manifest_id_mismatch(
        self,
    ) -> None:
        self.manifest_path.write_text(
            json.dumps(
                {
                    "id": "wrong",
                    "version": "0.1.0",
                    "publisher": {
                        "id": "cogzidel",
                    },
                }
            )
            + "\n",
            encoding="utf-8",
        )

        result = (
            MarketplacePublicationPipeline(
                self.request(),
                transaction_id="publication-5",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePublicationState.ROLLED_BACK,
        )

    def test_rejects_http_archive_url(
        self,
    ) -> None:
        request = self.request()

        bad = MarketplacePublicationRequest(
            plugin_id=request.plugin_id,
            publisher_id=request.publisher_id,
            version=request.version,
            manifest_path=request.manifest_path,
            archive_path=request.archive_path,
            signature=request.signature,
            publisher_registry_path=(
                request.publisher_registry_path
            ),
            repository_root=request.repository_root,
            work_root=request.work_root,
            journal_root=request.journal_root,
            manifest_url=request.manifest_url,
            archive_url="http://unsafe/plugin.tgz",
            published_at=request.published_at,
            minimum_host_api=(
                request.minimum_host_api
            ),
            maximum_host_api=(
                request.maximum_host_api
            ),
        )

        result = (
            MarketplacePublicationPipeline(
                bad,
                transaction_id="publication-6",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePublicationState.ROLLED_BACK,
        )

    def test_failure_after_promote_removes_release(
        self,
    ) -> None:
        def fault(
            point: str,
        ) -> None:
            if point == "after-promote":
                raise RuntimeError(
                    "injected failure"
                )

        result = (
            MarketplacePublicationPipeline(
                self.request(),
                transaction_id="publication-7",
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplacePublicationState.ROLLED_BACK,
        )
        self.assertFalse(
            result.release_directory.exists()
        )

    def test_journal_records_commit(
        self,
    ) -> None:
        result = (
            MarketplacePublicationPipeline(
                self.request(),
                transaction_id="publication-8",
            )
            .execute()
        )

        events = [
            json.loads(line)["event"]
            for line in (
                result.journal_path
                .read_text(
                    encoding="utf-8"
                )
                .splitlines()
            )
        ]

        self.assertEqual(
            events[-1],
            "publication-committed",
        )


if __name__ == "__main__":
    unittest.main()
