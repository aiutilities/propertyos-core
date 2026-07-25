# PropertyOS AI Ecosystem Governance

Version: 1.0
Status: Official Governance
Scope: Entire PropertyOS AI Platform

---

## 1. Purpose

This document defines governance for every AI capability that exists inside
PropertyOS.

It applies to:

- AI providers
- orchestration
- specialist agents
- tools
- prompts
- memories
- planning
- execution
- approval
- auditing
- learning
- certification
- release management

This governance supplements:

- GOVERNANCE.md
- RELEASE_GOVERNANCE.md
- PLUGIN_MARKETPLACE_GOVERNANCE.md
- THEME_MARKETPLACE_GOVERNANCE.md

---

## 2. Principles

Every AI capability shall remain:

- observable;
- auditable;
- deterministic where required;
- secure;
- explainable;
- reviewable;
- recoverable;
- replaceable.

Human governance always has precedence.

---

## 3. Human Authority

AI may recommend.

AI may analyse.

AI may automate approved operations.

AI must never become the release authority,
security authority,
legal authority,
or governance authority.

---

## 4. AI Provider Governance

Approved providers shall satisfy:

- documented capabilities;
- authentication requirements;
- audit support;
- version tracking;
- operational monitoring;
- fallback behaviour;
- compatibility requirements.

Providers remain replaceable.

---

## 5. Provider Independence

No PropertyOS subsystem shall depend permanently
upon one commercial AI vendor.

Provider abstraction shall remain mandatory.

---

## 6. Approved Providers

Examples include:

- OpenAI
- Claude
- Qwen
- DeepSeek
- Local models
- Future certified providers

Provider approval requires governance review.

---

## 7. Provider Registration

Every provider should define:

- identifier;
- version;
- protocol;
- authentication;
- capabilities;
- limitations;
- supported models;
- operational status.

---

## 8. Provider Manifest

Every AI provider must expose a governed manifest.

The provider manifest should identify:

- provider identifier;
- manifest version;
- provider version;
- supported protocol;
- supported models;
- compatibility range;
- capabilities;
- limitations;
- authentication method;
- data-handling characteristics;
- operational requirements;
- fallback behaviour.

Manifest declarations must match runtime behaviour.

---

## 9. Provider Compatibility

Provider compatibility must be explicit and testable.

Compatibility review may include:

- PropertyOS version;
- AI contract version;
- protocol compatibility;
- model capabilities;
- streaming support;
- tool-call support;
- structured-output support;
- context-window requirements;
- timeout expectations;
- retry behaviour.

A provider must not be activated outside its declared compatibility range.

---

## 10. Provider Credentials

Provider credentials must be:

- stored outside source control;
- resolved through approved credential mechanisms;
- scoped to the minimum required authority;
- rotated according to security policy;
- excluded from logs;
- excluded from prompts;
- excluded from audit payloads;
- revocable.

AI providers must not receive unrelated deployment secrets.

---

## 11. Provider Activation

Registration does not automatically authorize activation.

Provider activation should require:

- valid manifest;
- compatible platform version;
- valid configuration;
- available credentials;
- successful connectivity validation;
- approved runtime state;
- explicit activation authority where required.

Provider activation must be auditable.

---

## 12. Provider Runtime Configuration

Runtime configuration may include:

- model selection;
- temperature;
- token limits;
- timeouts;
- retry limits;
- routing weight;
- cost limits;
- regional endpoint;
- protocol options;
- safety settings.

Configuration changes must remain attributable and reversible where practical.

Sensitive configuration must not be exposed publicly.

---

## 13. Provider Selection

Provider selection may consider:

- required capability;
- compatibility;
- availability;
- latency;
- reliability;
- cost;
- data policy;
- model suitability;
- operational limits;
- governance constraints.

Selection logic must not silently bypass a provider restriction.

---

## 14. Provider Routing

Routing policies must remain:

- explicit;
- reviewable;
- testable;
- observable;
- provider-agnostic;
- consistent with data policy;
- consistent with capability requirements.

