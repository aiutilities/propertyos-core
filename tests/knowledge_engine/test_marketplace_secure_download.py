from __future__ import annotations

import hashlib
import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_publisher_authentication import (
    MarketplacePublisherKeyRegistry,
    MarketplacePublisherReleaseSigner,
    generate_publisher_private_key,
)
from tools.knowledge_engine.marketplace_secure_download import (
    MarketplaceDownloadRequest,
    MarketplaceDownloadResponse,
    MarketplaceDownloadState,
    MarketplaceSecureDownloadManager,
)


class MarketplaceSecureDownloadManagerTest(
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
        self.content = (
            b"propertyos-inventory-0.1.0"
        )
        self.digest = hashlib.sha256(
            self.content
        ).hexdigest()
        self.registry_path = (
            self.root
            / "publisher-keys.json"
        )
        self.cache_root = (
            self.root
            / "cache"
        )
        self.destination = (
            self.root
            / "handoff"
            / "inventory-0.1.0.tgz"
        )
        self.work_root = (
            self.root
            / "work"
        )
        self.journal_root = (
            self.root
            / "journals"
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

        MarketplacePublisherKeyRegistry(
            self.registry_path
        ).register(
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
            "archiveSha256": self.digest,
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
        maximum_bytes: int = 1024,
    ) -> MarketplaceDownloadRequest:
        payload = self.payload()

        return MarketplaceDownloadRequest(
            plugin_id="inventory",
            publisher_id="cogzidel",
            version="0.1.0",
            archive_url=(
                payload[
                    "archiveUrl"
                ]
            ),
            expected_sha256=(
                self.digest
            ),
            release_payload=payload,
            release_signature=(
                self.signer
                .sign(payload)
                .to_dict()
            ),
            publisher_registry_path=(
                self.registry_path
            ),
            cache_root=(
                self.cache_root
            ),
            destination_path=(
                self.destination
            ),
            work_root=(
                self.work_root
            ),
            journal_root=(
                self.journal_root
            ),
            maximum_bytes=maximum_bytes,
        )

    def fetcher(
        self,
        url: str,
        maximum_bytes: int,
    ) -> MarketplaceDownloadResponse:
        return MarketplaceDownloadResponse(
            final_url=url,
            content=self.content,
            content_type=(
                "application/gzip"
            ),
        )

    def test_downloads_verifies_and_handoffs(
        self,
    ) -> None:
        result = (
            MarketplaceSecureDownloadManager(
                self.request(),
                fetcher=self.fetcher,
                transaction_id="download-1",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertEqual(
            result.destination_path.read_bytes(),
            self.content,
        )
        self.assertTrue(
            result.cache_path.is_file()
        )

    def test_uses_valid_cache_without_fetch(
        self,
    ) -> None:
        first = (
            MarketplaceSecureDownloadManager(
                self.request(),
                fetcher=self.fetcher,
                transaction_id="download-2a",
            )
            .execute()
        )

        self.assertTrue(
            first.succeeded
        )
        self.destination.unlink()

        def should_not_fetch(
            url: str,
            maximum_bytes: int,
        ):
            raise AssertionError(
                "Fetcher should not be called."
            )

        second = (
            MarketplaceSecureDownloadManager(
                self.request(),
                fetcher=should_not_fetch,
                transaction_id="download-2b",
            )
            .execute()
        )

        self.assertTrue(
            second.succeeded
        )

    def test_rejects_http_initial_url(
        self,
    ) -> None:
        request = self.request()

        bad = MarketplaceDownloadRequest(
            plugin_id=request.plugin_id,
            publisher_id=request.publisher_id,
            version=request.version,
            archive_url="http://unsafe/plugin.tgz",
            expected_sha256=(
                request.expected_sha256
            ),
            release_payload=dict(
                request.release_payload,
                archiveUrl=(
                    "http://unsafe/plugin.tgz"
                ),
            ),
            release_signature=(
                request.release_signature
            ),
            publisher_registry_path=(
                request.publisher_registry_path
            ),
            cache_root=request.cache_root,
            destination_path=(
                request.destination_path
            ),
            work_root=request.work_root,
            journal_root=request.journal_root,
            maximum_bytes=(
                request.maximum_bytes
            ),
        )

        result = (
            MarketplaceSecureDownloadManager(
                bad,
                fetcher=self.fetcher,
                transaction_id="download-3",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceDownloadState.ROLLED_BACK,
        )

    def test_rejects_https_to_http_redirect(
        self,
    ) -> None:
        def redirected(
            url: str,
            maximum_bytes: int,
        ):
            return MarketplaceDownloadResponse(
                final_url=(
                    "http://unsafe/plugin.tgz"
                ),
                content=self.content,
            )

        result = (
            MarketplaceSecureDownloadManager(
                self.request(),
                fetcher=redirected,
                transaction_id="download-4",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceDownloadState.ROLLED_BACK,
        )

    def test_rejects_oversized_response(
        self,
    ) -> None:
        result = (
            MarketplaceSecureDownloadManager(
                self.request(
                    maximum_bytes=4
                ),
                fetcher=self.fetcher,
                transaction_id="download-5",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceDownloadState.ROLLED_BACK,
        )

    def test_rejects_hash_mismatch(
        self,
    ) -> None:
        def corrupt(
            url: str,
            maximum_bytes: int,
        ):
            return MarketplaceDownloadResponse(
                final_url=url,
                content=b"corrupt",
            )

        result = (
            MarketplaceSecureDownloadManager(
                self.request(),
                fetcher=corrupt,
                transaction_id="download-6",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceDownloadState.ROLLED_BACK,
        )

    def test_rejects_invalid_publisher_signature(
        self,
    ) -> None:
        request = self.request()
        signature = dict(
            request.release_signature
        )
        signature["value"] = (
            signature["value"][:-2]
            + "AA"
        )

        bad = MarketplaceDownloadRequest(
            plugin_id=request.plugin_id,
            publisher_id=request.publisher_id,
            version=request.version,
            archive_url=request.archive_url,
            expected_sha256=(
                request.expected_sha256
            ),
            release_payload=(
                request.release_payload
            ),
            release_signature=signature,
            publisher_registry_path=(
                request.publisher_registry_path
            ),
            cache_root=request.cache_root,
            destination_path=(
                request.destination_path
            ),
            work_root=request.work_root,
            journal_root=request.journal_root,
            maximum_bytes=(
                request.maximum_bytes
            ),
        )

        result = (
            MarketplaceSecureDownloadManager(
                bad,
                fetcher=self.fetcher,
                transaction_id="download-7",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceDownloadState.ROLLED_BACK,
        )

    def test_failure_after_handoff_removes_destination(
        self,
    ) -> None:
        def fault(
            point: str,
        ) -> None:
            if point == "after-handoff":
                raise RuntimeError(
                    "injected failure"
                )

        result = (
            MarketplaceSecureDownloadManager(
                self.request(),
                fetcher=self.fetcher,
                transaction_id="download-8",
                fault_hook=fault,
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceDownloadState.ROLLED_BACK,
        )
        self.assertFalse(
            self.destination.exists()
        )

    def test_journal_records_commit(
        self,
    ) -> None:
        result = (
            MarketplaceSecureDownloadManager(
                self.request(),
                fetcher=self.fetcher,
                transaction_id="download-9",
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
            "download-committed",
        )


if __name__ == "__main__":
    unittest.main()
