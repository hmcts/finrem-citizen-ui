import { describe, expect, it } from '@jest/globals';

import { generateAccessibilityStatementContent } from '../../../../main/views/accessibility-statement/content';
import { expectLocalizedContentContract } from '../../helpers/localized-content-contract';

describe('accessibility statement content', () => {
  it('selects localized version of the content', () => {
    expectLocalizedContentContract(
      generateAccessibilityStatementContent,
      content => {
        expect(content.title).toContain('Accessibility statement');
      },
      content => {
        expect(content.title).toContain('Datganiad hygyrchedd');
      }
    );
  });
});
