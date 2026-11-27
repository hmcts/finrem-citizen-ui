import { describe, expect, it } from '@jest/globals';

import { generateContactUsContent } from '../../../../main/views/contact-us/content';
import { expectLocalizedContentContract } from '../../helpers/localized-content-contract';

describe('contact us content', () => {
  it('selects localized version of the content', () => {
    expectLocalizedContentContract(
      generateContactUsContent,
      content => {
        expect(content.title).toBe('Contact us');
      },
      content => {
        expect(content.title).toBe('Cysylltu â ni');
      }
    );
  });
});