Routing decisions should preserve evidence sufficient to explain why a provider
was selected.

---

## 15. Provider Failover

Failover may occur when:

- a provider is unavailable;
- a timeout occurs;
- a provider returns an eligible failure;
- compatibility changes;
- a recovery policy permits fallback;
- an operational threshold is exceeded.

Failover must not:

- bypass data-residency requirements;
- escalate permissions;
- change approval requirements;
- use an uncertified provider;
- exceed recovery budgets;
- conceal the original failure.

---

## 16. Provider Reliability

Provider reliability may be measured through:

- success rate;
- timeout rate;
- error rate;
- latency;
- invalid-output rate;
- tool-call accuracy;
- fallback frequency;
- recovery success;
- availability;
- operational incidents.

Reliability evidence may influence routing but must not override governance.

---

## 17. Provider Simulation

Simulation may be used to validate:

- provider configuration;
- routing;
- compatibility;
- failover;
- error handling;
- response normalization;
- cost controls;
- operational readiness.

Simulation must not be represented as live-provider certification.

---

## 18. Provider Suspension

A provider may be suspended when:

- credentials are compromised;
- compatibility fails;
- reliability becomes unacceptable;
- data handling conflicts with policy;
- safety behaviour becomes unacceptable;
- legal or contractual restrictions apply;
- the provider is under investigation.

Suspension should block new governed activation or dispatch.

---

## 19. Provider Revocation

Provider approval may be revoked for:

- confirmed security compromise;
- deliberate policy violation;
- persistent incompatibility;
- unacceptable data exposure;
- fraudulent capability claims;
- unresolved safety failure;
- legal necessity.

Revocation must be recorded with scope, authority, reason and effective date.

---

## 20. Provider Records

Provider records should preserve:

- registration;
- manifest versions;
- compatibility evidence;
- activation history;
- configuration history;
- suspension;
- revocation;
- incidents;
- certification evidence;
- responsible maintainers.

Provider records must be sufficient to reconstruct material runtime decisions.

---

## 21. Agent Identity

Every governed AI agent or specialist must have a stable identity.

Agent identity should include:

- agent identifier;
- name;
- version;
- purpose;
- owner;
- capability scope;
- operating mode;
- approval requirements;
- memory policy;
- provider requirements;
- lifecycle state.

An agent must not operate under an ambiguous or misleading identity.

---

## 22. Agent Roles

AI agents may perform roles such as:

- planner;
- analyst;
- router;
- specialist;
- coordinator;
- evaluator;
- summarizer;
- recommender;
- operator within approved limits;
- supervisor.

Each role must have explicit authority boundaries.

---

## 23. Specialist Agents

A specialist agent focuses on a defined property-management domain.

Examples may include:

- property operations;
- maintenance;
- helpdesk;
- inventory;
- procurement;
- lease administration;
- resident services;
- finance assistance;
- compliance assistance.

A specialist must not assume authority outside its registered capability scope.

---

## 24. Capability Registry

The capability registry should record:

- capability identifier;
- description;
- owning agent;
- risk level;
- required permissions;
- required context;
- required provider features;
- approval mode;
- evidence requirements;
- lifecycle state.

Capability registration does not automatically authorize execution.

---

## 25. Capability Risk

Capabilities should be classified by risk.

Risk factors may include:

- data sensitivity;
- financial impact;
- legal impact;
- security impact;
- operational impact;
- reversibility;
- external communication;
- automation scope;
- confidence requirements;
- human oversight.

Higher-risk capabilities require stronger governance.

---

## 26. Agent Operating Modes

Agent operating modes may include:

- advisory;
- assisted;
- approval required;
- autonomous within policy;
- disabled.

The operating mode must be explicit.

A capability must not silently move to a more autonomous mode.

---

## 27. Agent Registration

Agent registration should validate:

- identity;
- version;
- declared capabilities;
- supported providers;
- compatibility;
- permissions;
- approval requirements;
- memory policy;
- tool access;
- evidence behaviour.

