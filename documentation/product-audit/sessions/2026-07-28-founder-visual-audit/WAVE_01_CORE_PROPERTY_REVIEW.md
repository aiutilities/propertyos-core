# Founder Visual Audit — Wave 1

## Scope

Wave 1 reviews the platform entry experience and the complete Property setup
journey.

## Review Order

| Order | Route | Purpose |
|---:|---|---|
| 1 | `/` | Public platform entry |
| 2 | `/login` | Authentication experience |
| 3 | `/dashboard` | Administrative command centre |
| 4 | `/properties` | Property list and discovery |
| 5 | `/properties/new` | Property creation |
| 6 | `/properties/[id]` | Property details |
| 7 | `/properties/[id]/edit` | Property editing |
| 8 | `/properties/[id]/zones` | Zone management |
| 9 | `/properties/[id]/zones/new` | Zone creation |
| 10 | `/properties/[id]/spaces` | Space management |
| 11 | `/properties/[id]/spaces/new` | Space creation |

Dynamic routes must be opened using a real PropertyOS record ID obtained from
the application. Do not invent IDs.

## Founder Questions

For every screen:

1. Does it look professional?
2. Does it feel intuitive?
3. Can a first-time user understand it?
4. Would the founder confidently demonstrate it to a customer or investor?
5. Is the next action obvious?
6. Is any information missing or unnecessarily technical?
7. Does the page behave correctly during loading, success, empty and error
   states?

## Scoring

| Score | Classification |
|---:|---|
| 5 | Production Ready |
| 4 | Needs Polish |
| 3 | Acceptable |
| 2 | Pilot Blocker |
| 1 | Broken |
| 0 | Cannot Review |

## Defect Priority

| Priority | Meaning |
|---|---|
| P0 | Application failure or data-integrity risk |
| P1 | Pilot workflow blocker |
| P2 | Significant workflow or usability issue |
| P3 | Minor visual or usability issue |
| P4 | Future enhancement |

## Existing Findings To Revalidate

### `/`

Current classification: Needs Polish.

Existing observation:

The page is visually clean but does not yet communicate the platform's
differentiators, supported property types, documentation, marketplace,
version or open-source community.

### `/login`

Current classification: Production Ready.

Revalidate that:

- fields begin empty;
- validation is understandable;
- invalid login gives clear feedback;
- successful login leads to the correct destination.

### `/dashboard`

Current classification: Production Ready.

Revalidate that:

- exceptions and actions are prioritised;
- loading states are structured;
- the page clearly tells the administrator what requires attention.

### `/properties/new`

Current classification: Pilot Blocker.

Existing observation:

- sticky shell header overlaps form fields during scrolling;
- the long form lacks semantic sections;
- required fields are not sufficiently explained;
- a clear cancel action is missing.

## Mutation Rules

During Wave 1:

- repository source mutation is forbidden;
- database migration is forbidden;
- destructive deletion is forbidden;
- test records may be created only when required for the walkthrough;
- every test record must be clearly identifiable and removable;
- defects must be recorded before remediation starts.

## Completion Criteria

Wave 1 is complete when:

- all 11 routes have been reviewed;
- every route has a score and status;
- all blockers have defect records;
- dynamic Property routes have been reviewed with a real record;
- screenshots are indexed where they materially explain a defect;
- pilot blockers are separated from polish items.
