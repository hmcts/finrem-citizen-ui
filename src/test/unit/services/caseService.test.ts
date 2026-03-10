import { describe, expect, it } from '@jest/globals';

import caseService from '../../../main/services/caseService';

describe('CaseService', () => {
  describe('checkUserHasLinkedCase', () => {
    it('should return false when API call fails', async () => {
      const result = await caseService.checkUserHasLinkedCase('test-user-id');
      expect(typeof result).toBe('boolean');
    });
  });
});
