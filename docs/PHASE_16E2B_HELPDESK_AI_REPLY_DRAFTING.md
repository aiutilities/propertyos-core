# Phase 16E2B — Helpdesk AI reply drafting

## Objective

Add advisory AI-assisted reply drafting to the PropertyOS Helpdesk module through the stable PropertyOS AI SDK boundary.

## Endpoint

POST /helpdesk/draft-reply

## Behaviour

The endpoint generates a suggested customer response containing:

- subject
- reply
- confidence
- tone

The supported tones are:

- professional
- friendly
- empathetic

## AI boundary

HelpdeskAiReplyService
→ PropertyOsAiSdkService
→ AI orchestration

The Helpdesk module does not directly depend on provider implementations or AiOrchestratorService.

## Safety

- advisory only
- simulated execution by default
- internal data classification
- agent review required before sending
- no email or notification is sent
- no helpdesk comment is created
- no ticket is updated
- no workflow transition occurs
- no dates, costs, approvals, or commitments may be invented
- completed actions may only be stated when supplied in internal notes
- validated structured output
- controlled SDK failure mapping

## Validation

- focused integration suite passed
- 5 focused tests passed