Invalid or incomplete agents must not enter the active registry.

---

## 28. Agent Activation

Registration does not automatically authorize activation.

Activation may require:

- approved identity;
- compatible runtime;
- valid provider configuration;
- valid capability registration;
- required tools;
- required permissions;
- approved operating mode;
- explicit activation authority.

Activation and deactivation must be auditable.

---

## 29. Agent Planning

Agent plans should identify:

- objective;
- assumptions;
- required context;
- proposed steps;
- selected capabilities;
- required tools;
- expected outputs;
- approval boundaries;
- fallback or stop conditions.

Planning output does not authorize execution.

---

## 30. Delegation

An agent may delegate only to registered agents or capabilities.

Delegation must preserve:

- originating actor;
- correlation identity;
- objective;
- permissions;
- approval requirements;
- evidence chain;
- risk classification;
- stop conditions.

Delegation must not increase authority.

---

## 31. Collaboration

Multi-agent collaboration should be governed through explicit coordination.

Collaboration may include:

- proposal exchange;
- specialist consultation;
- evidence comparison;
- negotiation;
- consensus;
- supervisor review.

Collaboration must not conceal responsibility for the final decision.

---

## 32. Consensus

Consensus may support analysis but does not create authority.

Consensus mechanisms should identify:

- participating agents;
- their roles;
- individual recommendations;
- conflicts;
- confidence;
- final aggregation method;
- unresolved uncertainty.

Multiple agreeing agents may still be wrong.

---

## 33. Supervision

Supervisory agents may:

- review plans;
- assess risk;
- detect conflicts;
- request clarification;
- require replanning;
- stop execution;
- escalate for human review.

A supervisory agent must not waive mandatory human approval.

---

## 34. Replanning

Replanning may occur when:

- assumptions change;
- a tool fails;
- a provider fails;
- required context is missing;
- risk increases;
- approval is denied;
- output quality is inadequate;
- a policy boundary is encountered.

Replanning must preserve the original objective and governance constraints.

---

## 35. Tool Identity

Every governed AI tool must have a stable identity.

Tool identity should include:

- tool identifier;
- name;
- version;
- purpose;
- owner;
- input contract;
- output contract;
- required permissions;
- side-effect classification;
- timeout;
- retry policy;
- lifecycle state.

A tool must not operate under an ambiguous or misleading identity.

---

## 36. Tool Manifest

Every AI tool should expose a governed manifest.

The manifest should define:

- tool identifier;
- description;
- input schema;
- output schema;
- required context;
- required permissions;
- risk level;
- execution mode;
- timeout;
- retry behaviour;
- idempotency expectations;
- approval requirements;
- evidence requirements.

Manifest declarations must match runtime behaviour.

---

## 37. Tool Registry

Only validated tools may enter the active AI tool registry.

Registration should confirm:

- valid identity;
- valid manifest;
- compatible contract version;
- implementation availability;
- required permissions;
- risk classification;
- approval mode;
- evidence behaviour;
- responsible maintainer.

Registration does not authorize execution.

---

## 38. Tool Execution Context

Every tool execution must use a governed execution context.

The context should include:

- authenticated actor;
- correlation identifier;
- originating request;
- agent identity;
- capability identity;
- granted permissions;
- property or tenant scope;
- approval reference where required;
- execution deadline;
- evidence metadata.

Missing or invalid execution context must block execution.

---

## 39. Read-Only Tools

Read-only tools may retrieve or analyse information without changing governed
state.

Read-only status requires that the tool does not:

- mutate persistent data;
- trigger external communication;
- approve or reject actions;
- create financial commitments;
- change permissions;
- activate extensions;
- execute migrations;
- disclose unauthorized data.

A tool must not be classified as read-only merely because its mutation is
indirect.

---

## 40. Mutating Tools

Mutating tools change governed state or cause consequential effects.

Examples may include:

- creating or updating records;
- sending notifications;
- approving workflows;
- scheduling operations;
- changing configuration;
- activating extensions;
- invoking payments;
- executing migrations;
- external API mutations.

