import { describe, expect, it } from '@jest/globals';

import { CaseRole } from '../../../../main/app/case/definition';
import { hasValidCaseRole, isProfessionalUser } from '../../../../main/functions/util/roleGuardUtil';

describe('roleGuardUtil', () => {
  describe('hasValidCaseRole', () => {
    it('returns true for applicant role', () => {
      expect(hasValidCaseRole(CaseRole.APPLICANT)).toBe(true);
    });

    it('returns true for respondent role', () => {
      expect(hasValidCaseRole(CaseRole.RESPONDENT)).toBe(true);
    });

    it('returns false when case role is missing', () => {
      expect(hasValidCaseRole(undefined)).toBe(false);
    });
  });

  describe('isProfessionalUser', () => {
    it('returns true for caseworker roles', () => {
      expect(isProfessionalUser(['caseworker-divorce'])).toBe(true);
    });

    it('returns true for solicitor roles', () => {
      expect(isProfessionalUser(['some-solicitor-role'])).toBe(true);
    });

    it('returns false for non-professional roles', () => {
      expect(isProfessionalUser(['citizen'])).toBe(false);
    });

    it('returns false when roles are missing', () => {
      expect(isProfessionalUser()).toBe(false);
    });
  });
});
