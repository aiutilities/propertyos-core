# PropertyOS AI Working Agreement

## Session Classification

Every new AI conversation is a continuation session unless the founder explicitly declares an architecture or planning session.

The AI must not restart project planning.

The AI must continue from the repository state recorded in PROJECT_STATE.md.

## Required Reading Order

Before implementation, read:

1. PROJECT_CONSTITUTION.md
2. PROJECT_STATE.md
3. PROJECT_JOURNAL.md
4. current architecture specification
5. current PRD
6. current diagrams
7. current repository snapshot when supplied

If the documents and implementation are aligned, continue immediately.

Do not repeat a broad architecture assessment during every session.

## Implementation Behaviour

Work as an AI development agent.

Prefer executable commands such as:

- shell commands
- Python patch scripts
- cat commands
- grep
- sed
- find
- git
- npm
- test commands

Do not provide only narrative instructions such as:

- create this file
- edit this method
- update this module

Commands must be safe to paste into zsh.

Keep commands reasonably small.

Avoid excessively large heredocs or fragile shell expressions.

When a command fails, correct only the confirmed failure.

Do not replace working implementation merely to obtain a preferred style.

## Continuity Rules

Never:

- redesign mature modules
- invent new roadmap phases
- rename existing phases
- change phase numbering
- reorder the roadmap
- reopen completed milestones without evidence
- claim a mature module needs work without inspecting it
- introduce a parallel service for an existing platform capability
- create speculative backlog work during execution
- convert an implementation session into a planning session

Assume completed modules are mature unless:

- a test fails
- a defect is demonstrated
- a security issue is confirmed
- the current phase explicitly requires integration with the module

## Scope Rules

Before modifying files:

- verify current HEAD
- verify repository status
- define expected changed files
- reject unexpected existing changes

After modifying files:

- validate changed-file scope
- run git diff --check
- run typecheck
- run build
- run targeted tests
- run relevant regression tests

Before committing:

- stage only expected files
- verify staged-file scope
- inspect staged diff statistics

After committing:

- verify commit parent
- verify committed-file scope
- verify repository is clean
- record the commit in PROJECT_JOURNAL.md
- update PROJECT_STATE.md

## Database and Runtime Safety

Do not mutate a database unless the current phase explicitly requires it.

Do not:

- push remote branches
- publish packages
- deploy production
- expose executors
- rotate secrets
- send external messages

unless explicitly authorised.

## Handover Rule

At the end of every chat:

- update PROJECT_STATE.md
- append PROJECT_JOURNAL.md
- record current branch
- record exact HEAD
- record repository cleanliness
- record completed phase
- record next phase
- record tests and validation evidence
- record active risks or blockers

The repository governance files are the source of truth for the next chat.

Chat memory is supplementary only.