Mutating tools require explicit authorization appropriate to their risk.

---

## 41. Tool Permissions

Tool permissions must be:

- explicit;
- minimal;
- attributable;
- compatible with the actor;
- compatible with the agent;
- compatible with the capability;
- limited to the execution scope;
- independently enforceable where supported.

An agent must not grant itself additional tool permissions.

---

## 42. Consequential Actions

Consequential actions include operations that may create material:

- financial impact;
- legal impact;
- security impact;
- privacy impact;
- operational impact;
- external communication;
- irreversible state;
- user-account impact;
- property-access impact.

Consequential actions require a governed approval boundary.

---

## 43. Human Approval

Human approval must be required when policy, risk or uncertainty demands it.

Approval evidence should identify:

- approving actor;
- approval authority;
- approved action;
- scope;
- conditions;
- timestamp;
- expiry where applicable;
- evidence digest;
- correlation identifier.

Approval must precede execution.

Approval for one action must not be reused for an unrelated action.

---

## 44. Approval Separation

Significant actions should preserve separation between:

- requester;
- planner;
- approver;
- executor;
- reviewer.

One person may hold multiple roles in a solo-founder environment only when the
governance policy explicitly permits it and the evidence remains distinct.

AI must never act as the human approver.

---

## 45. Autonomous Execution

Autonomous execution is permitted only within an approved policy boundary.

The boundary must define:

- eligible capabilities;
- eligible tools;
- actor scope;
- property scope;
- risk ceiling;
- confidence threshold;
- cost ceiling;
- execution limits;
- stop conditions;
- escalation conditions.

Autonomy must not be inferred from technical capability alone.

---

## 46. Confidence Governance

Confidence may influence routing and escalation.

Confidence must not be used as the sole justification for:

- financial commitments;
- legal decisions;
- security changes;
- access-control changes;
- irreversible operations;
- high-impact external communication.

Low or uncertain confidence should trigger clarification, fallback or human
review.

---

## 47. Execution Limits

Governed AI execution may be limited by:

- tool-call count;
- elapsed time;
- token budget;
- cost budget;
- retry count;
- recovery budget;
- mutation count;
- external-call count;
- data scope;
- risk score.

Exceeding a limit must stop or escalate execution.

---

## 48. Tool Failure

Tool failure handling should preserve:

- original error;
- execution context;
- partial-result state;
- side-effect status;
- retry eligibility;
- rollback or recovery options;
- evidence;
- user-facing explanation where appropriate.

A failed tool call must not be represented as successful.

---

## 49. Prompt Governance

Prompts that influence governed behaviour must be treated as controlled
configuration.

Prompt governance should consider:

- prompt identity;
- version;
- purpose;
- owner;
- supported capability;
- input assumptions;
- prohibited behaviour;
- approval boundary;
- output requirements;
- safety requirements;
- change history.

A prompt must not silently redefine platform authority.

---

## 50. System Prompts

System prompts should define the stable operating boundary for an AI capability.

They should preserve:

- role;
- scope;
- policy constraints;
- tool restrictions;
- approval requirements;
- data-handling limits;
- uncertainty behaviour;
- refusal behaviour;
- evidence expectations;
- escalation rules.

System prompts must not contain credentials or unrelated confidential data.

---

## 51. Prompt Changes

Material prompt changes require review.

Material changes include those affecting:

- permissions;
- tool use;
- approval requirements;
- data access;
- safety behaviour;
- decision logic;
- external communication;
- refusal behaviour;
- autonomy;
- output interpretation.

Prompt changes must remain attributable and versioned.

---

## 52. Prompt Injection

PropertyOS AI components must treat untrusted content as data, not authority.

Controls should address:

- direct prompt injection;
- indirect prompt injection;
- malicious documents;
- malicious web content;
- malicious tool output;
- hidden instructions;
- role impersonation;
- policy-override attempts.

Untrusted content must not override system or governance instructions.

---

## 53. Context Governance

AI context assembly must be:

