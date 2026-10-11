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

The applied instruction in `C:/Users/dinhd/.codex/skills/archify/SKILL.md` is: “If two consecutive rounds do not improve that best count, stop and report the unresolved diagnostics truthfully.” The remaining diagnostic is `composition/desktop-readability` for “Giữ lịch sử phiên bản” (projected 5.76px; required 6px). No Archify HTML was delivered, and its browser evidence and visual review were not run.

## Verification

- ESLint and production build passed.
- All 14 existing unit tests passed.
- All 6 workspace browser tests passed, including the complete v1 → v2 flow, keyboard dialog behavior, and all seven screens at 320/768/1024/1440px with no horizontal page overflow or WCAG A/AA violations.
- All 5 login browser tests passed, including those four viewport widths, public demo credentials, keyboard fill, password visibility, pending state, and server authentication errors.
- A separate browser review with the real MySQL database verified demo-account login, all seven screens at 1440px, approved-knowledge lookup, working image assets, WCAG A/AA checks, no JavaScript errors, and logout. It did not create or approve business records.
- The rendered application screenshots were visually reviewed, including desktop screens and mobile overview/login. The final production build uses the backend by default.
- Screenshots and the real-backend review receipt are stored locally in `FE/.local/ui` and excluded from the source archive.
