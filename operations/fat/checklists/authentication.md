# PropertyOS FAT — Authentication and Authorization

## Preconditions

- [ ] Isolated environment is active.
- [ ] Test administrator exists.
- [ ] Test users and roles are defined.

## Acceptance Checks

- [ ] Valid login succeeds.
- [ ] Invalid login fails.
- [ ] Expired or invalid token is rejected.
- [ ] Authenticated profile retrieval succeeds.
- [ ] Unauthorized route access is denied.
- [ ] Role-based access is enforced.
- [ ] Administrator-only action is protected.
- [ ] Non-administrator permissions remain restricted.
- [ ] Logout or token invalidation behaves as designed.
- [ ] Rate limiting behaves as designed.

## Evidence

- [ ] Successful authentication evidence is preserved.
- [ ] Rejected authentication evidence is preserved.
- [ ] Authorization-denial evidence is preserved.
- [ ] Founder result is recorded.

## Safety Boundary

Use test accounts only. This checklist does not authorize production credential use.