- scoped;
- relevant;
- minimal;
- permission-aware;
- attributable;
- bounded by token and cost limits;
- protected against cross-property leakage;
- protected against cross-tenant leakage;
- consistent with data-retention policy.

Context must not include data the authenticated actor is not permitted to access.

---

## 54. Data Minimization

Only data necessary for the approved AI purpose should be processed.

Data minimization should consider:

- field selection;
- record selection;
- time range;
- property scope;
- tenant scope;
- personal-data removal;
- secret removal;
- document excerpts;
- prompt history;
- provider transmission.

Convenience does not justify excessive disclosure.

---

## 55. Sensitive Data

Sensitive data may include:

- credentials;
- authentication tokens;
- identity documents;
- financial information;
- health information;
- legal records;
- access-control data;
- private communications;
- personal contact information;
- security incidents.

Sensitive data requires explicit handling rules and may require stronger provider
or deployment restrictions.

---

## 56. Memory Governance

AI memory must have a declared purpose and retention policy.

Memory governance should define:

- memory type;
- source;
- scope;
- owner;
- retention;
- update rules;
- deletion rules;
- access rules;
- provider exposure;
- auditability.

An agent must not create unrestricted persistent memory by default.

---

## 57. Conversation Memory

Conversation memory should preserve only information needed for the active or
approved continuing interaction.

Conversation memory must not:

- silently become permanent;
- cross tenant or property boundaries;
- include unrelated secrets;
- override current permissions;
- be treated as verified fact without validation.

Users should be informed where persistent memory materially affects behaviour.

---

## 58. Outcome Memory

Outcome memory may record approved operational learning.

Outcome memory should distinguish:

- observation;
- recommendation;
- decision;
- human approval;
- execution result;
- failure;
- confidence;
- feedback.

A prior outcome must not automatically authorize a future action.

---

## 59. Learning

Learning mechanisms may improve:

- routing;
- provider selection;
- recommendations;
- prioritization;
- confidence calibration;
- recovery;
- specialist selection.

Learning must not silently change:

- permissions;
- approval requirements;
- legal policy;
- security policy;
- release authority;
- marketplace authority;
- product governance.

---

## 60. Feedback

Feedback may be collected from:

- users;
- operators;
- maintainers;
- reviewers;
- execution outcomes;
- incident analysis;
- certification exercises.

Feedback records should preserve source, context, timestamp and scope.

User feedback must not be treated as verified ground truth without evaluation.

---

## 61. Evaluation

AI evaluation should be appropriate to capability risk.

Evaluation may include:

- correctness;
- relevance;
- groundedness;
- tool selection;
- tool-argument quality;
- safety;
- refusal behaviour;
- approval compliance;
- privacy;
- latency;
- cost;
- recovery;
- accessibility of output.

Evaluation evidence should be versioned and reproducible where practical.

---

## 62. Certification

AI certification indicates completion of a defined review programme.

Certification may include:

- provider certification;
- manifest certification;
- compatibility certification;
- agent certification;
- specialist certification;
- tool certification;
- prompt certification;
- approval-boundary certification;
- safety certification;
- operational certification.

The exact certification scope must be stated.

Certification does not guarantee correctness, availability or suitability for
every deployment.

---

## 63. Auditability

Material AI activity must be auditable.

Audit evidence may include:

- actor;
- provider;
- model;
- agent;
- capability;
- tool;
- prompt version;
- context scope;
- decision;
- confidence;
- approval reference;
- execution outcome;
- correlation identifier;
- timestamp.

Audit records must not expose credentials or unnecessary sensitive data.

---

## 64. Decision Evidence

Decision evidence should distinguish:

- source data;
- assumptions;
- recommendations;
- uncertainty;
- policy evaluation;
- approval requirement;
- human decision;
- execution result.

An AI recommendation must not be recorded as a human decision.

---

## 65. Explainability

Explanations should be appropriate to the capability and risk.

An explanation may include:

- relevant facts;
- applied rules;
- selected provider;
- selected specialist;
- selected tools;
- confidence;
- limitations;
- unresolved uncertainty;
- required human action.

