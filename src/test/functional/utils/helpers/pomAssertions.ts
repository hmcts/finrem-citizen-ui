import { expect, Locator } from '@playwright/test';

export interface AttributeAssertion {
  locator: Locator;
  name: string;
  value: string;
}

// Assert every locator in the list is visible
export async function expectVisible(locators: Locator[]): Promise<void> {
  for (const locator of locators) {
    await expect(locator).toBeVisible();
  }
}

// Assert each locator has the expected attribute value
export async function expectAttributes(assertions: AttributeAssertion[]): Promise<void> {
  for (const { locator, name, value } of assertions) {
    await expect(locator).toHaveAttribute(name, value);
  }
}

export async function expectValidationError(
  errorSummaryTitle: Locator,
  errorSummary: Locator,
  fieldError: Locator,
  message: string | RegExp
): Promise<void> {
  await expectVisible([
    errorSummaryTitle,
    errorSummary.getByRole('link', { name: message }),
  ]);
  await expect(fieldError).toContainText(message);
}

export async function expectNoSpecificValidationErrors(
  errorSummary: Locator,
  messages: string[]
): Promise<void> {
  for (const message of messages) {
    await expect(errorSummary.getByRole('link', { name: message })).not.toBeVisible();
  }
}
