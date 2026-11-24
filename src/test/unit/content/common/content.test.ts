import { describe, expect, it } from '@jest/globals';

import { generateCommonContent } from '../../../../main/content/common/content';
import { expectLocalizedContentContract } from '../../helpers/localized-content-contract';

describe('common content', () => {
  it('selects localized version of the content', () => {
    expectLocalizedContentContract(
      generateCommonContent,
      content => {
        expect(content.footerLinks.accessibilityStatement).toBe('Accessibility statement');
      },
      content => {
        expect(content.footerLinks.accessibilityStatement).toBe('Datganiad Hygyrchedd');
      }
    );
  });
});
