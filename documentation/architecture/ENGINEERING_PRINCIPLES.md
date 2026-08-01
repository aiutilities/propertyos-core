# Cogzidel Engineering Principles

## Purpose

These principles define how PropertyOS and future Cogzidel platforms are designed, implemented, validated and evolved.

## Core Principles

1. **Contract first.** Define behavior, boundaries, acceptance criteria and non-goals before implementation.
2. **Audit before implementation.** Verify repository state, runtime behavior and current defects before changing code.
3. **One checkpoint, one commit.** Each checkpoint has a narrow scope, independent validation and one clear commit.
4. **Controlled repository scope.** Unexpected file changes stop the checkpoint.
5. **Shared infrastructure before module patches.** Solve cross-cutting failures in reusable platform layers.
6. **Product experience drives architecture.** Founder review and browser evidence are engineering inputs.
7. **Browser validation before closure.** Tests and builds are necessary but not sufficient.
8. **Safe failure is a feature.** Fail with clear messages, recovery paths and preserved diagnostics.
9. **No raw backend payloads in the UI.**
10. **Reusable by default.** Frontend-core capabilities should serve PropertyOS and future Cogzidel products.

## Delivery Pattern

> Contract → Audit → Implementation → Validation → Browser Re-audit → Commit → Handover
