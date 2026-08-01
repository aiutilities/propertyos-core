from __future__ import annotations

import json
import os
import uuid

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Mapping, Optional, Tuple

from .marketplace_repository_index import (
    MarketplaceRepositoryIndexVerifier,
)
from .marketplace_secure_download import (
    MarketplaceDownloadRequest,
    MarketplaceDownloadResponse,
    MarketplaceSecureDownloadManager,
)
from .marketplace_update_discovery import (
    MarketplaceInstalledPlugin,
    MarketplaceUpdateCandidate,
    MarketplaceUpdateDiscoveryEngine,
    MarketplaceUpdateDiscoveryRequest,
)
from .marketplace_upgrade_coordinator import (
    MarketplaceUpgradeCoordinator,
    MarketplaceUpgradeRequest,
)


class MarketplaceRuntimeIntegrationState(str, Enum):
    CREATED = "created"
    VERIFYING_REPOSITORY = "verifying-repository"
    DISCOVERING_UPDATE = "discovering-update"
    DOWNLOADING = "downloading"
    PREPARING_SOURCE = "preparing-source"
    UPGRADING = "upgrading"
    COMMITTED = "committed"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplaceRuntimeIntegrationRequest:
    plugin_id: str
    installed_version: str
    host_api_version: str
    signed_repository_envelope: Mapping[str, Any]
    trusted_repository_keys: Mapping[str, Any]
    publisher_registry_path: Path
    install_root: Path
    runtime_registry_path: Path
    cache_root: Path
    download_destination: Path
    extracted_source_root: Path
    work_root: Path
    journal_root: Path
    maximum_download_bytes: int = 100 * 1024 * 1024
    allow_major: bool = True
    allow_minor: bool = True
    allow_patch: bool = True


