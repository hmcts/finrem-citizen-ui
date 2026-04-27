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
