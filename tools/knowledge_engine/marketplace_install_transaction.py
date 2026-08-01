from __future__ import annotations

import json
import os
import shutil
import tempfile
import uuid

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Mapping, Sequence, Tuple


class MarketplaceInstallTransactionState(str, Enum):
    CREATED = "created"
    PREFLIGHT_PASSED = "preflight-passed"
    STAGING = "staging"
    STAGED = "staged"
    COMMITTING = "committing"
    COMMITTED = "committed"
    ROLLING_BACK = "rolling-back"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplaceInstallTransactionIssue:
    code: str
    step: str
    message: str

    def sort_key(self) -> tuple[str, str, str]:
        return (self.step, self.code, self.message)


@dataclass(frozen=True)
class MarketplaceInstallTransactionRequest:
    plugin_id: str
    version: str
    source_directory: Path
    install_root: Path
    work_root: Path
    expected_files: Tuple[str, ...] = ()
    overwrite: bool = False


@dataclass(frozen=True)
class MarketplaceInstallTransactionResult:
    transaction_id: str
    state: MarketplaceInstallTransactionState
    plugin_id: str
    version: str
    install_directory: Path
    journal_path: Path
    issues: Tuple[MarketplaceInstallTransactionIssue, ...]

    @property
    def succeeded(self) -> bool:
        return self.state == MarketplaceInstallTransactionState.COMMITTED


class MarketplaceInstallTransactionError(RuntimeError):
    pass


