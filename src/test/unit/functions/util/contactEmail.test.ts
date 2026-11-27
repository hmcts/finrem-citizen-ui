import { describe, expect, it } from '@jest/globals';
import type { Request } from 'express';

import { resolveContactEmail } from '../../../../main/functions/util/contactEmail';

describe('resolveContactEmail', () => {
  it('prefers preserved contact email, then case data email, then default email', () => {
    const withPreserved = {
      session: {
        lang: 'en',
        preservedContactEmail: 'preserved.contact@justice.gov.uk',
        caseData: { consentOrderFRCEmail: 'case.contact@justice.gov.uk' },
      },
    } as unknown as Request;

    const withCaseData = {
      session: {
        lang: 'en',
        caseData: { consentOrderFRCEmail: 'case.contact@justice.gov.uk' },
      },
    } as unknown as Request;

    const withFallbackOnly = {
      session: { lang: 'en' },
    } as unknown as Request;

    expect(resolveContactEmail(withPreserved)).toBe('preserved.contact@justice.gov.uk');
    expect(resolveContactEmail(withCaseData)).toBe('case.contact@justice.gov.uk');
    expect(resolveContactEmail(withFallbackOnly)).toBe('HMCTSFinancialRemedy@justice.gov.uk');
  });
});
