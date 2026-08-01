from __future__ import annotations

import hashlib
import json
import tempfile
import unittest

from pathlib import Path

from tools.knowledge_engine.marketplace_offline_cache import (
    MarketplaceMirror,
    MarketplaceMirrorState,
    MarketplaceOfflineCacheManager,
    MarketplaceOfflineCacheRequest,
)
from tools.knowledge_engine.marketplace_secure_download import (
    MarketplaceDownloadResponse,
)


class MarketplaceOfflineCacheManagerTest(
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
            b"propertyos-offline-cache"
        )
        self.digest = hashlib.sha256(
            self.content
        ).hexdigest()

    def tearDown(
        self,
    ) -> None:
        self.temporary.cleanup()

    def request(
        self,
        **overrides,
    ) -> MarketplaceOfflineCacheRequest:
        values = {
            "plugin_id": "inventory",
            "version": "0.1.0",
            "relative_archive_path": (
                "plugins/inventory/0.1.0/plugin.tgz"
            ),
            "expected_sha256": self.digest,
            "mirrors": (
                MarketplaceMirror(
                    mirror_id="primary",
                    base_url=(
                        "https://primary.example"
                    ),
                    priority=10,
                ),
                MarketplaceMirror(
                    mirror_id="secondary",
                    base_url=(
                        "https://secondary.example"
                    ),
                    priority=20,
                ),
            ),
            "cache_root": self.root / "cache",
            "work_root": self.root / "work",
            "journal_root": self.root / "journals",
            "maximum_bytes": 1024,
            "offline_only": False,
        }
        values.update(
            overrides
        )
        return MarketplaceOfflineCacheRequest(
            **values
        )

    def test_uses_primary_mirror(
        self,
    ) -> None:
        def fetcher(
            url: str,
            maximum_bytes: int,
        ):
            return MarketplaceDownloadResponse(
                final_url=url,
                content=self.content,
            )

        result = (
            MarketplaceOfflineCacheManager(
                self.request(),
                fetcher=fetcher,
                transaction_id="mirror-1",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertEqual(
            result.selected_mirror_id,
            "primary",
        )
        self.assertTrue(
            result.cache_path.is_file()
        )

    def test_falls_back_to_secondary_mirror(
        self,
    ) -> None:
        def fetcher(
            url: str,
            maximum_bytes: int,
        ):
            if "primary" in url:
                raise RuntimeError(
                    "primary unavailable"
                )

            return MarketplaceDownloadResponse(
                final_url=url,
                content=self.content,
            )

        result = (
            MarketplaceOfflineCacheManager(
                self.request(),
                fetcher=fetcher,
                transaction_id="mirror-2",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertEqual(
            result.selected_mirror_id,
            "secondary",
        )
        self.assertEqual(
            tuple(
                attempt.succeeded
                for attempt in result.attempts
            ),
            (
                False,
                True,
            ),
        )

    def test_valid_cache_prevents_network_fetch(
        self,
    ) -> None:
        cache_path = (
            self.root
            / "cache"
            / self.digest[
                0:2
            ]
            / (
                self.digest
                + ".tgz"
            )
        )
        cache_path.parent.mkdir(
            parents=True
        )
        cache_path.write_bytes(
            self.content
        )

        def should_not_fetch(
            url: str,
            maximum_bytes: int,
        ):
            raise AssertionError(
                "Network fetch should not occur."
            )

        result = (
            MarketplaceOfflineCacheManager(
                self.request(),
                fetcher=should_not_fetch,
                transaction_id="mirror-3",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertIsNone(
            result.selected_mirror_id
        )

    def test_offline_only_cache_miss_fails(
        self,
    ) -> None:
        result = (
            MarketplaceOfflineCacheManager(
                self.request(
                    offline_only=True
                ),
                fetcher=(
                    lambda url, maximum_bytes:
                    MarketplaceDownloadResponse(
                        final_url=url,
                        content=self.content,
                    )
                ),
                transaction_id="mirror-4",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceMirrorState.ROLLED_BACK,
        )
        self.assertFalse(
            result.cache_path.exists()
        )

    def test_corrupt_cache_is_evicted_and_refetched(
        self,
    ) -> None:
        cache_path = (
            self.root
            / "cache"
            / self.digest[
                0:2
            ]
            / (
                self.digest
                + ".tgz"
            )
        )
        cache_path.parent.mkdir(
            parents=True
        )
        cache_path.write_bytes(
            b"corrupt"
        )

        calls = []

        def fetcher(
            url: str,
            maximum_bytes: int,
        ):
            calls.append(
                url
            )
            return MarketplaceDownloadResponse(
                final_url=url,
                content=self.content,
            )

        result = (
            MarketplaceOfflineCacheManager(
                self.request(),
                fetcher=fetcher,
                transaction_id="mirror-5",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertEqual(
            len(calls),
            1,
        )
        self.assertEqual(
            result.cache_path.read_bytes(),
            self.content,
        )

    def test_rejects_http_mirror(
        self,
    ) -> None:
        result = (
            MarketplaceOfflineCacheManager(
                self.request(
                    mirrors=(
                        MarketplaceMirror(
                            mirror_id="unsafe",
                            base_url=(
                                "http://unsafe.example"
                            ),
                            priority=1,
                        ),
                    )
                ),
                fetcher=(
                    lambda url, maximum_bytes:
                    MarketplaceDownloadResponse(
                        final_url=url,
                        content=self.content,
                    )
                ),
                transaction_id="mirror-6",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceMirrorState.ROLLED_BACK,
        )

    def test_rejects_unsafe_relative_path(
        self,
    ) -> None:
        result = (
            MarketplaceOfflineCacheManager(
                self.request(
                    relative_archive_path=(
                        "../plugin.tgz"
                    )
                ),
                fetcher=(
                    lambda url, maximum_bytes:
                    MarketplaceDownloadResponse(
                        final_url=url,
                        content=self.content,
                    )
                ),
                transaction_id="mirror-7",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceMirrorState.ROLLED_BACK,
        )

    def test_rejects_http_redirect(
        self,
    ) -> None:
        def fetcher(
            url: str,
            maximum_bytes: int,
        ):
            return MarketplaceDownloadResponse(
                final_url=(
                    "http://unsafe.example/plugin.tgz"
                ),
                content=self.content,
            )

        result = (
            MarketplaceOfflineCacheManager(
                self.request(),
                fetcher=fetcher,
                transaction_id="mirror-8",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceMirrorState.ROLLED_BACK,
        )

    def test_journal_records_commit(
        self,
    ) -> None:
        result = (
            MarketplaceOfflineCacheManager(
                self.request(),
                fetcher=(
                    lambda url, maximum_bytes:
                    MarketplaceDownloadResponse(
                        final_url=url,
                        content=self.content,
                    )
                ),
                transaction_id="mirror-9",
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
            "mirror-resolution-committed",
        )


if __name__ == "__main__":
    unittest.main()
