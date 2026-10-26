import { describe, expect, test } from '@jest/globals';
import nunjucks from 'nunjucks';
import path from 'path';

const govukTemplates = path.join(
  path.dirname(require.resolve('govuk-frontend/package.json')),
  'dist'
);
const viewsPath = path.resolve(process.cwd(), 'src/main/views');
const env = nunjucks.configure([govukTemplates, viewsPath], {
  autoescape: true,
  noCache: true,
});

env.addFilter('formatCaseNumber', (caseNumber: string): string => {
  if (!caseNumber) {
    return '';
  }

  return caseNumber.replace(/(\d{4})(?=\d)/g, '$1-');
});

const renderDashboard = (overrides: Record<string, unknown> = {}): string =>
  env.render('dashboard.njk', {
    userName: 'Test User',
    caseNumber: 'CASE123',
    isRepresented: false,
    hasDivorceCase: false,
    showPreviouslyUploaded: true,
    contactEmail: 'test@example.com',
    ...overrides,
  }
);

describe('Dashboard Views', () => {
  test('renders heading and case number', () => {
    const output = renderDashboard();

    expect(output).toContain('Dashboard');
    expect(output).toContain('Test User');
    expect(output).toContain('Case number');
  });

  test('shows divorce account inset when hasDivorceCase is true', () => {
    const output = renderDashboard({ hasDivorceCase: true });

    expect(output).toContain('This is your financial remedy account');
    expect(output).toContain('go to your divorce account');
  });

  test('hides divorce account inset when hasDivorceCase is false', () => {
    const output = renderDashboard({ hasDivorceCase: false });

    expect(output).not.toContain('This is your financial remedy account');
  });

  test('shows represented message and hides upload CTA when isRepresented is true', () => {
    const output = renderDashboard({ isRepresented: true });

    expect(output).toContain('You no longer have access to this case');
    expect(output).not.toContain('Go to document upload');
  });

  test('shows upload CTA when isRepresented is false', () => {
    const output = renderDashboard({ isRepresented: false });

    expect(output).toContain('Go to document upload');
    expect(output).not.toContain('You no longer have access to this case');
  });

  test('shows previously uploaded documents link when enabled', () => {
    const output = renderDashboard({ showPreviouslyUploaded: true });

    expect(output).toContain('View previously uploaded documents');
  });

  test('hides previously uploaded documents link when disabled', () => {
    const output = renderDashboard({ showPreviouslyUploaded: false });

    expect(output).not.toContain('View previously uploaded documents');
  });
});