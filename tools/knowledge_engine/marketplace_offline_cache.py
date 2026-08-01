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
from typing import Any, Callable, Mapping, Optional, Sequence, Tuple

from .marketplace_secure_download import (
    MarketplaceDownloadResponse,
)


class MarketplaceMirrorState(str, Enum):
    CREATED = "created"
    VALIDATING = "validating"
    RESOLVING = "resolving"
    FETCHING = "fetching"
    VERIFYING = "verifying"
    CACHING = "caching"
    COMMITTED = "committed"
    ROLLING_BACK = "rolling-back"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplaceMirror:
    mirror_id: str
    base_url: str
    priority: int
    enabled: bool = True


@dataclass(frozen=True)
class MarketplaceMirrorFetchAttempt:
    mirror_id: str
    url: str
    succeeded: bool
    message: str


@dataclass(frozen=True)
class MarketplaceOfflineCacheRequest:
    plugin_id: str
    version: str
    relative_archive_path: str
    expected_sha256: str
    mirrors: Tuple[
        MarketplaceMirror,
        ...,
    ]
    cache_root: Path
    work_root: Path
    journal_root: Path
    maximum_bytes: int = 100 * 1024 * 1024
    offline_only: bool = False


@dataclass(frozen=True)
class MarketplaceOfflineCacheResult:
    transaction_id: str
    state: MarketplaceMirrorState
    cache_path: Path
    selected_mirror_id: Optional[str]
    attempts: Tuple[
        MarketplaceMirrorFetchAttempt,
        ...,
    ]
    journal_path: Path

    @property
    def succeeded(
        self,
    ) -> bool:
        return (
            self.state
            == MarketplaceMirrorState.COMMITTED
        )