class MarketplaceInstallTransaction:
    """
    Filesystem transaction core for marketplace installation.

    The transaction:
    1. validates a source directory;
    2. copies it into an isolated staging directory;
    3. atomically moves any existing installation to backup;
    4. atomically promotes staging to the final installation path;
    5. restores the prior installation if commit fails;
    6. writes a deterministic JSONL journal for every state transition.

    Database migrations, runtime activation and registry mutation are
    deliberately outside this core and will be coordinated in later phases.
    """

    def __init__(
        self,
        request: MarketplaceInstallTransactionRequest,
        *,
        transaction_id: str | None = None,
        fault_hook: Callable[[str], None] | None = None,
    ) -> None:
        self.request = request
        self.transaction_id = transaction_id or uuid.uuid4().hex
        self._fault_hook = fault_hook
        self._issues: list[MarketplaceInstallTransactionIssue] = []
        self._state = MarketplaceInstallTransactionState.CREATED
        self._backup_created = False
        self._payload_promoted = False

        safe_name = f"{request.plugin_id}-{request.version}-{self.transaction_id}"
        self._transaction_root = request.work_root / safe_name
        self._staging_root = self._transaction_root / "staging"
        self._backup_root = self._transaction_root / "backup"
        self._journal_path = self._transaction_root / "journal.jsonl"
        self._install_directory = request.install_root / request.plugin_id

    def execute(self) -> MarketplaceInstallTransactionResult:
        self._prepare_transaction_root()
        self._record("transaction-created")

        try:
            self._preflight()
            self._transition(
                MarketplaceInstallTransactionState.PREFLIGHT_PASSED,
                "preflight-passed",
            )

            self._transition(
                MarketplaceInstallTransactionState.STAGING,
                "staging-started",
            )
            self._stage()
            self._transition(
                MarketplaceInstallTransactionState.STAGED,
                "staging-complete",
            )

            self._transition(
                MarketplaceInstallTransactionState.COMMITTING,
                "commit-started",
            )
            self._commit()
            self._transition(
                MarketplaceInstallTransactionState.COMMITTED,
                "commit-complete",
            )
        except Exception as error:
            self._issues.append(
                MarketplaceInstallTransactionIssue(
                    code="TRANSACTION_FAILED",
                    step=self._state.value,
                    message=str(error),
                )
            )
            self._record(
                "transaction-error",
                {"error": str(error)},
            )
            self._rollback_after_failure()

        return self.result()

    def result(self) -> MarketplaceInstallTransactionResult:
        return MarketplaceInstallTransactionResult(
            transaction_id=self.transaction_id,
            state=self._state,
            plugin_id=self.request.plugin_id,
            version=self.request.version,
            install_directory=self._install_directory,
            journal_path=self._journal_path,
            issues=tuple(sorted(self._issues, key=lambda issue: issue.sort_key())),
        )

    def _prepare_transaction_root(self) -> None:
        self.request.work_root.mkdir(parents=True, exist_ok=True)

        if self._transaction_root.exists():
            raise MarketplaceInstallTransactionError(
                f"Transaction workspace already exists: {self._transaction_root}"
            )

        self._transaction_root.mkdir(parents=False)
        self._staging_root.mkdir()
        self._backup_root.mkdir()

    def _preflight(self) -> None:
        source = self.request.source_directory

        if not source.is_dir():
            raise MarketplaceInstallTransactionError(
                f"Plugin source directory does not exist: {source}"
            )

        if source.resolve() == self._install_directory.resolve():
            raise MarketplaceInstallTransactionError(
                "Plugin source and installation directory must differ."
            )

        if self._install_directory.exists() and not self.request.overwrite:
            raise MarketplaceInstallTransactionError(
                f"Plugin is already installed: {self.request.plugin_id}"
            )

        for relative in self.request.expected_files:
            candidate = source / relative
            if not candidate.is_file():
                raise MarketplaceInstallTransactionError(
                    f"Required plugin file is missing: {relative}"
                )

        self._assert_safe_tree(source)
        self.request.install_root.mkdir(parents=True, exist_ok=True)
        self._invoke_fault("after-preflight")

    def _assert_safe_tree(self, source: Path) -> None:
        source_resolved = source.resolve()

        for path in sorted(source.rglob("*")):
            if path.is_symlink():
                raise MarketplaceInstallTransactionError(
                    f"Symbolic links are not allowed in plugin payloads: {path}"
                )

            resolved = path.resolve()
            try:
                resolved.relative_to(source_resolved)
            except ValueError as error:
                raise MarketplaceInstallTransactionError(
                    f"Plugin payload escapes its source root: {path}"
                ) from error

    def _stage(self) -> None:
        payload = self._staging_root / self.request.plugin_id

        shutil.copytree(
            self.request.source_directory,
            payload,
            copy_function=shutil.copy2,
        )

        for relative in self.request.expected_files:
            if not (payload / relative).is_file():
                raise MarketplaceInstallTransactionError(
                    f"Staged plugin is missing required file: {relative}"
                )

        self._invoke_fault("after-stage")

    def _commit(self) -> None:
        staged_payload = self._staging_root / self.request.plugin_id
        backup_payload = self._backup_root / self.request.plugin_id

        if self._install_directory.exists():
            os.replace(
                self._install_directory,
                backup_payload,
            )
            self._backup_created = True
            self._record(
                "existing-installation-backed-up",
                {"backup": str(backup_payload)},
            )

        self._invoke_fault("after-backup")

        try:
            os.replace(
                staged_payload,
                self._install_directory,
            )
            self._payload_promoted = True
        except Exception:
            if backup_payload.exists() and not self._install_directory.exists():
                os.replace(
                    backup_payload,
                    self._install_directory,
                )
                self._record(
                    "backup-restored-during-commit",
                    {"installDirectory": str(self._install_directory)},
                )
            raise

        self._invoke_fault("after-promote")

    def _rollback_after_failure(self) -> None:
        previous_state = self._state
        self._state = MarketplaceInstallTransactionState.ROLLING_BACK
        self._record(
            "rollback-started",
            {"failedState": previous_state.value},
        )

        backup_payload = self._backup_root / self.request.plugin_id

        try:
            if (
                self._payload_promoted
                and self._install_directory.exists()
            ):
                shutil.rmtree(self._install_directory)
                self._record(
                    "partial-installation-removed",
                    {"installDirectory": str(self._install_directory)},
                )

            if (
                self._backup_created
                and backup_payload.exists()
            ):
                os.replace(
                    backup_payload,
                    self._install_directory,
                )
                self._record(
                    "backup-restored",
                    {"installDirectory": str(self._install_directory)},
                )

            self._state = MarketplaceInstallTransactionState.ROLLED_BACK
            self._record("rollback-complete")
        except Exception as rollback_error:
            self._issues.append(
                MarketplaceInstallTransactionIssue(
                    code="ROLLBACK_FAILED",
                    step="rollback",
                    message=str(rollback_error),
                )
            )
            self._state = MarketplaceInstallTransactionState.FAILED
            self._record(
                "rollback-error",
                {"error": str(rollback_error)},
            )

    def _transition(
        self,
        state: MarketplaceInstallTransactionState,
        event: str,
    ) -> None:
        self._state = state
        self._record(event)

    def _record(
        self,
        event: str,
        details: Mapping[str, Any] | None = None,
    ) -> None:
        record = {
            "event": event,
            "pluginId": self.request.plugin_id,
            "state": self._state.value,
            "transactionId": self.transaction_id,
            "version": self.request.version,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if details:
            record["details"] = dict(details)

        with self._journal_path.open("a", encoding="utf-8") as stream:
            stream.write(
                json.dumps(
                    record,
                    sort_keys=True,
                    separators=(",", ":"),
                )
                + "\n"
            )
            stream.flush()
            os.fsync(stream.fileno())

    def _invoke_fault(self, point: str) -> None:
        if self._fault_hook is not None:
            self._fault_hook(point)


__all__ = [
    "MarketplaceInstallTransaction",
    "MarketplaceInstallTransactionError",
    "MarketplaceInstallTransactionIssue",
    "MarketplaceInstallTransactionRequest",
    "MarketplaceInstallTransactionResult",
    "MarketplaceInstallTransactionState",
]