Explainability must not disclose protected prompts, secrets or unrelated data.

---

## 66. Safety

AI safety controls should address:

- unauthorized actions;
- harmful recommendations;
- data leakage;
- prompt injection;
- deceptive output;
- excessive autonomy;
- fabricated evidence;
- unsafe tool use;
- provider failure;
- recovery loops;
- vulnerable users;
- operational escalation.

Safety controls must be testable where practical.

---

## 67. Refusal and Escalation

AI should refuse or escalate when:

- authority is absent;
- required approval is absent;
- requested data is unauthorized;
- risk exceeds policy;
- confidence is inadequate;
- a legal or security boundary is encountered;
- the requested action is unsafe;
- execution context is invalid;
- a required provider or tool is unavailable.

Refusal should be clear and should not falsely imply completion.

---

## 68. Hallucination and Fabrication

AI must not invent:

- approvals;
- payments;
- legal status;
- security findings;
- maintenance completion;
- document existence;
- user consent;
- provider evidence;
- tool results;
- execution outcomes.

Unverified information must be labelled as uncertain or proposed.

---

## 69. External Communication

AI-generated external communication requires governance appropriate to impact.

External communication may include:

- email;
- messaging;
- notices;
- support replies;
- legal correspondence;
- financial communication;
- resident communication;
- vendor communication.

Draft generation and message delivery must remain separate where approval is
required.

---

## 70. Incident Response

AI incidents may include:

- unauthorized execution;
- data leakage;
- compromised credentials;
- unsafe recommendation;
- repeated hallucination;
- prompt injection;
- provider compromise;
- tool misuse;
- approval bypass;
- incorrect external communication.

Incidents must follow security and operational escalation.

---

## 71. Suspension

An AI provider, agent, specialist, tool, prompt or capability may be suspended
during investigation.

Suspension may be required because of:

- security concerns;
- compatibility failure;
- safety failure;
- data-policy conflict;
- repeated operational failure;
- compromised credentials;
- invalid certification;
- legal necessity.

Suspension must be recorded with scope, authority and review conditions.

---

## 72. Revocation

Governed AI approval may be revoked for:

- confirmed malicious behaviour;
- persistent policy violation;
- unacceptable security risk;
- unacceptable safety risk;
- fraudulent capability claims;
- unresolved data exposure;
- compromised identity;
- legal necessity.

Revocation must be auditable and propagated to active registries and runtime
controls.

---

## 73. Runtime Containment

Runtime containment may include:

- provider deactivation;
- agent deactivation;
- specialist removal;
- tool removal;
- prompt rollback;
- capability disablement;
- autonomous-mode disablement;
- forced human approval;
- network isolation.

Runtime containment requires explicit authority unless immediate action is
necessary to prevent material harm.

---

## 74. Emergency Action

Emergency action must be:

- narrowly scoped;
- time-bound;
- authorized by qualified authority;
- recorded;
- reviewed after stabilization;
- reversed when temporary.

Emergency authority must not permanently redefine AI governance.

---

## 75. Appeals

A provider owner, agent owner, tool owner or maintainer may appeal an adverse
governance decision.

An appeal should include:

- disputed decision;
- affected identity;
- reasons for reconsideration;
- remediation evidence;
- evaluation evidence;
- conflict-of-interest concerns;
- requested outcome.

An appeal does not automatically pause urgent security or safety action.

---

## 76. Appeal Outcomes

An appeal may result in:

- confirmation of the original decision;
- modification of conditions;
- restoration to review;
- lifting of suspension;
- restoration of certification;
- rejection of the appeal;
- referral to broader governance.

The outcome must be recorded with authority, reason and effective date.

---

## 77. Ecosystem Publication

Official publication of an AI provider, agent, specialist, tool or capability
requires governed review.

Publication should identify:

- published identity;
- version;
- owner;
- capability scope;
- provider requirements;
- tool requirements;
- risk classification;
- approval mode;
- certification scope;
- support status;
- lifecycle state.

