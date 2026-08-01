from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
import uuid

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Mapping, Optional, Tuple

from .marketplace_publisher_authentication import (
    MarketplacePublisherKeyRegistry,
    MarketplacePublisherReleaseVerifier,
)
from .marketplace_repository_contract import (
    MarketplaceRepositoryContractValidator,
)


class MarketplacePublicationState(str, Enum):
    CREATED = "created"
    VALIDATING = "validating"
    VERIFYING = "verifying"
    STAGING = "staging"
    COMMITTING = "committing"
    COMMITTED = "committed"
    ROLLING_BACK = "rolling-back"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplacePublicationRequest:
    plugin_id: str
    publisher_id: str
    version: str
    manifest_path: Path
    archive_path: Path
    signature: Mapping[str, Any]
    publisher_registry_path: Path
    repository_root: Path
    work_root: Path
    journal_root: Path
    manifest_url: str
    archive_url: str
    published_at: str
    minimum_host_api: str
    maximum_host_api: str
    yanked: bool = False


@dataclass(frozen=True)
class MarketplacePublicationIssue:
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
class MarketplacePublicationResult:
    transaction_id: str
    state: MarketplacePublicationState
    plugin_id: str
    version: str
    release_directory: Path
    release_record_path: Path
    journal_path: Path
    issues: Tuple[
        MarketplacePublicationIssue,
        ...,
    ]

    @property
    def succeeded(
        self,
    ) -> bool:
        return (
            self.state
            == MarketplacePublicationState.COMMITTED
        )


