# POM Assertion Helpers

## Quick Reference

Centralized assertion helpers in `src/test/functional/utils/helpers/pomAssertions.ts` reduce duplication and keep tests DRY.

### `expectVisible(locators: Locator[])`
Assert multiple elements are visible in one call.

### `expectAttributes(assertions: AttributeAssertion[])`
Assert multiple attribute values at once. Interface:
```typescript
interface AttributeAssertion {
  locator: Locator;
  name: string;
  value: string;
}
```

---

## Usage Patterns

### In POMs Extending `BasePage`
```typescript
async verifyContent(): Promise<void> {
  await this.expectVisible([this.header, this.button, this.link]);
  await this.expectAttributes([
    { locator: this.button, name: 'type', value: 'submit' },
    { locator: this.link, name: 'href', value: '/next-page' },
  ]);
}
```

### In Standalone POMs
```typescript
import { expectVisible, expectAttributes } from '../utils/helpers/pomAssertions';

async verifyContent(): Promise<void> {
  await expectVisible([this.header, this.button]);
  await expectAttributes([
    { locator: this.button, name: 'type', value: 'submit' },
  ]);
}
```

---

## Best Practices

1. **Group related checks** — Keep visibility assertions for the same logical section together
2. **Use constants for URLs** — Define external links at the top of your POM:
   ```typescript
   const EXTERNAL_LINKS = {
     PRIVACY: 'https://example.com/privacy',
   };
   ```
3. **Keep methods focused** — Verify one feature per method, not the entire page
4. **Be consistent** — Use helpers for all visibility/attribute checks; don't mix with raw `expect()` calls

---

## Example

```typescript
const EXTERNAL_LINKS = {
  HELP: 'https://gov.uk/help',
};

export class MyPage extends BasePage {
  async verifyExternalLink(): Promise<void> {
    await this.expectVisible([this.helpLink]);
    await this.expectAttributes([
      { locator: this.helpLink, name: 'href', value: EXTERNAL_LINKS.HELP },
      { locator: this.helpLink, name: 'target', value: '_blank' },
      { locator: this.helpLink, name: 'rel', value: 'noopener noreferrer' },
    ]);
  }
}
```

---

## Migration: Before & After

**Before (Repetitive):**
```typescript
async verify(): Promise<void> {
  await expect(this.header).toBeVisible();
  await expect(this.button).toBeVisible();
  await expect(this.button).toHaveAttribute('type', 'submit');
  await expect(this.link).toHaveAttribute('href', '/next');
}
```

**After (Using Helpers):**
```typescript
async verify(): Promise<void> {
  await this.expectVisible([this.header, this.button]);
  await this.expectAttributes([
    { locator: this.button, name: 'type', value: 'submit' },
    { locator: this.link, name: 'href', value: '/next' },
  ]);
}
```

---

## See Also
- `src/test/functional/pom/confidentialityPage.page.ts` — Comprehensive example
- `src/test/functional/pom/basePage.page.ts` — Base helper implementations
- `src/test/functional/pom/enterAccessCode.page.ts` — Standalone POM example
