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
from typing import Any, Callable, Mapping, Optional, Tuple

from .marketplace_publisher_authentication import (
    MarketplacePublisherKeyRegistry,
    MarketplacePublisherReleaseVerifier,
)


class MarketplaceDownloadState(str, Enum):
    CREATED = "created"
    VALIDATING = "validating"
    DOWNLOADING = "downloading"
    VERIFYING = "verifying"
    CACHING = "caching"
    COMMITTING = "committing"
    COMMITTED = "committed"
    ROLLING_BACK = "rolling-back"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplaceDownloadResponse:
    final_url: str
    content: bytes
    content_type: str = "application/octet-stream"


@dataclass(frozen=True)
class MarketplaceDownloadRequest:
    plugin_id: str
    publisher_id: str
    version: str
    archive_url: str
    expected_sha256: str
    release_payload: Mapping[str, Any]
    release_signature: Mapping[str, Any]
    publisher_registry_path: Path
    cache_root: Path
    destination_path: Path
    work_root: Path
    journal_root: Path
    maximum_bytes: int = 100 * 1024 * 1024


@dataclass(frozen=True)
class MarketplaceDownloadIssue:
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
class MarketplaceDownloadResult:
    transaction_id: str
    state: MarketplaceDownloadState
    plugin_id: str
    version: str
    cache_path: Path
    destination_path: Path
    journal_path: Path
    issues: Tuple[
        MarketplaceDownloadIssue,
        ...,
    ]

    @property
    def succeeded(
        self,
    ) -> bool:
        return (
            self.state
            == MarketplaceDownloadState.COMMITTED
        )