@dataclass(frozen=True)
class MarketplaceRuntimeIntegrationIssue:
    code: str
    step: str
    message: str

    def sort_key(
        self,
    ) -> Tuple[str, str, str]:
        return (
            self.step,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplaceRuntimeIntegrationResult:
    transaction_id: str
    state: MarketplaceRuntimeIntegrationState
    plugin_id: str
    installed_version: str
    target_version: Optional[str]
    download_path: Path
    journal_path: Path
    issues: Tuple[
        MarketplaceRuntimeIntegrationIssue,
        ...,
    ]

    @property
    def succeeded(
        self,
    ) -> bool:
        return (
            self.state
            == MarketplaceRuntimeIntegrationState.COMMITTED
        )


class MarketplaceRuntimeIntegrationCoordinator:
    """
    Connects the certified repository subsystem to the certified runtime
    upgrade subsystem for one plugin.

    Flow:
    1. verify the signed repository index;
    2. discover the highest policy-eligible update;
    3. securely download and verify the publisher-signed archive;
    4. prepare an extracted source through an injected extraction boundary;
    5. execute the D5 upgrade transaction;
    6. return one deterministic integration result.
    """

    def __init__(
        self,
        request: MarketplaceRuntimeIntegrationRequest,
        *,
        fetcher: Callable[
            [str, int],
            MarketplaceDownloadResponse,
        ],
        extractor: Callable[
            [Path, Path],
            None,
        ],
        transaction_id: Optional[str] = None,
        deactivate_hook=None,
        activate_hook=None,
        health_hook=None,
        fault_hook=None,
    ) -> None:
        self.request = request
        self.fetcher = fetcher
        self.extractor = extractor
        self.transaction_id = (
            transaction_id
            or uuid.uuid4().hex
        )
        self._deactivate_hook = deactivate_hook
        self._activate_hook = activate_hook
        self._health_hook = health_hook
        self._fault_hook = fault_hook
        self._state = (
            MarketplaceRuntimeIntegrationState.CREATED
        )
        self._issues = []
        self._target_version = None

        self._transaction_root = (
            request.work_root
            / (
                "runtime-integration-"
                + self.transaction_id
            )
        )
        self._source_root = (
            request.extracted_source_root
            / request.plugin_id
        )
        self._journal_path = (
            request.journal_root
            / (
                "runtime-integration-"
                + self.transaction_id
                + ".jsonl"
            )
        )

    def execute(
        self,
    ) -> MarketplaceRuntimeIntegrationResult:
        self.request.work_root.mkdir(
            parents=True,
            exist_ok=True,
        )
        self.request.journal_root.mkdir(
            parents=True,
            exist_ok=True,
        )
        self.request.extracted_source_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        if self._transaction_root.exists():
            raise RuntimeError(
                "Runtime integration workspace already exists."
            )

        self._transaction_root.mkdir()
        self._record(
            "runtime-integration-created"
        )

        try:
            self._transition(
                MarketplaceRuntimeIntegrationState.VERIFYING_REPOSITORY,
                "repository-verification-started",
            )

            repository_index = (
                MarketplaceRepositoryIndexVerifier()
                .verify(
                    self.request
                    .signed_repository_envelope,
                    trusted_keys=(
                        self.request
                        .trusted_repository_keys
                    ),
                )
            )

            self._record(
                "repository-verification-complete"
            )
            self._invoke_fault(
                "after-repository-verification"
            )

            self._transition(
                MarketplaceRuntimeIntegrationState.DISCOVERING_UPDATE,
                "update-discovery-started",
            )

            discovery = (
                MarketplaceUpdateDiscoveryEngine()
                .discover(
                    MarketplaceUpdateDiscoveryRequest(
                        installed_plugins=(
                            MarketplaceInstalledPlugin(
                                plugin_id=(
                                    self.request.plugin_id
                                ),
                                version=(
                                    self.request
                                    .installed_version
                                ),
                            ),
                        ),
                        repository_index=(
                            repository_index
                        ),
                        host_api_version=(
                            self.request
                            .host_api_version
                        ),
                        include_yanked=False,
                        allow_major=(
                            self.request.allow_major
                        ),
                        allow_minor=(
                            self.request.allow_minor
                        ),
                        allow_patch=(
                            self.request.allow_patch
                        ),
                    )
                )
            )

            candidate = self._select_candidate(
                discovery.updates
            )
            self._target_version = (
                candidate.target_version
            )

            self._record(
                "update-discovery-complete",
                {
                    "targetVersion": (
                        candidate.target_version
                    ),
                    "updateKind": (
                        candidate.update_kind.value
                    ),
                },
            )

            self._transition(
                MarketplaceRuntimeIntegrationState.DOWNLOADING,
                "secure-download-started",
            )

            release_payload = self._release_payload(
                candidate,
                repository_index,
            )

            download_result = (
                MarketplaceSecureDownloadManager(
                    MarketplaceDownloadRequest(
                        plugin_id=(
                            candidate.plugin_id
                        ),
                        publisher_id=(
                            candidate.publisher_id
                        ),
                        version=(
                            candidate.target_version
                        ),
                        archive_url=(
                            candidate.archive_url
                        ),
                        expected_sha256=(
                            candidate.archive_sha256
                        ),
                        release_payload=(
                            release_payload
                        ),
                        release_signature=(
                            candidate.signature
                        ),
                        publisher_registry_path=(
                            self.request
                            .publisher_registry_path
                        ),
                        cache_root=(
                            self.request.cache_root
                        ),
                        destination_path=(
                            self.request
                            .download_destination
                        ),
                        work_root=(
                            self._transaction_root
                            / "download"
                        ),
                        journal_root=(
                            self.request
                            .journal_root
                        ),
                        maximum_bytes=(
                            self.request
                            .maximum_download_bytes
                        ),
                    ),
                    fetcher=self.fetcher,
                    transaction_id=(
                        self.transaction_id
                        + "-download"
                    ),
                )
                .execute()
            )

            if not download_result.succeeded:
                raise RuntimeError(
                    "Secure download did not commit."
                )

            self._record(
                "secure-download-complete",
                {
                    "path": str(
                        download_result
                        .destination_path
                    ),
                },
            )
            self._invoke_fault(
                "after-download"
            )

            self._transition(
                MarketplaceRuntimeIntegrationState.PREPARING_SOURCE,
                "source-preparation-started",
            )

            if self._source_root.exists():
                raise ValueError(
                    "Extracted source destination already exists."
                )

            self.extractor(
                download_result.destination_path,
                self._source_root,
            )

            self._validate_extracted_source(
                candidate
            )

            self._record(
                "source-preparation-complete"
            )
            self._invoke_fault(
                "after-source-preparation"
            )

            self._transition(
                MarketplaceRuntimeIntegrationState.UPGRADING,
                "runtime-upgrade-started",
            )

            upgrade_result = (
                MarketplaceUpgradeCoordinator(
                    MarketplaceUpgradeRequest(
                        plugin_id=(
                            candidate.plugin_id
                        ),
                        target_version=(
                            candidate.target_version
                        ),
                        source_directory=(
                            self._source_root
                        ),
                        install_root=(
                            self.request.install_root
                        ),
                        work_root=(
                            self._transaction_root
                            / "upgrade"
                        ),
                        registry_path=(
                            self.request
                            .runtime_registry_path
                        ),
                        journal_root=(
                            self.request
                            .journal_root
                        ),
                    ),
                    transaction_id=(
                        self.transaction_id
                        + "-upgrade"
                    ),
                    deactivate_hook=(
                        self._deactivate_hook
                    ),
                    activate_hook=(
                        self._activate_hook
                    ),
                    health_hook=(
                        self._health_hook
                    ),
                )
                .execute()
            )

            if not upgrade_result.succeeded:
                raise RuntimeError(
                    "Runtime upgrade did not commit."
                )

            self._record(
                "runtime-upgrade-complete"
            )

            self._transition(
                MarketplaceRuntimeIntegrationState.COMMITTED,
                "runtime-integration-committed",
            )
        except Exception as error:
            self._issues.append(
                MarketplaceRuntimeIntegrationIssue(
                    code="RUNTIME_INTEGRATION_FAILED",
                    step=self._state.value,
                    message=str(error),
                )
            )
            self._record(
                "runtime-integration-error",
                {
                    "error": str(error),
                },
            )
            self._state = (
                MarketplaceRuntimeIntegrationState.ROLLED_BACK
            )
            self._record(
                "runtime-integration-rolled-back"
            )

        return MarketplaceRuntimeIntegrationResult(
            transaction_id=(
                self.transaction_id
            ),
            state=self._state,
            plugin_id=(
                self.request.plugin_id
            ),
            installed_version=(
                self.request.installed_version
            ),
            target_version=(
                self._target_version
            ),
            download_path=(
                self.request
                .download_destination
            ),
            journal_path=(
                self._journal_path
            ),
            issues=tuple(
                sorted(
                    self._issues,
                    key=(
                        lambda issue:
                        issue.sort_key()
                    ),
                )
            ),
        )

    @staticmethod
    def _select_candidate(
        updates: Tuple[
            MarketplaceUpdateCandidate,
            ...,
        ],
    ) -> MarketplaceUpdateCandidate:
        if not updates:
            raise ValueError(
                "No eligible plugin update is available."
            )

        if len(updates) != 1:
            raise ValueError(
                "Expected exactly one plugin update."
            )

        return updates[
            0
        ]

    @staticmethod
    def _release_payload(
        candidate: MarketplaceUpdateCandidate,
        repository_index: Mapping[
            str,
            Any,
        ],
    ) -> Mapping[str, Any]:
        plugin = next(
            item
            for item in repository_index[
                "plugins"
            ]
            if item[
                "id"
            ] == candidate.plugin_id
        )

        release = next(
            item
            for item in plugin[
                "releases"
            ]
            if item[
                "version"
            ] == candidate.target_version
        )

        return {
            "archiveSha256": (
                release[
                    "archiveSha256"
                ]
            ),
            "archiveUrl": (
                release[
                    "archiveUrl"
                ]
            ),
            "manifestUrl": (
                release[
                    "manifestUrl"
                ]
            ),
            "maximumHostApi": (
                release[
                    "maximumHostApi"
                ]
            ),
            "minimumHostApi": (
                release[
                    "minimumHostApi"
                ]
            ),
            "pluginId": (
                candidate.plugin_id
            ),
            "publisherId": (
                candidate.publisher_id
            ),
            "publishedAt": (
                release[
                    "publishedAt"
                ]
            ),
            "version": (
                candidate.target_version
            ),
            "yanked": (
                release[
                    "yanked"
                ]
            ),
        }

    def _validate_extracted_source(
        self,
        candidate: MarketplaceUpdateCandidate,
    ) -> None:
        manifest_path = (
            self._source_root
            / "plugin.json"
        )
        entrypoint = (
            self._source_root
            / "dist"
            / "index.js"
        )

        if not manifest_path.is_file():
            raise ValueError(
                "Extracted plugin manifest is missing."
            )

        if not entrypoint.is_file():
            raise ValueError(
                "Extracted runtime entrypoint is missing."
            )

        manifest = json.loads(
            manifest_path.read_text(
                encoding="utf-8"
            )
        )

        if (
            manifest.get(
                "id"
            )
            != candidate.plugin_id
        ):
            raise ValueError(
                "Extracted plugin ID mismatch."
            )

        if (
            manifest.get(
                "version"
            )
            != candidate.target_version
        ):
            raise ValueError(
                "Extracted plugin version mismatch."
            )

    def _transition(
        self,
        state: MarketplaceRuntimeIntegrationState,
        event: str,
    ) -> None:
        self._state = state
        self._record(
            event
        )

    def _record(
        self,
        event: str,
        details: Optional[
            Mapping[str, Any]
        ] = None,
    ) -> None:
        record = {
            "event": event,
            "state": self._state.value,
            "timestamp": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
            "transactionId": (
                self.transaction_id
            ),
        }

        if details:
            record["details"] = dict(
                details
            )

        with self._journal_path.open(
            "a",
            encoding="utf-8",
        ) as stream:
            stream.write(
                json.dumps(
                    record,
                    sort_keys=True,
                    separators=(
                        ",",
                        ":",
                    ),
                )
                + "\n"
            )
            stream.flush()
            os.fsync(
                stream.fileno()
            )

    def _invoke_fault(
        self,
        point: str,
    ) -> None:
        if self._fault_hook is not None:
            self._fault_hook(
                point
            )


__all__ = [
    "MarketplaceRuntimeIntegrationCoordinator",
    "MarketplaceRuntimeIntegrationIssue",
    "MarketplaceRuntimeIntegrationRequest",
    "MarketplaceRuntimeIntegrationResult",
    "MarketplaceRuntimeIntegrationState",
]
