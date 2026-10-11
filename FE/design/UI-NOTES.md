# Meeting-to-Shopfloor UI

The workspace helps reviewers turn meeting decisions into approved instructions and helps operators find guidance or request engineering support.

## Visual contract

- Keep the existing DENSO red accent. Use a deep slate navigation surface, white content surfaces, and a quiet gray workspace background.
- Make the active page, primary action, approval state, and field labels easy to identify. Preserve all workflow actions and permission states.
- Use one main heading per screen, consistent control sizes, modest corner radii, and restrained shadows.
- At 320px the navigation scrolls within its own region and content stacks. At 768px the sidebar appears. Wide screens use two content columns where useful.
- Keep the public demo credentials visible below the login form. A fill button populates the fields without submitting them.
- Use the repository's existing screens as design references. Avoid invented metrics, unavailable integrations, and decorative controls with no action.

## Archify exploration

`shopfloor.workflow.json` records the real meeting → report → approval → knowledge → operator → feedback flow, including engineering escalation and revision approval.

The Archify showcase checker passed all nine artifact checks but did not accept desktop readability of the Vietnamese node context. Two focused repairs did not reduce the remaining composition error count, so the exploration was stopped under the skill's repair limit. The existing application workflow SVG remains the delivered diagram. This draft is not a validated or published Archify artifact.
