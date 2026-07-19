# Phase 13D Environment Trust Bootstrap

## Canonical identity

The first-party publisher identifier is permanently:

    propertyos

The display name is:

    PropertyOS

Environment bootstrap must not substitute another publisher identity for
first-party PropertyOS releases.

## Key boundary

Private signing keys must remain offline and outside the repository, deployment
containers, database, bootstrap evidence, logs, and environment variables.

Bootstrap accepts only a public-key file. The existing canonical public-key
policy:

- Rejects private-key PEM.
- Requires RSA.
- Requires a minimum 2048-bit modulus.
- Converts the key to canonical SPKI PEM.
- Derives the SHA-256 fingerprint on the server.
- Uses RSA-SHA256.

## Planning command

From the backend directory, configure:

    PROPERTYOS_BOOTSTRAP_ENVIRONMENT
    PROPERTYOS_BOOTSTRAP_KEY_ID
    PROPERTYOS_BOOTSTRAP_PUBLIC_KEY_PATH
    PROPERTYOS_BOOTSTRAP_ACTOR_ID
    PROPERTYOS_BOOTSTRAP_VALID_FROM
    PROPERTYOS_BOOTSTRAP_EVIDENCE_TIMESTAMP

PROPERTYOS_BOOTSTRAP_VALID_UNTIL is optional.

Then run:

    npm run trust-bootstrap:plan

The evidence timestamp must be supplied explicitly so the same desired state
produces the same evidence digest.

## Planner safety

The planning command:

- Reads one public-key file.
- Does not connect to PostgreSQL.
- Does not register a publisher or key.
- Does not authorize execution.
- Returns databaseConnected false.
- Returns databaseMutated false.
- Returns executeAuthorized false.
- Produces deterministic desired-state evidence.

## Idempotency

When the canonical publisher and key do not exist, the desired actions are
REGISTER_PUBLISHER and REGISTER_KEY.

When matching active records already exist, the actions are NOOP_PUBLISHER and
NOOP_KEY. The evidence digest remains identical because it represents desired
state rather than execution history.

Existing conflicting, suspended, revoked, noncanonical, or differently keyed
state blocks bootstrap. Bootstrap never overwrites trusted state.

## Execution gate

Actual registration requires:

- Migrations 046 and 048 applied in an authorized isolated or staging rollout.
- Successful schema acceptance.
- Named bootstrap operator and approver.
- Public-key fingerprint confirmation through a separate channel.
- Recorded execution authorization.
- Atomic publisher/key audit events.

The planner alone never grants execution authorization.
