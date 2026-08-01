from __future__ import annotations

import hashlib
import json
import tempfile
import unittest

from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
)

from tools.knowledge_engine.marketplace_publisher_authentication import (
    MarketplacePublisherKeyRegistry,
    MarketplacePublisherReleaseSigner,
)
from tools.knowledge_engine.marketplace_repository_index import (
    MarketplaceRepositoryIndexSigner,
)
from tools.knowledge_engine.marketplace_runtime_activation import (
    MarketplaceRuntimePluginRecord,
    MarketplaceRuntimePluginState,
    MarketplaceRuntimeRegistry,
)
from tools.knowledge_engine.marketplace_runtime_integration import (
    MarketplaceRuntimeIntegrationCoordinator,
    MarketplaceRuntimeIntegrationRequest,
    MarketplaceRuntimeIntegrationState,
)
from tools.knowledge_engine.marketplace_secure_download import (
    MarketplaceDownloadResponse,
)


class MarketplaceRuntimeIntegrationCoordinatorTest(
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

        self.install_root = (
            self.root
            / "installed"
        )
        self.registry_path = (
            self.root
            / "runtime"
            / "registry.json"
        )
        self.publisher_registry_path = (
            self.root
            / "publisher-keys.json"
        )

        installed = (
            self.install_root
            / "inventory"
        )
        (installed / "dist").mkdir(
            parents=True
        )
        (installed / "plugin.json").write_text(
            json.dumps(
                {
                    "id": "inventory",
                    "version": "0.1.0",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (
            installed
            / "dist"
            / "index.js"
        ).write_text(
            "module.exports = '0.1.0';\n",
            encoding="utf-8",
        )

        MarketplaceRuntimeRegistry(
            self.registry_path
        ).write(
            {
                "inventory": MarketplaceRuntimePluginRecord(
                    plugin_id="inventory",
                    version="0.1.0",
                    install_path=str(
                        installed
                    ),
                    state=(
                        MarketplaceRuntimePluginState.ACTIVE
                    ),
                    activation_order=1,
                )
            }
        )

        self.archive_content = (
            b"inventory-0.2.0-archive"
        )
        self.archive_sha256 = hashlib.sha256(
            self.archive_content
        ).hexdigest()

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

        MarketplacePublisherKeyRegistry(
            self.publisher_registry_path
        ).register(
            self.publisher_signer
            .public_key_record()
        )

        self.release_payload = {
            "archiveSha256": (
                self.archive_sha256
            ),
            "archiveUrl": (
                "https://marketplace.example/"
                "inventory/0.2.0/plugin.tgz"
            ),
            "manifestUrl": (
                "https://marketplace.example/"
                "inventory/0.2.0/manifest.json"
            ),
            "maximumHostApi": "0.3.0",
            "minimumHostApi": "0.1.0",
            "pluginId": "inventory",
            "publisherId": "cogzidel",
            "publishedAt": (
                "2026-08-02T00:00:00Z"
            ),
            "version": "0.2.0",
            "yanked": False,
        }

        release_signature = (
            self.publisher_signer
            .sign(
                self.release_payload
            )
            .to_dict()
        )

        self.repository_index = {
            "schemaVersion": "1.0.0",
            "repository": {
                "id": "propertyos-official",
                "name": "PropertyOS Marketplace",
                "baseUrl": (
                    "https://marketplace.example"
                ),
                "generatedAt": (
                    "2026-08-02T00:00:00Z"
                ),
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
                    "summary": "Inventory plugin.",
                    "latestVersion": "0.2.0",
                    "releases": [
                        {
                            "version": "0.2.0",
                            "manifestUrl": (
                                self.release_payload[
                                    "manifestUrl"
                                ]
                            ),
                            "archiveUrl": (
                                self.release_payload[
                                    "archiveUrl"
                                ]
                            ),
                            "archiveSha256": (
                                self.archive_sha256
                            ),
                            "signature": (
                                release_signature
                            ),
                            "publishedAt": (
                                self.release_payload[
                                    "publishedAt"
                                ]
                            ),
                            "minimumHostApi": "0.1.0",
                            "maximumHostApi": "0.3.0",
                            "yanked": False,
                        }
                    ],
                }
            ],
        }

        self.signed_envelope = (
            MarketplaceRepositoryIndexSigner(
                key_id="repository-primary",
                private_key=self.repository_key,
            )
            .sign(
                self.repository_index
            )
            .envelope()
        )

    def tearDown(
        self,
    ) -> None:
        self.temporary.cleanup()

    def request(
        self,
    ) -> MarketplaceRuntimeIntegrationRequest:
        return MarketplaceRuntimeIntegrationRequest(
            plugin_id="inventory",
            installed_version="0.1.0",
            host_api_version="0.2.0",
            signed_repository_envelope=(
                self.signed_envelope
            ),
            trusted_repository_keys={
                "repository-primary": (
                    self.repository_key
                    .public_key()
                )
            },
            publisher_registry_path=(
                self.publisher_registry_path
            ),
            install_root=(
                self.install_root
            ),
            runtime_registry_path=(
                self.registry_path
            ),
            cache_root=(
                self.root
                / "cache"
            ),
            download_destination=(
                self.root
                / "download"
                / "inventory-0.2.0.tgz"
            ),
            extracted_source_root=(
                self.root
                / "extracted"
            ),
            work_root=(
                self.root
                / "work"
            ),
            journal_root=(
                self.root
                / "journals"
            ),
        )

    def fetcher(
        self,
        url: str,
        maximum_bytes: int,
    ):
        return MarketplaceDownloadResponse(
            final_url=url,
            content=self.archive_content,
        )

    def extractor(
        self,
        archive_path: Path,
        destination: Path,
    ) -> None:
        (destination / "dist").mkdir(
            parents=True
        )
        (destination / "plugin.json").write_text(
            json.dumps(
                {
                    "id": "inventory",
                    "version": "0.2.0",
                }
            )
            + "\n",
            encoding="utf-8",
        )
        (
            destination
            / "dist"
            / "index.js"
        ).write_text(
            "module.exports = '0.2.0';\n",
            encoding="utf-8",
        )

    def test_completes_repository_to_runtime_upgrade(
        self,
    ) -> None:
        result = (
            MarketplaceRuntimeIntegrationCoordinator(
                self.request(),
                fetcher=self.fetcher,
                extractor=self.extractor,
                transaction_id="integration-1",
            )
            .execute()
        )

        self.assertTrue(
            result.succeeded
        )
        self.assertEqual(
            result.target_version,
            "0.2.0",
        )

        registry = (
            MarketplaceRuntimeRegistry(
                self.registry_path
            )
            .load()
        )

        self.assertEqual(
            registry[
                "inventory"
            ].version,
            "0.2.0",
        )

    def test_rejects_untrusted_repository(
        self,
    ) -> None:
        request = self.request()

        bad = MarketplaceRuntimeIntegrationRequest(
            plugin_id=request.plugin_id,
            installed_version=(
                request.installed_version
            ),
            host_api_version=(
                request.host_api_version
            ),
            signed_repository_envelope=(
                request.signed_repository_envelope
            ),
            trusted_repository_keys={},
            publisher_registry_path=(
                request.publisher_registry_path
            ),
            install_root=request.install_root,
            runtime_registry_path=(
                request.runtime_registry_path
            ),
            cache_root=request.cache_root,
            download_destination=(
                request.download_destination
            ),
            extracted_source_root=(
                request.extracted_source_root
            ),
            work_root=request.work_root,
            journal_root=request.journal_root,
        )

        result = (
            MarketplaceRuntimeIntegrationCoordinator(
                bad,
                fetcher=self.fetcher,
                extractor=self.extractor,
                transaction_id="integration-2",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceRuntimeIntegrationState.ROLLED_BACK,
        )

    def test_rejects_missing_update(
        self,
    ) -> None:
        request = self.request()

        bad = MarketplaceRuntimeIntegrationRequest(
            plugin_id=request.plugin_id,
            installed_version="0.2.0",
            host_api_version=(
                request.host_api_version
            ),
            signed_repository_envelope=(
                request.signed_repository_envelope
            ),
            trusted_repository_keys=(
                request.trusted_repository_keys
            ),
            publisher_registry_path=(
                request.publisher_registry_path
            ),
            install_root=request.install_root,
            runtime_registry_path=(
                request.runtime_registry_path
            ),
            cache_root=request.cache_root,
            download_destination=(
                request.download_destination
            ),
            extracted_source_root=(
                request.extracted_source_root
            ),
            work_root=request.work_root,
            journal_root=request.journal_root,
        )

        result = (
            MarketplaceRuntimeIntegrationCoordinator(
                bad,
                fetcher=self.fetcher,
                extractor=self.extractor,
                transaction_id="integration-3",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceRuntimeIntegrationState.ROLLED_BACK,
        )

    def test_rejects_extracted_identity_mismatch(
        self,
    ) -> None:
        def bad_extractor(
            archive_path: Path,
            destination: Path,
        ) -> None:
            (destination / "dist").mkdir(
                parents=True
            )
            (destination / "plugin.json").write_text(
                json.dumps(
                    {
                        "id": "wrong",
                        "version": "0.2.0",
                    }
                )
                + "\n",
                encoding="utf-8",
            )
            (
                destination
                / "dist"
                / "index.js"
            ).write_text(
                "module.exports = {};\n",
                encoding="utf-8",
            )

        result = (
            MarketplaceRuntimeIntegrationCoordinator(
                self.request(),
                fetcher=self.fetcher,
                extractor=bad_extractor,
                transaction_id="integration-4",
            )
            .execute()
        )

        self.assertEqual(
            result.state,
            MarketplaceRuntimeIntegrationState.ROLLED_BACK,
        )

    def test_journal_records_commit(
        self,
    ) -> None:
        result = (
            MarketplaceRuntimeIntegrationCoordinator(
                self.request(),
                fetcher=self.fetcher,
                extractor=self.extractor,
                transaction_id="integration-5",
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
            "runtime-integration-committed",
        )


if __name__ == "__main__":
    unittest.main()
