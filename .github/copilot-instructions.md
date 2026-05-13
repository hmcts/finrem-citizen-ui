# Copilot Repository Instructions

## Source of truth
- Read and follow `README.md` first for project-level rules and commands.
- Read and follow `src/test/functional/specFiles/README.md` for functional test organization, labels, and environment gating.
- When there is conflict, prefer the most specific document closest to the code being edited.

## Ignore and scope rules
- Respect `.copilotignore` and `.gitignore` when searching or suggesting edits.
- Do not propose changes in ignored paths unless the user explicitly asks.
- Keep edits scoped to the files required for the request.

## Testing conventions for this repo
- Preserve the split between mock and integration suites under `src/test/functional/specFiles/`.
- Mock tests:
  - Must use `test.use({ useMockTestSupport: true })` when relying on test-support routes.
  - Use `injectCaseSession()` only in mock scenarios.
- Integration tests:
  - Must not use mock session injection routes.
  - Respect `ACCESS_CODE_REAL_INTEGRATION` gating where applicable.
- Prefer suite-level `test.skip(...)` over per-test skip when the same condition applies to the whole suite.

## Accessibility standards
- Any functional UI behavior test should include accessibility coverage unless explicitly out of scope.
- Include `@a11y` in test names when accessibility is asserted.
- Use:
  - `await axeUtils.audit(DEFAULT_AXE_OPTIONS);`
- Keep accessibility assertions aligned with existing fixture usage in `src/test/fixtures/fixtures.ts`.

## Smoke test standards
- Keep smoke checks in `src/test/smoke/smoke.ts` focused on route availability and redirect behavior.
- Keep route entries aligned with `src/main/common-constants.ts` and upload journey steps.
- Protected routes should assert expected login redirects.

## DRY and structure rules
- Reuse existing helpers before introducing new ones:
  - Journey setup helpers in `src/test/functional/specFiles/journeyHelpers/`
  - Generic assertion helpers in `src/test/functional/utils/helpers/`
- Prefer extending existing page objects and helper modules over duplicating logic in spec files.
- Avoid introducing one-off helpers when a shared helper can be composed.

## Change quality checklist
- Keep naming consistent with current patterns (`[mock]`, `[integration]`, `[integration-happy-path]`, `@a11y`).
- Update related docs when behavior, structure, or helper names change.
- Run targeted lint/tests for changed files before finalizing.
- Do not refactor unrelated files.

## Preferred response behavior
- Provide concrete, minimal patches.
- Explain why changes are needed when touching test gates, accessibility, or route coverage.
- If unsure, ask one focused clarification question rather than guessing.
