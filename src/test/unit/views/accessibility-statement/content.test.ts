import { describe, expect, it } from '@jest/globals';

import { SupportedLanguages } from '../../../../main/modules/i18n';
import { generateAccessibilityStatementContent } from '../../../../main/views/accessibility-statement/content';

describe('accessibility statement localized content', () => {
  it('returns english content when en is selected', () => {
    const content = generateAccessibilityStatementContent(SupportedLanguages.En);

    expect(content.title).toContain('Accessibility statement');
  });

  it('returns welsh content when cy is selected', () => {
    const content = generateAccessibilityStatementContent(SupportedLanguages.Cy);

    expect(content.title).toContain('Datganiad hygyrchedd');
  });

  it('falls back to english for unsupported language', () => {
    const content = generateAccessibilityStatementContent('es' as SupportedLanguages);

    expect(content.title).toContain('Accessibility statement');
  });

  it('falls back to english for missing language', () => {
    const content = generateAccessibilityStatementContent('' as SupportedLanguages);

    expect(content.title).toContain('Accessibility statement');
  });
});
