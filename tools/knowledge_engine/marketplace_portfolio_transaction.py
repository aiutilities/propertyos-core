from __future__ import annotations

import json
import os
import shutil
import uuid

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Callable, Mapping, Sequence, Tuple

from .marketplace_install_transaction import (
    MarketplaceInstallTransaction,
    MarketplaceInstallTransactionRequest,
    MarketplaceInstallTransactionResult,
)


class MarketplacePortfolioTransactionState(str, Enum):
    CREATED = "created"
    PREFLIGHT_PASSED = "preflight-passed"
    INSTALLING = "installing"
    STAGED = "staged"
    COMMITTING = "committing"
    COMMITTED = "committed"
    ROLLING_BACK = "rolling-back"
    ROLLED_BACK = "rolled-back"
    FAILED = "failed"


@dataclass(frozen=True)
class MarketplacePortfolioInstallItem:
    sequence: int
    plugin_id: str
    version: str
    dependencies: Tuple[str, ...] = ()
    expected_files: Tuple[str, ...] = (
        "plugin.json",
        "dist/index.js",
    )


@dataclass(frozen=True)
class MarketplacePortfolioTransactionRequest:
    install_items: Tuple[
        MarketplacePortfolioInstallItem,
        ...,
    ]
    source_directories: Mapping[
        str,
        Path,
    ]
    install_root: Path
    work_root: Path
    overwrite: bool = False


@dataclass(frozen=True)
class MarketplacePortfolioTransactionIssue:
    code: str
    plugin_id: str
    step: str
    message: str

    def sort_key(
        self,
    ) -> tuple[str, str, str, str]:
        return (
            self.step,
            self.plugin_id,
            self.code,
            self.message,
        )


@dataclass(frozen=True)
class MarketplacePortfolioTransactionResult:
    transaction_id: str
    state: MarketplacePortfolioTransactionState
    install_root: Path
    journal_path: Path
    plugin_results: Tuple[
        MarketplaceInstallTransactionResult,
        ...,
    ]
    issues: Tuple[
        MarketplacePortfolioTransactionIssue,
        ...,
    ]

    @property
    def succeeded(self) -> bool:
        return (
            self.state
            == MarketplacePortfolioTransactionState.COMMITTED
        )


class MarketplacePortfolioTransactionError(
    RuntimeError
):
    pass


