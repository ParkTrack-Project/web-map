# A11Y backlog (serious + moderate)

Phase 5 D-26: critical issues block merge; serious/moderate accumulate here for v1.x cleanup.

## How to fill this list

1. Run `cd web-map && npx playwright test tests/e2e/a11y.spec.ts`
2. axe results console-warn lines starting with `[a11y backlog]` indicate serious findings per flow
3. Open the Playwright HTML report: `npx playwright show-report`
4. For each serious violation: id, impact, target nodes, recommendation
5. Add to «Open issues» section below as: `- [ ] {flow} / {axe-rule-id} / {nodes count} / {brief}`

## Open issues

(To be filled by Plan 05-05 UAT and v1.x review.)

## Closed (fixed in Phase 5)

- (Critical issues resolved at Plan 05-04 commit, list here as «- {axe-rule-id} fixed by {file}» if any encountered.)