class MarketplaceOfflineCacheManager:
    """
    Resolves an archive through a deterministic mirror list and stores it in
    a content-addressed offline cache.

    Rules:
    - valid cache is preferred before network access;
    - offline_only forbids network access;
    - mirrors are tried by priority then mirror ID;
    - disabled mirrors are ignored;
    - all mirror and redirect URLs must remain HTTPS;
    - exact SHA-256 and size limits are mandatory;
    - cache writes are atomic;
    - failed mirror attempts are recorded deterministically.
    """

    def __init__(
        self,
        request: MarketplaceOfflineCacheRequest,
        *,
        fetcher: Callable[
            [str, int],
            MarketplaceDownloadResponse,
        ],
        transaction_id: Optional[str] = None,
    ) -> None:
        self.request = request
        self.fetcher = fetcher
        self.transaction_id = (
            transaction_id
            or uuid.uuid4().hex
        )
        self._state = (
            MarketplaceMirrorState.CREATED
        )
        self._attempts = []
        self._selected_mirror_id = None

        self._transaction_root = (
            request.work_root
            / (
                "mirror-"
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
                "mirror-"
                + self.transaction_id
                + ".jsonl"
            )
        )

    def execute(
        self,
    ) -> MarketplaceOfflineCacheResult:
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
                "Mirror workspace already exists."
            )

        self._transaction_root.mkdir()
        self._record(
            "mirror-resolution-created"
        )

        try:
            self._transition(
                MarketplaceMirrorState.VALIDATING,
                "mirror-validation-started",
            )
            self._validate_request()
            self._record(
                "mirror-validation-complete"
            )

            if self._valid_cache():
                self._record(
                    "offline-cache-hit"
                )
                self._transition(
                    MarketplaceMirrorState.COMMITTED,
                    "mirror-resolution-committed",
                )
                return self.result()

            if self.request.offline_only:
                raise ValueError(
                    "Offline cache miss while offline_only is enabled."
                )

            self._transition(
                MarketplaceMirrorState.RESOLVING,
                "mirror-resolution-started",
            )

            mirrors = tuple(
                sorted(
                    (
                        mirror
                        for mirror in self.request.mirrors
                        if mirror.enabled
                    ),
                    key=(
                        lambda mirror: (
                            mirror.priority,
                            mirror.mirror_id,
                        )
                    ),
                )
            )

            if not mirrors:
                raise ValueError(
                    "No enabled mirrors are available."
                )

            response = None

            for mirror in mirrors:
                url = self._join_url(
                    mirror.base_url,
                    self.request.relative_archive_path,
                )

                self._transition(
                    MarketplaceMirrorState.FETCHING,
                    "mirror-fetch-started",
                )

                try:
                    candidate = self.fetcher(
                        url,
                        self.request.maximum_bytes,
                    )
                    self._validate_response(
                        candidate
                    )
                    self._verify_bytes(
                        candidate.content
                    )
                except Exception as error:
                    self._attempts.append(
                        MarketplaceMirrorFetchAttempt(
                            mirror_id=(
                                mirror.mirror_id
                            ),
                            url=url,
                            succeeded=False,
                            message=str(error),
                        )
                    )
                    self._record(
                        "mirror-fetch-failed",
                        {
                            "mirrorId": (
                                mirror.mirror_id
                            ),
                            "error": str(error),
                        },
                    )
                    continue

                self._attempts.append(
                    MarketplaceMirrorFetchAttempt(
                        mirror_id=(
                            mirror.mirror_id
                        ),
                        url=url,
                        succeeded=True,
                        message="PASS",
                    )
                )
                self._selected_mirror_id = (
                    mirror.mirror_id
                )
                response = candidate
                self._record(
                    "mirror-fetch-succeeded",
                    {
                        "mirrorId": (
                            mirror.mirror_id
                        ),
                        "bytes": len(
                            candidate.content
                        ),
                    },
                )
                break

            if response is None:
                raise ValueError(
                    "All mirrors failed."
                )

            self._staged_archive.write_bytes(
                response.content
            )

            self._transition(
                MarketplaceMirrorState.VERIFYING,
                "mirror-content-verification-started",
            )
            self._verify_path(
                self._staged_archive
            )
            self._record(
                "mirror-content-verification-complete"
            )

            self._transition(
                MarketplaceMirrorState.CACHING,
                "offline-cache-write-started",
            )
            self._write_cache_atomically()
            self._record(
                "offline-cache-write-complete"
            )

            self._transition(
                MarketplaceMirrorState.COMMITTED,
                "mirror-resolution-committed",
            )
        except Exception as error:
            self._record(
                "mirror-resolution-error",
                {
                    "error": str(error),
                },
            )
            self._rollback()

        return self.result()

    def result(
        self,
    ) -> MarketplaceOfflineCacheResult:
        return MarketplaceOfflineCacheResult(
            transaction_id=(
                self.transaction_id
            ),
            state=self._state,
            cache_path=(
                self._cache_path
            ),
            selected_mirror_id=(
                self._selected_mirror_id
            ),
            attempts=tuple(
                self._attempts
            ),
            journal_path=(
                self._journal_path
            ),
        )

    def _validate_request(
        self,
    ) -> None:
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
                "Maximum bytes must be positive."
            )

        relative = Path(
            self.request.relative_archive_path
        )

        if (
            relative.is_absolute()
            or ".." in relative.parts
            or not relative.parts
        ):
            raise ValueError(
                "Archive path must be safe and repository-relative."
            )

        mirror_ids = [
            mirror.mirror_id
            for mirror in self.request.mirrors
        ]

        if len(mirror_ids) != len(
            set(mirror_ids)
        ):
            raise ValueError(
                "Mirror IDs must be unique."
            )

        for mirror in self.request.mirrors:
            if not mirror.base_url.startswith(
                "https://"
            ):
                raise ValueError(
                    "Mirror base URL must use HTTPS."
                )

            if mirror.priority < 0:
                raise ValueError(
                    "Mirror priority must be non-negative."
                )

    def _valid_cache(
        self,
    ) -> bool:
        if not self._cache_path.is_file():
            return False

        try:
            self._verify_path(
                self._cache_path
            )
            return True
        except Exception:
            self._cache_path.unlink(
                missing_ok=True
            )
            return False

    def _validate_response(
        self,
        response: MarketplaceDownloadResponse,
    ) -> None:
        if not response.final_url.startswith(
            "https://"
        ):
            raise ValueError(
                "Mirror redirect must remain HTTPS."
            )

        if not response.content:
            raise ValueError(
                "Mirror response is empty."
            )

        if len(response.content) > (
            self.request.maximum_bytes
        ):
            raise ValueError(
                "Mirror response exceeds size limit."
            )

    def _verify_path(
        self,
        path: Path,
    ) -> None:
        self._verify_bytes(
            path.read_bytes()
        )

    def _verify_bytes(
        self,
        content: bytes,
    ) -> None:
        digest = hashlib.sha256(
            content
        ).hexdigest()

        if digest != self.request.expected_sha256:
            raise ValueError(
                "Mirror archive SHA-256 mismatch."
            )

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

            self._verify_path(
                temporary
            )
            os.replace(
                temporary,
                self._cache_path,
            )
        finally:
            if temporary.exists():
                temporary.unlink()

    def _rollback(
        self,
    ) -> None:
        self._state = (
            MarketplaceMirrorState.ROLLING_BACK
        )
        self._record(
            "mirror-resolution-rollback-started"
        )

        try:
            if self._staged_archive.exists():
                self._staged_archive.unlink()

            self._state = (
                MarketplaceMirrorState.ROLLED_BACK
            )
            self._record(
                "mirror-resolution-rollback-complete"
            )
        except Exception as error:
            self._state = (
                MarketplaceMirrorState.FAILED
            )
            self._record(
                "mirror-resolution-rollback-error",
                {
                    "error": str(error),
                },
            )

    def _transition(
        self,
        state: MarketplaceMirrorState,
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

    @staticmethod
    def _join_url(
        base_url: str,
        relative_path: str,
    ) -> str:
        return (
            base_url.rstrip("/")
            + "/"
            + relative_path.lstrip("/")
        )


__all__ = [
    "MarketplaceMirror",
    "MarketplaceMirrorFetchAttempt",
    "MarketplaceMirrorState",
    "MarketplaceOfflineCacheManager",
    "MarketplaceOfflineCacheRequest",
    "MarketplaceOfflineCacheResult",
]