class MarketplacePortfolioTransactionCoordinator:
    """
    Coordinates an entire admitted plugin portfolio as one filesystem
    transaction.

    Each plugin is first installed into a portfolio candidate root by the
    existing single-plugin transaction engine. Only after every plugin
    transaction succeeds is the complete candidate root atomically promoted
    to the live portfolio root.

    Existing live content is moved to a backup before promotion and restored
    when commit fails.
    """

    def __init__(
        self,
        request: MarketplacePortfolioTransactionRequest,
        *,
        transaction_id: str | None = None,
        fault_hook: Callable[
            [str, str | None],
            None,
        ]
        | None = None,
    ) -> None:
        self.request = request
        self.transaction_id = (
            transaction_id
            or uuid.uuid4().hex
        )
        self._fault_hook = fault_hook
        self._state = (
            MarketplacePortfolioTransactionState.CREATED
        )
        self._issues: list[
            MarketplacePortfolioTransactionIssue
        ] = []
        self._plugin_results: list[
            MarketplaceInstallTransactionResult
        ] = []

        name = (
            f"portfolio-{self.transaction_id}"
        )

        self._transaction_root = (
            request.work_root
            / name
        )
        self._candidate_root = (
            self._transaction_root
            / "candidate"
        )
        self._plugin_work_root = (
            self._transaction_root
            / "plugin-transactions"
        )
        self._backup_root = (
            self._transaction_root
            / "live-backup"
        )
        self._journal_path = (
            self._transaction_root
            / "journal.jsonl"
        )

        self._backup_created = False
        self._candidate_promoted = False

    def execute(
        self,
    ) -> MarketplacePortfolioTransactionResult:
        self._prepare_workspace()
        self._record(
            "portfolio-transaction-created"
        )

        try:
            self._preflight()
            self._transition(
                MarketplacePortfolioTransactionState.PREFLIGHT_PASSED,
                "portfolio-preflight-passed",
            )

            self._transition(
                MarketplacePortfolioTransactionState.INSTALLING,
                "portfolio-installation-started",
            )

            self._install_candidate_portfolio()

            self._transition(
                MarketplacePortfolioTransactionState.STAGED,
                "portfolio-staging-complete",
            )

            self._transition(
                MarketplacePortfolioTransactionState.COMMITTING,
                "portfolio-commit-started",
            )

            self._commit()

            self._transition(
                MarketplacePortfolioTransactionState.COMMITTED,
                "portfolio-commit-complete",
            )
        except Exception as error:
            self._issues.append(
                MarketplacePortfolioTransactionIssue(
                    code="PORTFOLIO_TRANSACTION_FAILED",
                    plugin_id="",
                    step=self._state.value,
                    message=str(error),
                )
            )
            self._record(
                "portfolio-transaction-error",
                {
                    "error": str(error),
                },
            )
            self._rollback()

        return self.result()

    def result(
        self,
    ) -> MarketplacePortfolioTransactionResult:
        return MarketplacePortfolioTransactionResult(
            transaction_id=(
                self.transaction_id
            ),
            state=self._state,
            install_root=(
                self.request.install_root
            ),
            journal_path=(
                self._journal_path
            ),
            plugin_results=tuple(
                self._plugin_results
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

    def _prepare_workspace(
        self,
    ) -> None:
        self.request.work_root.mkdir(
            parents=True,
            exist_ok=True,
        )

        if self._transaction_root.exists():
            raise MarketplacePortfolioTransactionError(
                "Portfolio transaction workspace "
                "already exists: "
                f"{self._transaction_root}"
            )

        self._transaction_root.mkdir()
        self._candidate_root.mkdir()
        self._plugin_work_root.mkdir()

    def _preflight(
        self,
    ) -> None:
        items = tuple(
            sorted(
                self.request.install_items,
                key=(
                    lambda item:
                    item.sequence
                ),
            )
        )

        if not items:
            raise MarketplacePortfolioTransactionError(
                "Portfolio install plan is empty."
            )

        sequences = tuple(
            item.sequence
            for item in items
        )

        expected_sequences = tuple(
            range(
                1,
                len(items) + 1,
            )
        )

        if sequences != expected_sequences:
            raise MarketplacePortfolioTransactionError(
                "Portfolio install sequences must "
                "be contiguous from 1."
            )

        plugin_ids = tuple(
            item.plugin_id
            for item in items
        )

        if len(plugin_ids) != len(
            set(plugin_ids)
        ):
            raise MarketplacePortfolioTransactionError(
                "Portfolio install plan contains "
                "duplicate plugin IDs."
            )

        position = {
            plugin_id: index
            for index, plugin_id
            in enumerate(plugin_ids)
        }

        for item in items:
            source = (
                self.request
                .source_directories
                .get(
                    item.plugin_id
                )
            )

            if source is None:
                raise MarketplacePortfolioTransactionError(
                    "Missing source directory for "
                    f"{item.plugin_id}."
                )

            if not source.is_dir():
                raise MarketplacePortfolioTransactionError(
                    "Source directory does not "
                    f"exist for {item.plugin_id}: "
                    f"{source}"
                )

            for dependency in (
                item.dependencies
            ):
                if dependency not in position:
                    raise MarketplacePortfolioTransactionError(
                        f"{item.plugin_id} depends on "
                        f"missing plugin {dependency}."
                    )

                if (
                    position[dependency]
                    >= position[item.plugin_id]
                ):
                    raise MarketplacePortfolioTransactionError(
                        f"{item.plugin_id} has a "
                        "forward dependency on "
                        f"{dependency}."
                    )

        unknown_sources = sorted(
            set(
                self.request
                .source_directories
            )
            - set(plugin_ids)
        )

        if unknown_sources:
            raise MarketplacePortfolioTransactionError(
                "Unknown portfolio source "
                "directories: "
                + ", ".join(
                    unknown_sources
                )
            )

        if (
            self.request.install_root.exists()
            and not self.request.overwrite
        ):
            raise MarketplacePortfolioTransactionError(
                "A live portfolio is already "
                "installed."
            )

        self._invoke_fault(
            "after-preflight",
            None,
        )

    def _install_candidate_portfolio(
        self,
    ) -> None:
        for item in sorted(
            self.request.install_items,
            key=(
                lambda candidate:
                candidate.sequence
            ),
        ):
            self._record(
                "plugin-transaction-started",
                {
                    "pluginId": item.plugin_id,
                    "sequence": item.sequence,
                },
            )

            result = MarketplaceInstallTransaction(
                MarketplaceInstallTransactionRequest(
                    plugin_id=(
                        item.plugin_id
                    ),
                    version=(
                        item.version
                    ),
                    source_directory=(
                        self.request
                        .source_directories[
                            item.plugin_id
                        ]
                    ),
                    install_root=(
                        self._candidate_root
                    ),
                    work_root=(
                        self._plugin_work_root
                    ),
                    expected_files=(
                        item.expected_files
                    ),
                    overwrite=False,
                ),
                transaction_id=(
                    f"{self.transaction_id}-"
                    f"{item.sequence:03d}-"
                    f"{item.plugin_id}"
                ),
                fault_hook=(
                    self._plugin_fault_hook(
                        item.plugin_id
                    )
                ),
            ).execute()

            self._plugin_results.append(
                result
            )

            if not result.succeeded:
                for issue in result.issues:
                    self._issues.append(
                        MarketplacePortfolioTransactionIssue(
                            code=issue.code,
                            plugin_id=(
                                item.plugin_id
                            ),
                            step=issue.step,
                            message=issue.message,
                        )
                    )

                raise MarketplacePortfolioTransactionError(
                    "Plugin transaction failed: "
                    f"{item.plugin_id}"
                )

            self._record(
                "plugin-transaction-complete",
                {
                    "pluginId": item.plugin_id,
                    "sequence": item.sequence,
                },
            )

    def _commit(
        self,
    ) -> None:
        live = self.request.install_root

        if live.exists():
            os.replace(
                live,
                self._backup_root,
            )
            self._backup_created = True
            self._record(
                "live-portfolio-backed-up",
                {
                    "backup": str(
                        self._backup_root
                    ),
                },
            )

        self._invoke_fault(
            "after-backup",
            None,
        )

        os.replace(
            self._candidate_root,
            live,
        )
        self._candidate_promoted = True

        self._invoke_fault(
            "after-promote",
            None,
        )

    def _rollback(
        self,
    ) -> None:
        failed_state = self._state
        self._state = (
            MarketplacePortfolioTransactionState.ROLLING_BACK
        )
        self._record(
            "portfolio-rollback-started",
            {
                "failedState": (
                    failed_state.value
                ),
            },
        )

        try:
            if (
                self._candidate_promoted
                and self.request
                .install_root
                .exists()
            ):
                shutil.rmtree(
                    self.request.install_root
                )
                self._record(
                    "promoted-portfolio-removed"
                )

            if (
                self._backup_created
                and self._backup_root.exists()
            ):
                os.replace(
                    self._backup_root,
                    self.request.install_root,
                )
                self._record(
                    "live-portfolio-restored"
                )

            if self._candidate_root.exists():
                shutil.rmtree(
                    self._candidate_root
                )
                self._record(
                    "candidate-portfolio-removed"
                )

            self._state = (
                MarketplacePortfolioTransactionState.ROLLED_BACK
            )
            self._record(
                "portfolio-rollback-complete"
            )
        except Exception as error:
            self._issues.append(
                MarketplacePortfolioTransactionIssue(
                    code="PORTFOLIO_ROLLBACK_FAILED",
                    plugin_id="",
                    step="rollback",
                    message=str(error),
                )
            )
            self._state = (
                MarketplacePortfolioTransactionState.FAILED
            )
            self._record(
                "portfolio-rollback-error",
                {
                    "error": str(error),
                },
            )

    def _plugin_fault_hook(
        self,
        plugin_id: str,
    ) -> Callable[[str], None] | None:
        if self._fault_hook is None:
            return None

        def hook(
            point: str,
        ) -> None:
            self._fault_hook(
                f"plugin:{point}",
                plugin_id,
            )

        return hook

    def _transition(
        self,
        state: MarketplacePortfolioTransactionState,
        event: str,
    ) -> None:
        self._state = state
        self._record(event)

    def _record(
        self,
        event: str,
        details: Mapping[
            str,
            object,
        ]
        | None = None,
    ) -> None:
        record = {
            "event": event,
            "state": self._state.value,
            "transactionId": (
                self.transaction_id
            ),
            "timestamp": (
                datetime.now(
                    timezone.utc
                ).isoformat()
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
        plugin_id: str | None,
    ) -> None:
        if self._fault_hook is not None:
            self._fault_hook(
                point,
                plugin_id,
            )


__all__ = [
    "MarketplacePortfolioInstallItem",
    "MarketplacePortfolioTransactionCoordinator",
    "MarketplacePortfolioTransactionError",
    "MarketplacePortfolioTransactionIssue",
    "MarketplacePortfolioTransactionRequest",
    "MarketplacePortfolioTransactionResult",
    "MarketplacePortfolioTransactionState",
]
