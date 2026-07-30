# PropertyOS Phase 18C - Prompt Registry and Versioning Contract

## Status

- Checkpoint: contract only
- Implementation: not started
- Database mutation: not authorized
- Phase 19: not started

## Confirmed Phase 18 gaps

Phase 18B confirmed three missing capabilities:

1. Prompt registry
2. Prompt versioning
3. Scheduled AI execution

This checkpoint covers only prompt registry and prompt versioning.
Scheduled AI execution remains a separate Phase 18 checkpoint.

## Objective

Create a provider-neutral prompt registry that provides:

- Stable prompt identifiers
- Immutable semantic versions
- Manifest validation
- Active-version resolution
- Deterministic rendering
- Variable validation
- Core and plugin ownership rules
- Typed errors
- Registry inspection
- AI SDK compatible contracts

## Required source boundary

The implementation should use responsibilities equivalent to:

- backend/src/core/ai/prompts/contracts/
- backend/src/core/ai/prompts/errors/
- backend/src/core/ai/prompts/manifest/
- backend/src/core/ai/prompts/registry/
- backend/src/core/ai/prompts/rendering/
- backend/src/core/ai/prompts/types/

Exact filenames may follow existing repository conventions.

## Prompt identity

Prompt identifiers must be lowercase and dot separated.

Examples:

- helpdesk.ticket.triage
- helpdesk.reply.draft
- property.operations.summary
- maintenance.risk.analysis

Prompt identifiers must not include provider or model names.

## Prompt versions

Prompt versions must use semantic versioning.

Examples:

- 1.0.0
- 1.1.0
- 2.0.0

A prompt identifier and version pair is immutable.

Identical repeated registration may be idempotent.
Conflicting repeated registration must fail closed.
Version ordering must use semantic ordering, not lexical ordering.

## Prompt manifest

A prompt manifest must contain fields equivalent to:

- id
- version
- name
- description
- scope
- status
- messages
- variables
- optional metadata

Required scopes:

- core
- plugin

Required statuses:

- active
- deprecated

A plugin must not replace a core-owned prompt identity.

## Prompt messages

Supported initial roles:

- system
- user
- assistant

Each message contains a role and template text.

Template variables use deterministic placeholders such as:

{{variableName}}

Executable expressions, conditionals and scripting are prohibited.

## Prompt variables

Each variable definition contains:

- name
- required or optional state
- type
- optional description
- optional default value

Supported initial types:

- string
- number
- boolean
- string array
- json

Duplicate variables, undeclared placeholders and unknown supplied variables
must be rejected.

## Registry operations

The registry must support operations equivalent to:

- register(manifest)
- get(promptId, version)
- resolve(promptId, optionalVersion)
- list(optionalFilters)
- deprecate(promptId, version)
- has(promptId, version)

Registration must validate before mutation and reject invalid or conflicting
definitions.

Exact retrieval returns the requested registered version.

Default resolution returns the highest active semantic version.

Deprecated versions remain inspectable but must not be selected by default.

List results must be deterministic and filterable by identity, scope, status
and version.

## Rendering contract

Rendering must:

1. Resolve a prompt version.
2. Validate supplied variables.
3. Reject missing required variables.
4. Apply declared defaults.
5. Reject invalid variable types.
6. Render messages deterministically.
7. Reject unresolved placeholders.
8. Return the resolved prompt identity and version.

The renderer must not:

- execute code
- access environment variables
- read secrets
- perform network calls
- dispatch to an AI provider

## Error taxonomy

Typed errors must distinguish:

- invalid manifest
- invalid prompt identifier
- invalid semantic version
- conflicting duplicate version
- prompt not found
- prompt version not found
- no active version
- missing required variable
- unknown variable
- invalid variable type
- unresolved placeholder
- deprecated version resolution

Errors must not expose sensitive rendered values.

## Persistence boundary

The first implementation may use an in-memory bootstrap-driven registry if:

- registration is deterministic
- versions are immutable
- state is reconstructable at startup
- public contracts permit future persistence

No migration is authorized by this contract.

## Security requirements

The implementation must:

- treat prompt text as configuration
- reject executable templates
- prevent plugin replacement of core prompts
- prevent conflicting version replacement
- avoid logging sensitive rendered variables
- return defensive copies or immutable values
- fail closed on invalid manifests

## Required validation

The implementation checkpoint must test at least:

1. Valid core manifest accepted.
2. Valid plugin manifest accepted.
3. Invalid identifier rejected.
4. Invalid semantic version rejected.
5. Empty message collection rejected.
6. Duplicate variables rejected.
7. Undeclared placeholders rejected.
8. Unsupported roles rejected.
9. Unsupported variable types rejected.
10. Prompt version registered.
11. Exact version retrieved.
12. Highest active semantic version resolved.
13. Semantic ordering proven.
14. Identical registration is idempotent.
15. Conflicting registration rejected.
16. Registry listing is deterministic.
17. Registry filters work.
18. Exact version deprecated.
19. Deprecated version excluded from default resolution.
20. Deprecated version remains inspectable.
21. Missing prompt rejected.
22. Missing version rejected.
23. Plugin replacement of core prompt rejected.
24. Required string rendered.
25. Optional default applied.
26. Number and boolean rendered deterministically.
27. String array rendered deterministically.
28. JSON rendered deterministically.
29. Missing required variable rejected.
30. Unknown supplied variable rejected.
31. Invalid variable type rejected.
32. Unresolved placeholder rejected.
33. Resolved identity and version returned.
34. Message order and roles preserved.
35. No provider dispatch occurs.
36. AI module wiring compiles.
37. Registry is injectable.
38. Renderer is injectable.
39. Existing AI regression tests pass.
40. Backend build passes.

## Acceptance criteria

The implementation checkpoint is complete only when:

- prompt contracts exist
- manifest validation exists
- registry behavior exists
- semantic version resolution exists
- deterministic rendering exists
- typed errors exist
- ownership rules are enforced
- targeted tests pass
- existing AI regressions pass
- backend build passes
- no migration is required
- documentation matches implementation
- one checkpoint commit is created
- repository is clean

## Non-goals

This checkpoint does not implement:

- scheduled AI execution
- prompt authoring UI
- prompt marketplace
- runtime prompt editing
- database-backed prompt editing
- provider execution
- prompt optimization
- automatic rewriting
- A/B testing
- prompt analytics
- secret injection
- template scripting
- Phase 19 work

## Next checkpoint boundary

The next checkpoint may implement only this prompt registry and versioning
contract.

Scheduled AI execution remains a separate confirmed Phase 18 gap.

## Phase transition rule

Phase 19 must not begin in this chat.

When Phase 18 is complete:

1. Stop implementation.
2. Prepare a comprehensive Phase 18 handover.
3. Validate and commit the handover.
4. Ensure the repository is clean.
5. Move Phase 19 to a new chat.