Publication does not automatically authorize activation or execution.

---

## 78. AI Specialist Marketplace

A future AI Specialist Marketplace may distribute certified specialists.

Specialist publication may require:

- attributable publisher;
- stable specialist identity;
- declared capabilities;
- declared providers;
- declared tools;
- compatibility evidence;
- risk classification;
- evaluation evidence;
- safety review;
- approval-boundary review;
- certification;
- human approval.

This policy does not activate or implement that marketplace.

---

## 79. Official AI Specialists

An official AI specialist is one explicitly designated through PropertyOS
governance.

Official status may require:

- Project Steward authorization;
- identified AI Maintainer;
- compatibility maintenance;
- evaluation maintenance;
- security-response ownership;
- safety-response ownership;
- release alignment;
- documentation;
- support commitments.

Certification alone does not create official status.

---

## 80. Third-Party AI Components

Third-party providers, agents, specialists and tools may be eligible for
integration.

Third-party status does not exempt a component from:

- identity requirements;
- compatibility requirements;
- security review;
- data-governance review;
- tool-governance review;
- approval-boundary review;
- evaluation;
- suspension;
- revocation.

Commercial payment does not create certification or endorsement.

---

## 81. Open-Source AI Components

Open-source AI components should identify:

- licence;
- source repository;
- responsible maintainers;
- build or deployment instructions;
- model or provider dependencies;
- issue tracker;
- security-reporting route.

Open-source availability does not automatically establish approval.

---

## 82. Commercial AI Components

Commercial AI components may be eligible for governed use.

Commercial arrangements must not:

- bypass provider review;
- bypass data policy;
- bypass security review;
- bypass approval requirements;
- imply official certification;
- conceal provider substitution;
- reduce auditability.

Commercial support terms remain separate from open-source governance.

---

## 83. Versioning

Governed AI components should use clear versioning.

Version changes should reflect material changes to:

- manifests;
- capabilities;
- providers;
- prompts;
- tools;
- permissions;
- approval boundaries;
- safety behaviour;
- evaluation results;
- runtime behaviour.

Published versions must remain attributable and immutable.

---

## 84. Deprecation

Deprecation should define:

- affected component;
- affected versions;
- reason;
- replacement where available;
- migration guidance;
- support period;
- intended removal date.

Deprecation does not automatically stop active runtime use.

---

## 85. Removal

Removal from an official registry may occur after:

- deprecation;
- governance review;
- migration planning;
- compatibility review;
- safety review;
- operator communication.

Urgent security or safety removal may use emergency authority.

---

## 86. Current Product-Freeze Boundary

During Repository Foundation:

- no new AI feature implementation is authorized;
- no provider runtime behaviour may be changed;
- no agent or specialist runtime behaviour may be changed;
- no AI tool execution behaviour may be changed;
- no AI database schema may be changed;
- no AI marketplace may be activated;
- no autonomous authority may be expanded;
- product source remains frozen;
- this policy governs future ecosystem operation only.

Existing AI platform implementation and certification remain unchanged.

---

## 87. Amendments

Changes to this policy must follow `GOVERNANCE.md`.

Material amendments include:

- changing AI authority;
- changing provider requirements;
- changing approval requirements;
- changing autonomy policy;
- changing tool-execution policy;
- changing data-governance rules;
- changing certification requirements;
- changing suspension or revocation authority.

Emergency security or safety action may occur before policy amendment when
necessary to prevent immediate harm.

---

## 88. Related Documents

- `README.md`
- `ROADMAP.md`
- `GOVERNANCE.md`
- `MAINTAINERS.md`
- `SECURITY.md`
- `SUPPORT.md`
- `RELEASE_GOVERNANCE.md`
- `PLUGIN_MARKETPLACE_GOVERNANCE.md`
- `THEME_MARKETPLACE_GOVERNANCE.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `NOTICE`
- `docs/release/PLATFORM_AI_RUNTIME_CERTIFICATION.md`
- `docs/generated/modules/ai.md`

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
