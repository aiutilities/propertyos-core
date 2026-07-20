# Phase 14 WhatsApp Pilot Operational Runbook

## Status

Phase 14 development may close as:

`READY_FOR_EXPLICIT_LIVE_AUTHORIZATION`

This status does not authorize a live message, expose the executor, approve
an invocation, or permit automatic delivery.

## Preconditions for any future live pilot

A future operator must provide a new, current, and separately reviewed set of:

1. Recipient consent evidence.
2. Approved E.164 recipient.
3. Approved message content and SHA-256 digest.
4. Production HTTPS endpoint identity.
5. Provider configuration evidence without disclosing the token.
6. Endpoint reachability evidence.
7. Named execution operator.
8. Separate approver.
9. Separate reconciliation owner.
10. Sealed execution request.
11. Exposure decision.
12. Manual invocation approval.
13. Atomic delivery reservation.

All authorization timestamps must remain inside the approved window.

## Pre-delivery abort conditions

Abort without sending when any of the following changes:

- recipient consent;
- recipient or message digest;
- endpoint identity;
- provider configuration;
- reachability evidence;
- authorization or execution seal;
- exposure evidence;
- invocation evidence;
- operator or approver identity;
- authorization window;
- atomic reservation state.

The executor must remain unexposed after an abort.

## Exactly-once rule

Only one delivery attempt and one completed delivery are permitted.

A completed reservation blocks all subsequent invocations. A conflicting
reservation blocks delivery before the provider is contacted.

## Ambiguous delivery rule

If the provider confirms delivery but PropertyOS cannot persist completion:

1. Do not mark the attempt as safely failed.
2. Do not retry automatically.
3. Preserve the reservation.
4. Store only sanitized reconciliation evidence.
5. Emit `PILOT_DELIVERY_RECONCILIATION_REQUIRED`.
6. Reconcile the provider message identifier by SHA-256 evidence.
7. Require a new human decision before any further action.

## Provider failure rule

Provider exceptions and remote errors must be sanitized. Tokens, authorization
headers, remote response bodies, and internal exception messages must not enter
permanent evidence.

## Observation and closure

The approved observation window must be between 30 and 240 minutes.

After exactly one durably recorded delivery:

1. Close executor exposure.
2. Reject repeat invocation.
3. Confirm delivery count equals one.
4. Preserve sanitized delivery evidence.
5. Record the final operational outcome.

## Current safety state

At Phase 14 development closure:

- executor exposed: false;
- executor invocation authorized: false;
- live message sent: false;
- external network contacted: false;
- database mutated: false;
- explicit live authorization present: false.

Any live pilot requires new, explicit authorization outside the Phase 14
development closure.
