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

## POM (Page Object Model) standards – Playwright Best Practices
### Locator Priority (user-facing first)
1. **`getByRole()`** – Locates by ARIA role (buttons, links, headings, lists, listitem, etc.)
   - Closest to how users perceive the page
   - Include accessible name when needed: `getByRole('button', { name: 'Sign in' })`
2. **`getByLabel()`** – For form controls with associated labels
3. **`getByText()`** – For text content (divs, spans, p tags); use with `{ exact: true }` when precision needed
4. **`getByPlaceholder()`** – For inputs with placeholder text
5. **`getByAltText()`** – For images and area elements with alt text
6. **`getByTitle()`** – For elements with title attribute
7. **`getByTestId()`** – Only when explicit `data-testid` contract exists; not user-facing
8. **Avoid CSS/XPath** – Only as absolute last resort; brittle and unmaintainable

### Specific Guidelines
- Replace ID-based selectors: `locator('#error-id')` → `getByRole('status')` or `getByRole('alert')`
- Replace CSS class selectors: `locator('.govuk-list--bullet')` → `getByRole('list')`
- Replace list item selectors: `locator('li')` → `getByRole('listitem')`
- Use attribute matching only for semantic attributes: `locator('a[href="/path"]')`, `locator('a[target="_blank"]')`
- Avoid attribute selectors for styling: Never use `locator('[class*="govuk"]')`
- Never use XPath locators in this repo. If a locator is hard to express, refactor to chained role/text/label locators instead.

### Locator Filtering and Composition
- Chain locators for specificity: `page.getByRole('listitem').filter({ hasText: 'Product 2' }).getByRole('button', { name: 'Add' })`
- Use `.filter({ has: otherLocator })` for element relationships
- Use `.or()` for fallback locators: `getByRole('link').or(getByTestId('fallback-link'))`
- Use `.first()`, `.last()`, `.nth()` only when order is semantically meaningful (avoid relying on DOM position)

## Test Assertion Standards – Playwright Best Practices
### Auto-Retrying Assertions (Preferred)
Always use async assertions with `await` – they retry until the condition is met or timeout expires (default 5s):
- `await expect(locator).toBeVisible()` – Element is visible on page
- `await expect(locator).toHaveText(text)` – Element text matches
- `await expect(locator).toHaveCount(n)` – List has exact count of children
- `await expect(locator).toBeEnabled()` / `toBeDisabled()` – Button state
- `await expect(locator).toBeChecked()` – Checkbox state
- `await expect(locator).toHaveAttribute(name, value)` – DOM attributes
- `await expect(locator).toContainText(text)` – Partial text match
- `await expect(locator).toHaveValue(value)` – Input value
- `await expect(page).toHaveURL(url)` – Page URL
- `await expect(page).toHaveTitle(title)` – Page title

### Non-Retrying Assertions (Use Cautiously)
Avoid unless needed for simple logic – they do NOT retry and cause flaky tests:
- `expect(value).toBe(n)` – Strict equality (non-retrying)
- `expect(value).toEqual(obj)` – Deep equality (non-retrying)
- Use auto-retrying alternatives when testing page state

### Advanced Retry Patterns
- **Soft assertions**: `await expect.soft(locator).toHaveText('text')` – Test continues on failure, marked as failed
- **expect.poll()**: Retry custom logic: `await expect.poll(async () => { return fetchData(); }, { timeout: 10000 }).toBe(expected)`
- **expect.toPass()**: Retry entire block: `await expect(async () => { await page.goto(); expect(status).toBe(200); }).toPass()`

### Custom Messages
Add context to assertions: `await expect(locator, 'should show success message').toBeVisible()`

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

## Spec file responsibilities (orchestration only)
- Keep spec files focused on scenario orchestration: arrange data, call helper/POM methods, assert outcomes.
- Do not place repeated navigation/setup logic directly in spec files; move it to `journeyHelpers/`.
- Do not place locator-level UI logic in spec files; keep selectors and interactions in POMs/components.
- Keep assertion wrappers in shared helpers when the same assertion pattern is used across multiple suites.

## Copilot enforcement rules
- When editing tests, always search for an existing helper first and reuse it where possible.
- If 2+ specs repeat the same setup/assertion flow, extract or extend a helper before adding more duplication.
- Prefer small helper abstractions with clear names over inline multi-step logic.
- Keep helper functions single-purpose and composable so specs remain readable and DRY.

## Change quality checklist
- Keep naming consistent with current patterns (`[mock]`, `[integration]`, `[integration-happy-path]`, `@a11y`).
- Update related docs when behavior, structure, or helper names change.
- Run targeted lint/tests for changed files before finalizing.
- Do not refactor unrelated files.

## Preferred response behavior
- Provide concrete, minimal patches.
- Explain why changes are needed when touching test gates, accessibility, or route coverage.
- If unsure, ask one focused clarification question rather than guessing.
