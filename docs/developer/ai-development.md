# PropertyOS AI Development Guide

This guide provides a developer-oriented overview of the existing PropertyOS
AI platform.

Canonical AI contracts, implementation and certification remain authoritative.

---

## 1. AI Platform Model

The PropertyOS AI platform includes:

- providers;
- provider manifests;
- routing;
- failover;
- agents;
- specialist agents;
- capabilities;
- planning;
- collaboration;
- tools;
- approval boundaries;
- audit evidence;
- controlled autonomy;
- memory;
- learning;
- safety.

AI capabilities operate inside PropertyOS authorization and governance.

---

## 2. Product-Freeze Boundary

During Repository Foundation:

- no new AI feature implementation is authorized;
- no provider runtime behaviour may change;
- no agent runtime behaviour may change;
- no AI tool behaviour may change;
- no AI schema migration may be introduced;
- no autonomy boundary may be expanded;
- no AI marketplace may be activated.

This guide documents existing capabilities only.

---

## 3. Canonical References

Begin with:

- `../../AI_ECOSYSTEM_GOVERNANCE.md`
- `../PHASE_16E1B_AI_SDK_BOUNDARY.md`
- `../generated/modules/ai.md`
- `../release/PLATFORM_AI_RUNTIME_CERTIFICATION.md`
- `architecture.md`
- `../../SECURITY.md`

---

## 4. Provider Model

AI providers implement governed provider contracts.

Existing provider support includes implementations for:

- OpenAI-compatible providers;
- OpenAI;
- Claude;
- Qwen;
- DeepSeek;
- mock or simulation providers.

Provider-specific code must remain behind provider abstractions.

---

## 5. Provider Manifest

A provider manifest should define:

- provider identifier;
- manifest version;
- provider version;
- protocol;
- supported models;
- capabilities;
- limitations;
- compatibility;
- authentication;
- runtime requirements;
- fallback behaviour.

Manifest declarations must match runtime behaviour.

---

## 6. Provider Registration

Provider registration should validate:

- identity;
- manifest;
- compatibility;
- implementation availability;
- configuration requirements;
- credentials;
- lifecycle state.

Registration does not automatically activate a provider.

---

## 7. Provider Activation

Activation may require:

- valid registration;
- compatible runtime;
- valid configuration;
- available credentials;
- successful connectivity validation;
- approved operational state.

Activation and deactivation must remain auditable.

---

## 8. Credentials

Provider credentials must:

- remain outside source control;
- be resolved through approved mechanisms;
- be scoped minimally;
- be rotatable;
- be revocable;
- be excluded from logs;
- be excluded from prompts;
- be excluded from audit evidence.

Never embed provider credentials in source or documentation.

---

## 9. Provider Routing

Routing may consider:

- capability;
- compatibility;
- availability;
- latency;
- cost;
- reliability;
- model suitability;
- data policy;
- operational limits;
- governance constraints.

Routing must not silently bypass provider restrictions.

---

## 10. Provider Failover

Failover must preserve:

- data policy;
- permissions;
- approval requirements;
- compatibility;
- recovery limits;
- original failure evidence;
- routing traceability.

Failover must not escalate authority.

---

## 11. Agent Identity

Each agent or specialist should have:

- identifier;
- name;
- version;
- purpose;
- owner;
- capabilities;
- operating mode;
- approval requirements;
- provider requirements;
- lifecycle state.

An agent must not operate under an ambiguous identity.

---

## 12. Specialist Agents

Specialist agents focus on defined domains.

Examples may include:

- property operations;
- maintenance;
- helpdesk;
- inventory;
- procurement;
- lease administration;
- resident services;
- financial assistance.

A specialist must remain within registered capability scope.

---

## 13. Capability Registry

Capabilities should define:

- identifier;
- purpose;
- owning agent;
- risk level;
- required permissions;
- required context;
- provider requirements;
- tool requirements;
- approval mode;
- evidence requirements;
- lifecycle state.

Capability registration does not authorize execution.

---

## 14. Planning

Agent planning should identify:

- objective;
- assumptions;
- required context;
- steps;
- tools;
- approval boundaries;
- expected output;
- fallback;
- stop conditions.

A plan is not execution authority.

---

## 15. Collaboration

Multi-agent collaboration may support:

- specialist consultation;
- evidence comparison;
- proposal exchange;
- negotiation;
- consensus;
- supervision.

Collaboration must preserve accountability.

