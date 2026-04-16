import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Record of a single click event during test execution
 */
export type ClickRecord = {
  timestamp: string;
  testName: string;
  selector: string;
  text: string;
  ariaLabel: string;
  url: string;
  elementType: string;
};

/**
 * Tracks all button/link clicks during a test run.
 * Data is written to a JSON file for later analysis.
 */
export class ClickTracker {
  private page: Page;
  private testName: string;

  constructor(page: Page, testName: string) {
    this.page = page;
    this.testName = testName;
  }

  /**
   * Start tracking clicks on interactive elements (buttons, links, checkboxes, etc)
   */
  async startTracking(): Promise<void> {
    await this.page.addInitScript(() => {
      const clicks: ClickRecord[] = [];

      const getSelector = (el: HTMLElement): string => {
        // Try data-testid first (common in React apps)
        const testId = el.getAttribute('data-testid');
        if (testId) {
          return `[data-testid="${testId}"]`;
        }

        // Try ID
        if (el.id) {
          return `#${el.id}`;
        }

        // Build path from ancestors
        const names: string[] = [];
        let curr: HTMLElement | null = el;
        while (curr && curr !== document.documentElement) {
          let name = curr.nodeName.toLowerCase();
          if (curr.id) {
            name += `#${curr.id}`;
            names.unshift(name);
            break;
          } else if (curr.className) {
            name += `.${(curr.className as string).split(' ').join('.')}`;
          }
          names.unshift(name);
          curr = curr.parentElement;
        }

        return names.join(' > ');
      };

      document.addEventListener(
        'click',
        (event) => {
          const target = event.target as HTMLElement;
          const interactive = target?.closest(
            'button, a, input[type="checkbox"], input[type="radio"], [role="button"], [role="link"], label'
          );

          if (!interactive) {
            return;
          }

          clicks.push({
            selector: getSelector(interactive),
            text: (interactive.textContent || '').trim().slice(0, 100),
            ariaLabel: interactive.getAttribute('aria-label') || '',
            elementType: interactive.tagName,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            testName: '',
          } as ClickRecord);

          // Store in window for access from Playwright
          (window as unknown as Record<string, unknown>).__clickTracker = clicks;
        },
        true
      );
    });
  }

  /**
   * Get all recorded clicks from the page context
   */
  async getClicks(): Promise<ClickRecord[]> {
    return (
      (await this.page.evaluate(
        () => (window as unknown as Record<string, unknown>).__clickTracker
      )) || []
    );
  }

  /**
   * Save clicks to a JSON file for analysis
   */
  async saveReport(outputDir: string = 'coverage'): Promise<string> {
    const clicks = await this.getClicks();
    const reportPath = path.join(
      outputDir,
      'click-coverage',
      `${this.sanitizeName(this.testName)}.json`
    );

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(clicks, null, 2));

    return reportPath;
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
}