class MarketplaceSecureDownloadManager:
    """
    Securely acquires one publisher-signed marketplace archive.

    Network transport is injected through a fetcher callback so the manager
    can be tested without external network access and later integrated with a
    host-specific HTTP client.

    Security gates:
    - HTTPS initial URL;
    - HTTPS final URL after redirects;
    - strict maximum response size;
    - exact SHA-256 verification;
    - publisher signature verification;
    - release identity consistency;
    - atomic cache write;
    - atomic destination handoff;
    - rollback of transaction-owned output.
    """

    def __init__(
        self,
        request: MarketplaceDownloadRequest,
        *,
        fetcher: Callable[
            [str, int],
            MarketplaceDownloadResponse,
        ],
        transaction_id: Optional[str] = None,
        fault_hook: Optional[
            Callable[[str], None]
        ] = None,
    ) -> None:
        self.request = request
        self.fetcher = fetcher
        self.transaction_id = (
            transaction_id
            or uuid.uuid4().hex
        )
        self._fault_hook = fault_hook
        self._state = (
            MarketplaceDownloadState.CREATED
        )
        self._issues = []
        self._destination_created = False
        self._cache_created = False

        self._transaction_root = (
            request.work_root
            / (
                "download-"
                + self.transaction_id
            )
        )
        self._staged_archive = (
            self._transaction_root
            / "plugin.tgz"
        )
        self._cache_path = (
            request.cache_root
            / request.expected_sha256[
                0:2
            ]
            / (
                request.expected_sha256
                + ".tgz"
            )
        )
        self._journal_path = (
            request.journal_root
            / (
                "download-"
                + self.transaction_id
                + ".jsonl"
            )
        )

    def execute(
        self,
    ) -> MarketplaceDownloadResult:
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
                "Download workspace already exists."
            )

        self._transaction_root.mkdir()
        self._record(
            "download-created"
        )

        try:
            self._transition(
                MarketplaceDownloadState.VALIDATING,
                "download-validation-started",
            )
            self._validate_request()
            self._record(
                "download-validation-complete"
            )

            if self._valid_cached_archive():
                self._record(
                    "download-cache-hit"
                )
            else:
                self._transition(
                    MarketplaceDownloadState.DOWNLOADING,
                    "download-started",
                )
                response = self.fetcher(
                    self.request.archive_url,
                    self.request.maximum_bytes,
                )
                self._validate_response(
                    response
                )
                self._staged_archive.write_bytes(
                    response.content
                )
                self._record(
                    "download-complete",
                    {
                        "bytes": len(
                            response.content
                        ),
                        "finalUrl": (
                            response.final_url
                        ),
                    },
                )

                self._transition(
                    MarketplaceDownloadState.VERIFYING,
                    "download-verification-started",
                )
                self._verify_archive(
                    self._staged_archive
                )
                self._verify_publisher_signature()
                self._record(
                    "download-verification-complete"
                )

                self._transition(
                    MarketplaceDownloadState.CACHING,
                    "download-cache-write-started",
                )
                self._write_cache_atomically()
                self._record(
                    "download-cache-write-complete"
                )

            self._invoke_fault(
                "after-cache"
            )

            self._transition(
                MarketplaceDownloadState.COMMITTING,
                "download-handoff-started",
            )
            self._handoff_atomically()
            self._invoke_fault(
                "after-handoff"
            )

            self._transition(
                MarketplaceDownloadState.COMMITTED,
                "download-committed",
            )
        except Exception as error:
            self._issues.append(
                MarketplaceDownloadIssue(
                    code="DOWNLOAD_FAILED",
                    step=self._state.value,
                    message=str(error),
                )
            )
            self._record(
                "download-error",
                {
                    "error": str(error),
                },
            )
            self._rollback()

        return MarketplaceDownloadResult(
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
            cache_path=(
                self._cache_path
            ),
            destination_path=(
                self.request.destination_path
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

    def _validate_request(
        self,
    ) -> None:
        if not self.request.archive_url.startswith(
            "https://"
        ):
            raise ValueError(
                "Archive URL must use HTTPS."
            )

        if (
            len(
                self.request.expected_sha256
            )
            != 64
            or any(
                character
                not in "0123456789abcdef"
                for character
                in self.request.expected_sha256
            )
        ):
            raise ValueError(
                "Expected SHA-256 is invalid."
            )

        if self.request.maximum_bytes <= 0:
            raise ValueError(
                "Maximum download size must be positive."
            )

        payload = self.request.release_payload

        expected = {
            "pluginId": self.request.plugin_id,
            "publisherId": self.request.publisher_id,
            "version": self.request.version,
            "archiveUrl": self.request.archive_url,
            "archiveSha256": (
                self.request.expected_sha256
            ),
        }

        for name, value in expected.items():
            if payload.get(name) != value:
                raise ValueError(
                    "Release payload mismatch: "
                    + name
                )

        if self.request.destination_path.exists():
            raise ValueError(
                "Download destination already exists."
            )

    def _validate_response(
        self,
        response: MarketplaceDownloadResponse,
    ) -> None:
        if not response.final_url.startswith(
            "https://"
        ):
            raise ValueError(
                "Redirected archive URL must use HTTPS."
            )

        if len(response.content) > (
            self.request.maximum_bytes
        ):
            raise ValueError(
                "Downloaded archive exceeds size limit."
            )

        if not response.content:
            raise ValueError(
                "Downloaded archive is empty."
            )

    def _verify_archive(
        self,
        path: Path,
    ) -> None:
        digest = hashlib.sha256(
            path.read_bytes()
        ).hexdigest()

        if digest != self.request.expected_sha256:
            raise ValueError(
                "Downloaded archive SHA-256 mismatch."
            )

    def _verify_publisher_signature(
        self,
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
            payload=(
                self.request.release_payload
            ),
            signature=(
                self.request.release_signature
            ),
            registry=registry,
        )

    def _valid_cached_archive(
        self,
    ) -> bool:
        if not self._cache_path.is_file():
            return False

        try:
            self._verify_archive(
                self._cache_path
            )
            self._verify_publisher_signature()
            return True
        except Exception:
            self._cache_path.unlink(
                missing_ok=True
            )
            return False

    def _write_cache_atomically(
        self,
    ) -> None:
        self._cache_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        descriptor, temporary_name = tempfile.mkstemp(
            prefix=(
                self._cache_path.name
                + "."
            ),
            suffix=".tmp",
            dir=str(
                self._cache_path.parent
            ),
        )
        temporary = Path(
            temporary_name
        )

        try:
            with os.fdopen(
                descriptor,
                "wb",
            ) as stream:
                stream.write(
                    self._staged_archive.read_bytes()
                )
                stream.flush()
                os.fsync(
                    stream.fileno()
                )

            self._verify_archive(
                temporary
            )
            os.replace(
                temporary,
                self._cache_path,
            )
            self._cache_created = True
        finally:
            if temporary.exists():
                temporary.unlink()

    def _handoff_atomically(
        self,
    ) -> None:
        self.request.destination_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        descriptor, temporary_name = tempfile.mkstemp(
            prefix=(
                self.request
                .destination_path
                .name
                + "."
            ),
            suffix=".tmp",
            dir=str(
                self.request
                .destination_path
                .parent
            ),
        )
        temporary = Path(
            temporary_name
        )

        try:
            with os.fdopen(
                descriptor,
                "wb",
            ) as stream:
                stream.write(
                    self._cache_path.read_bytes()
                )
                stream.flush()
                os.fsync(
                    stream.fileno()
                )

            self._verify_archive(
                temporary
            )
            os.replace(
                temporary,
                self.request.destination_path,
            )
            self._destination_created = True
        finally:
            if temporary.exists():
                temporary.unlink()

    def _rollback(
        self,
    ) -> None:
        self._state = (
            MarketplaceDownloadState.ROLLING_BACK
        )
        self._record(
            "download-rollback-started"
        )

        try:
            if (
                self._destination_created
                and self.request
                .destination_path
                .exists()
            ):
                self.request.destination_path.unlink()
                self._record(
                    "download-destination-removed"
                )

            if self._staged_archive.exists():
                self._staged_archive.unlink()
                self._record(
                    "download-staging-removed"
                )

            self._state = (
                MarketplaceDownloadState.ROLLED_BACK
            )
            self._record(
                "download-rollback-complete"
            )
        except Exception as error:
            self._issues.append(
                MarketplaceDownloadIssue(
                    code="DOWNLOAD_ROLLBACK_FAILED",
                    step="rollback",
                    message=str(error),
                )
            )
            self._state = (
                MarketplaceDownloadState.FAILED
            )
            self._record(
                "download-rollback-error",
                {
                    "error": str(error),
                },
            )

    def _transition(
        self,
        state: MarketplaceDownloadState,
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
    "MarketplaceDownloadIssue",
    "MarketplaceDownloadRequest",
    "MarketplaceDownloadResponse",
    "MarketplaceDownloadResult",
    "MarketplaceDownloadState",
    "MarketplaceSecureDownloadManager",
]