Multiple agreeing agents may still be wrong.

---

## 16. Tool Identity

Each AI tool should define:

- identifier;
- version;
- purpose;
- input contract;
- output contract;
- required permissions;
- side-effect classification;
- timeout;
- retry behaviour;
- approval requirements;
- evidence requirements.

Tool declarations must match implementation.

---

## 17. Tool Execution Context

Every tool execution should include:

- authenticated actor;
- correlation identifier;
- agent identity;
- capability identity;
- permissions;
- property or tenant scope;
- approval reference where required;
- deadline;
- evidence metadata.

Invalid execution context must block execution.

---

## 18. Read-Only and Mutating Tools

Read-only tools must not:

- change persistent state;
- trigger external communication;
- approve actions;
- change permissions;
- activate extensions;
- execute migrations.

Mutating tools require explicit authorization appropriate to their impact.

Indirect mutations still count as mutations.

---

## 19. Human Approval

Human approval is required where risk or policy demands it.

Approval evidence should identify:

- approver;
- authority;
- action;
- scope;
- conditions;
- timestamp;
- correlation identifier;
- expiry where applicable.

AI must never act as the human approver.

---

## 20. Controlled Autonomy

Autonomy may exist only inside an approved boundary.

The boundary should define:

- eligible capabilities;
- eligible tools;
- actor scope;
- property scope;
- risk ceiling;
- confidence threshold;
- cost limit;
- execution limits;
- stop conditions;
- escalation conditions.

Technical capability alone does not authorize autonomy.

---

## 21. Prompt Governance

Prompts influencing governed behaviour should be:

- identified;
- versioned;
- attributable;
- reviewed;
- scoped;
- compatible with approval boundaries;
- free of credentials;
- protected from untrusted override.

Prompts must not silently redefine platform authority.

---

## 22. Prompt Injection

Untrusted content must be treated as data, not authority.

Controls should address:

- direct injection;
- indirect injection;
- malicious documents;
- malicious tool output;
- hidden instructions;
- role impersonation;
- policy-override attempts.

Untrusted content must not override system or governance instructions.

---

## 23. Context Assembly

AI context should be:

- relevant;
- minimal;
- permission-aware;
- scoped;
- attributable;
- token-bounded;
- cost-bounded;
- protected against cross-property leakage;
- protected against cross-tenant leakage.

Context must not include unauthorized data.

---

## 24. Memory

Memory must have declared:

- purpose;
- scope;
- source;
- retention;
- update rules;
- deletion rules;
- access rules;
- auditability.

Persistent memory should not be created by default without policy.

---

## 25. Evidence

AI evidence may include:

- provider;
- model;
- agent;
- specialist;
- capability;
- tools;
- prompt version;
- context scope;
- confidence;
- approval;
- decision;
- execution result;
- correlation identifier.

AI recommendations must not be recorded as human decisions.

---

## 26. Safety

Safety controls should address:

- unauthorized execution;
- data leakage;
- prompt injection;
- hallucination;
- unsafe tool use;
- excessive autonomy;
- fabricated evidence;
- provider compromise;
- recovery loops;
- external communication.

Safety controls should be testable where practical.

---

## 27. Failure and Recovery

Failure handling should preserve:

- original error;
- execution context;
- partial state;
- side effects;
- retry eligibility;
- recovery budget;
- fallback;
- evidence;
- user-facing status.

A failed tool call must not be represented as successful.

---

## 28. Testing

AI testing may include:

- manifest validation;
- provider registration;
- activation;
- routing;
- failover;
- agent registration;
- specialist routing;
- capability selection;
- tool execution;
- approval enforcement;
- prompt-injection resistance;
- audit evidence;
- recovery;
- safety;
- certification.

Test scope must match the governed capability.

---

## 29. Certification

AI certification may cover:

- providers;
- manifests;
- compatibility;
- agents;
- specialists;
- tools;
- prompts;
- approvals;
- safety;
- operations.

Certification scope must be explicit.

Certification does not guarantee correctness in every deployment.

---

## 30. Contribution

AI runtime changes require explicit authorization.

Documentation contributions may clarify existing contracts but must not:

- expand autonomy;
- change approval rules;
- change provider behaviour;
- add hidden tool access;
- redefine safety;
- describe proposed behaviour as implemented.

---

PropertyOS is created, maintained and stewarded by
**Cogzidel Technologies Pvt. Ltd.**
