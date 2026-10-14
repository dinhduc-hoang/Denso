# Plan: DENSO interface refresh

Requested 2026-10-14: survey the existing application and DENSO website, use Mobbin references, implement a modern interface using Meta Astryx and the supplied Quicksand_Complete font. The user explicitly authorized planning and implementation in the same request.

## Evidence and design contract

- Existing React/Vite application: seven pages; backend login and standalone demo; existing approval, retrieval, escalation, revision and export workflows.
- Browser survey: existing login and dashboard have a dark navy sidebar, tall introductory card, nested cards and small secondary text. Preserve working interactions while improving information hierarchy.
- DENSO: https://www.denso.com/global/en/ — inspected through Chrome DevTools MCP. Use red accents, strong typographic contrast, white surfaces and restrained industrial geometry. Do not reuse corporate media.
- Mobbin screens inspected: [Plane](https://mobbin.com/screens/0dd9ff7e-b7b6-4ec1-9bd2-9e403fc687ec), [ClickUp](https://mobbin.com/screens/2802e4dc-5a33-4b61-b556-7008bffeeb2f), [Wrike](https://mobbin.com/screens/a34c0ecc-afaa-48fc-8230-8a1e436188cb). Adapt sidebar grouping, summary metric hierarchy and operational task emphasis; do not copy assets or branding.
- Astryx official implementation guide: https://github.com/facebook/astryx/tree/main/packages/core. Pin npm packages; use prebuilt CSS, the neutral Theme provider, and real Astryx primitives with DENSO token overrides.
- Typography: self-host the supplied Quicksand variable WOFF2, weights 300–700, preserve OFL license. No third-party font requests.
- Screen job: make the next step of the meeting-to-shopfloor loop obvious. Primary action starts a meeting; contextual actions open approval, knowledge and shopfloor guidance.
- Responsive: white sidebar on desktop; horizontally scrollable navigation on mobile, stacked panels, readable forms, local table scrolling. Verify 320/768/1024/1440px.
- States: retain actual server/demo counts, locked states, processing, empty/error states, approval gates, keyboard focus and accessible dialogs.

## Ordered implementation

1. Survey and capture all seven existing screens, document references and save before images. Verify live rendering and record environment constraints.
2. Integrate Astryx provider/CSS and compatible shared Button/Card/Badge primitives. Verify existing interaction tests and build; retain native form semantics and link downloads.
3. Apply Quicksand and DENSO tokens; refresh sidebar/topbar and login. Verify login states, font loading and responsive geometry.
4. Redesign overview as an operational workspace: editorial welcome, concise dark feature panel, contextual next steps, honest metrics and compact workflow access. Verify actions reflect existing state.
5. Validate all seven pages with existing unit, Playwright workflow, responsive and axe tests. Compare screenshots in MCP; record results and outstanding limitations.

## Risks and mitigations

- The workspace already contains extensive backend/deployment changes: keep them intact and limit implementation to FE plus these task documents.
- MCP Playwright is not exposed; Node REPL MCP fails with missing sandboxPolicy. Use Chrome DevTools MCP for interactive survey and the installed Playwright runner for automated browser checks.
- Windows Application Control blocks native Rollup. Use a temporary WebAssembly parser shim inside ignored node_modules; do not ship the shim as an application change.
- Astryx has different prop conventions: adapt only the shared primitives actually used, then run existing workflow and accessibility regression tests.
- Avoid replacing an existing plan: no tasks/plan.md or tasks/todo.md existed when this plan was created.

## Verification

See tasks/todo.md for acceptance criteria, dependencies and final verification results. Browser screenshots are stored under FE/.local/ui-audit/.
