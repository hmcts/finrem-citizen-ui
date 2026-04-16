import * as fs from 'fs';
import * as path from 'path';

type ClickData = {
  selector: string;
  text: string;
  timestamp: string;
};

type TestClickData = {
  test: string;
  clicks: ClickData[];
};

/**
 * Aggregates click-tracker JSON files and generates an HTML report
 * showing which UI elements were interacted with during test runs.
 */
export class CoverageReportGenerator {
  private clickDir: string;
  private reportDir: string;
  private buildId: string;

  constructor(clickDir: string = 'coverage/click-coverage', reportDir: string = 'coverage/reports') {
    this.clickDir = clickDir;
    this.reportDir = reportDir;
    // Use Jenkins BUILD_NUMBER if available, otherwise use timestamp
    this.buildId = process.env.BUILD_NUMBER || `build-${Date.now()}`;
  }

  /**
   * Generate an HTML report from all click-tracker JSON files
   */
  generate(): string {
    fs.mkdirSync(this.reportDir, { recursive: true });

    // Skip gracefully when no click data has been produced yet.
    if (!fs.existsSync(this.clickDir)) {
      // eslint-disable-next-line no-console
      console.log(`No click coverage data found at ${this.clickDir}. Skipping UI coverage report.`);
      return '';
    }

    // Read all click data files
    const clickFiles = fs.readdirSync(this.clickDir).filter((f) => f.endsWith('.json'));
    if (clickFiles.length === 0) {
      // eslint-disable-next-line no-console
      console.log(`No click coverage JSON files found in ${this.clickDir}. Skipping UI coverage report.`);
      return '';
    }

    const allClicks: TestClickData[] = [];
    const elementsCovered = new Set<string>();

    for (const file of clickFiles) {
      const content = JSON.parse(fs.readFileSync(path.join(this.clickDir, file), 'utf-8')) as ClickData[];
      allClicks.push({ test: file.replace('.json', ''), clicks: content });

      // Aggregate unique elements
      for (const click of content) {
        elementsCovered.add(JSON.stringify({ selector: click.selector, text: click.text }));
      }
    }

    const html = this.generateHtml(allClicks, Array.from(elementsCovered));
    const reportPath = path.join(this.reportDir, `ui-coverage-${this.buildId}.html`);
    fs.writeFileSync(reportPath, html);

    // eslint-disable-next-line no-console
    console.log(`✅ UI Coverage Report generated: ${reportPath}`);
    return reportPath;
  }

  private generateHtml(allClicks: TestClickData[], coveredElements: string[]): string {
    const timestamp = new Date().toISOString();
    const testCount = allClicks.length;
    const clickCount = allClicks.reduce((sum, t) => sum + t.clicks.length, 0);

    const elementRows = coveredElements.map((elem) => {
      const elemData = JSON.parse(elem) as { selector: string; text: string };
      const timesCovered = allClicks.reduce((count, test) => {
        return count + test.clicks.filter((c) => c.selector === elemData.selector).length;
      }, 0);

      return `
        <tr>
          <td class="selector"><code>${this.escapeHtml(elemData.selector)}</code></td>
          <td class="text">${this.escapeHtml(elemData.text)}</td>
          <td class="count">${timesCovered}</td>
        </tr>
      `;
    });

    const testDetails = allClicks.map((test) => {
      const clickRows = test.clicks
        .map(
          (click) => `
        <div class="click-event">
          <strong>${this.escapeHtml(click.selector)}</strong><br>
          <small>Text: ${this.escapeHtml(click.text)}</small><br>
          <small>Time: ${click.timestamp}</small>
        </div>
          `
        )
        .join('');

      return `
        <section class="test-section">
          <h3>${this.escapeHtml(test.test)}</h3>
          <p><strong>Clicks: ${test.clicks.length}</strong></p>
          <div class="clicks">${clickRows || '<p>No clicks recorded</p>'}</div>
        </section>
      `;
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UI Coverage Report</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
            margin: 0 0 8px;
          }
          .meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid #eee;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
          }
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          }
          .stat-card .number {
            font-size: 24px;
            font-weight: bold;
          }
          .stat-card .label {
            font-size: 12px;
            opacity: 0.9;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          th {
            background: #f9f9f9;
            font-weight: 600;
            color: #333;
          }
          tr:hover {
            background: #f5f9ff;
          }
          .selector code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', monospace;
            font-size: 12px;
            color: #d63384;
          }
          .count {
            text-align: center;
            font-weight: 600;
            color: #667eea;
          }
          .test-details {
            margin-bottom: 32px;
          }
          .test-section {
            background: #f9f9f9;
            padding: 16px;
            margin-bottom: 16px;
            border-left: 4px solid #667eea;
            border-radius: 4px;
          }
          .test-section h3 {
            margin: 0 0 12px;
            color: #333;
          }
          .test-section p {
            margin: 0 0 12px;
            color: #666;
          }
          .clicks {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .click-event {
            background: white;
            padding: 8px 12px;
            border-left: 3px solid #667eea;
            font-size: 13px;
            border-radius: 3px;
          }
          .click-event strong {
            color: #333;
            display: block;
            margin-bottom: 4px;
          }
          .click-event small {
            color: #999;
            display: block;
            margin-bottom: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎯 UI Coverage Report</h1>
          <div class="meta">
            <p>Generated: ${timestamp}</p>
            <p>Report shows which UI elements (buttons, links, etc.) were interacted with during test execution.</p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="number">${testCount}</div>
              <div class="label">Tests</div>
            </div>
            <div class="stat-card">
              <div class="number">${clickCount}</div>
              <div class="label">Total Clicks</div>
            </div>
            <div class="stat-card">
              <div class="number">${coveredElements.length}</div>
              <div class="label">Unique Elements</div>
            </div>
            <div class="stat-card">
              <div class="number">${(clickCount / testCount).toFixed(1)}</div>
              <div class="label">Avg Clicks/Test</div>
            </div>
          </div>

          <h2>Coverage Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Selector</th>
                <th>Element Text</th>
                <th>Times Clicked</th>
              </tr>
            </thead>
            <tbody>
              ${elementRows.join('')}
            </tbody>
          </table>

          <h2>Test Details</h2>
          <div class="test-details">
            ${testDetails.join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }
}