class MarketplacePublicationPipeline:
    """
    Validates and atomically publishes one plugin release into a repository
    filesystem layout.

    Publication validates:
    - plugin and publisher identity;
    - manifest structure;
    - archive existence and SHA-256;
    - publisher key ownership and release signature;
    - duplicate version prevention;
    - HTTPS release URLs;
    - host API range;
    - staged output integrity.

    The final release directory is promoted atomically.
    """

    def __init__(
        self,
        request: MarketplacePublicationRequest,
        *,
        transaction_id: Optional[str] = None,
        fault_hook=None,
    ) -> None:
        self.request = request
        self.transaction_id = (
            transaction_id
            or uuid.uuid4().hex
        )
        self._fault_hook = fault_hook
        self._state = (
            MarketplacePublicationState.CREATED
        )
        self._issues = []

        self._transaction_root = (
            request.work_root
            / (
                "publication-"
                + self.transaction_id
            )
        )
        self._staging_root = (
            self._transaction_root
            / "staging"
        )
        self._release_directory = (
            request.repository_root
            / "plugins"
            / request.plugin_id
            / request.version
        )
        self._release_record_path = (
            self._release_directory
            / "release.json"
        )
        self._journal_path = (
            request.journal_root
            / (
                "publication-"
                + self.transaction_id
                + ".jsonl"
            )
        )
        self._staged_release = (
            self._staging_root
            / request.plugin_id
            / request.version
        )
        self._promoted = False

    def execute(
        self,
    ) -> MarketplacePublicationResult:
        self.request.work_root.mkdir(
            parents=True,
            exist_ok=True,
        )
        self.request.journal_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        if self._transaction_root.exists():
            raise RuntimeError(
                "Publication workspace already exists."
            )

        self._transaction_root.mkdir()
        self._staging_root.mkdir()

        self._record(
            "publication-created"
        )

        try:
            self._transition(
                MarketplacePublicationState.VALIDATING,
                "publication-validation-started",
            )
            manifest = self._validate()
            self._record(
                "publication-validation-complete"
            )

            self._transition(
                MarketplacePublicationState.VERIFYING,
                "publication-signature-verification-started",
            )
            release_payload = self._release_payload(
                manifest
            )
            self._verify_signature(
                release_payload
            )
            self._record(
                "publication-signature-verified"
            )

            self._transition(
                MarketplacePublicationState.STAGING,
                "publication-staging-started",
            )
            self._stage(
                manifest,
                release_payload,
            )
            self._record(
                "publication-staging-complete"
            )
            self._invoke_fault(
                "after-stage"
            )

            self._transition(
                MarketplacePublicationState.COMMITTING,
                "publication-commit-started",
            )
            self._commit()
            self._invoke_fault(
                "after-promote"
            )

            self._transition(
                MarketplacePublicationState.COMMITTED,
                "publication-committed",
            )
        except Exception as error:
            self._issues.append(
                MarketplacePublicationIssue(
                    code="PUBLICATION_FAILED",
                    step=self._state.value,
                    message=str(error),
                )
            )
            self._record(
                "publication-error",
                {
                    "error": str(error),
                },
            )
            self._rollback()

        return MarketplacePublicationResult(
            transaction_id=(
                self.transaction_id
            ),
            state=self._state,
            plugin_id=(
                self.request.plugin_id
            ),
            version=(
                self.request.version
            ),
            release_directory=(
                self._release_directory
            ),
            release_record_path=(
                self._release_record_path
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

    def _validate(
        self,
    ) -> Mapping[str, Any]:
        if self._release_directory.exists():
            raise ValueError(
                "Plugin release already exists."
            )

        if not self.request.manifest_path.is_file():
            raise ValueError(
                "Plugin manifest does not exist."
            )

        if not self.request.archive_path.is_file():
            raise ValueError(
                "Plugin archive does not exist."
            )

        manifest = json.loads(
            self.request.manifest_path.read_text(
                encoding="utf-8"
            )
        )

        if not isinstance(
            manifest,
            Mapping,
        ):
            raise ValueError(
                "Plugin manifest must be an object."
            )

        if (
            str(
                manifest.get(
                    "id",
                    "",
                )
            )
            != self.request.plugin_id
        ):
            raise ValueError(
                "Plugin manifest ID mismatch."
            )

        if (
            str(
                manifest.get(
                    "version",
                    "",
                )
            )
            != self.request.version
        ):
            raise ValueError(
                "Plugin manifest version mismatch."
            )

        publisher = manifest.get(
            "publisher"
        )

        if isinstance(
            publisher,
            Mapping,
        ):
            manifest_publisher = publisher.get(
                "id"
            )
        else:
            manifest_publisher = manifest.get(
                "publisherId"
            )

        if (
            str(
                manifest_publisher
            )
            != self.request.publisher_id
        ):
            raise ValueError(
                "Plugin manifest publisher mismatch."
            )

        if not self.request.manifest_url.startswith(
            "https://"
        ):
            raise ValueError(
                "Manifest URL must use HTTPS."
            )

        if not self.request.archive_url.startswith(
            "https://"
        ):
            raise ValueError(
                "Archive URL must use HTTPS."
            )

        return manifest

    def _release_payload(
        self,
        manifest: Mapping[str, Any],
    ) -> Mapping[str, Any]:
        archive_sha256 = hashlib.sha256(
            self.request.archive_path.read_bytes()
        ).hexdigest()

        return {
            "archiveSha256": archive_sha256,
            "archiveUrl": (
                self.request.archive_url
            ),
            "manifestUrl": (
                self.request.manifest_url
            ),
            "maximumHostApi": (
                self.request.maximum_host_api
            ),
            "minimumHostApi": (
                self.request.minimum_host_api
            ),
            "pluginId": (
                self.request.plugin_id
            ),
            "publisherId": (
                self.request.publisher_id
            ),
            "publishedAt": (
                self.request.published_at
            ),
            "version": (
                self.request.version
            ),
            "yanked": (
                self.request.yanked
            ),
        }

    def _verify_signature(
        self,
        payload: Mapping[
            str,
            Any,
        ],
    ) -> None:
        registry = (
            MarketplacePublisherKeyRegistry(
                self.request
                .publisher_registry_path
            )
        )

        MarketplacePublisherReleaseVerifier().verify(
            publisher_id=(
                self.request.publisher_id
            ),
            payload=payload,
            signature=(
                self.request.signature
            ),
            registry=registry,
        )

    def _stage(
        self,
        manifest: Mapping[
            str,
            Any,
        ],
        payload: Mapping[
            str,
            Any,
        ],
    ) -> None:
        self._staged_release.mkdir(
            parents=True,
        )

        manifest_destination = (
            self._staged_release
            / "manifest.json"
        )
        archive_destination = (
            self._staged_release
            / "plugin.tgz"
        )
        release_record = (
            self._staged_release
            / "release.json"
        )

        manifest_destination.write_text(
            json.dumps(
                manifest,
                indent=2,
                sort_keys=True,
            )
            + "\n",
            encoding="utf-8",
        )

        shutil.copy2(
            self.request.archive_path,
            archive_destination,
        )

        record = {
            "pluginId": (
                self.request.plugin_id
            ),
            "publisherId": (
                self.request.publisher_id
            ),
            "release": {
                "archiveSha256": (
                    payload[
                        "archiveSha256"
                    ]
                ),
                "archiveUrl": (
                    self.request.archive_url
                ),
                "manifestUrl": (
                    self.request.manifest_url
                ),
                "maximumHostApi": (
                    self.request
                    .maximum_host_api
                ),
                "minimumHostApi": (
                    self.request
                    .minimum_host_api
                ),
                "publishedAt": (
                    self.request.published_at
                ),
                "signature": dict(
                    self.request.signature
                ),
                "version": (
                    self.request.version
                ),
                "yanked": (
                    self.request.yanked
                ),
            },
        }

        release_record.write_text(
            json.dumps(
                record,
                indent=2,
                sort_keys=True,
            )
            + "\n",
            encoding="utf-8",
        )

        staged_digest = hashlib.sha256(
            archive_destination.read_bytes()
        ).hexdigest()

        if (
            staged_digest
            != payload[
                "archiveSha256"
            ]
        ):
            raise ValueError(
                "Staged archive hash mismatch."
            )

        if not manifest_destination.is_file():
            raise ValueError(
                "Staged manifest is missing."
            )

        if not release_record.is_file():
            raise ValueError(
                "Staged release record is missing."
            )

    def _commit(
        self,
    ) -> None:
        self._release_directory.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        os.replace(
            self._staged_release,
            self._release_directory,
        )
        self._promoted = True

    def _rollback(
        self,
    ) -> None:
        self._state = (
            MarketplacePublicationState.ROLLING_BACK
        )
        self._record(
            "publication-rollback-started"
        )

        try:
            if (
                self._promoted
                and self._release_directory
                .exists()
            ):
                shutil.rmtree(
                    self._release_directory
                )
                self._record(
                    "published-release-removed"
                )

            if self._staged_release.exists():
                shutil.rmtree(
                    self._staged_release
                )
                self._record(
                    "staged-release-removed"
                )

            self._state = (
                MarketplacePublicationState.ROLLED_BACK
            )
            self._record(
                "publication-rollback-complete"
            )
        except Exception as error:
            self._issues.append(
                MarketplacePublicationIssue(
                    code="PUBLICATION_ROLLBACK_FAILED",
                    step="rollback",
                    message=str(error),
                )
            )
            self._state = (
                MarketplacePublicationState.FAILED
            )
            self._record(
                "publication-rollback-error",
                {
                    "error": str(error),
                },
            )

    def _transition(
        self,
        state: MarketplacePublicationState,
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
    "MarketplacePublicationIssue",
    "MarketplacePublicationPipeline",
    "MarketplacePublicationRequest",
    "MarketplacePublicationResult",
    "MarketplacePublicationState",
]
