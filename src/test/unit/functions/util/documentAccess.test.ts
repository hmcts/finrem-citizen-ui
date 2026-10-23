import { describe, expect, it } from '@jest/globals';

import { CaseRole } from '../../../../main/app/case/definition';
import { extractDocumentIdFromUrl, getCaseDocumentsByRole } from '../../../../main/functions/util/documentAccess';

describe('documentAccess', () => {
  describe('getCaseDocumentsByRole', () => {

    const applicantDocs = [{ id: 'a1' }, { id: 'a2' }];
    const respondentDocs = [{ id: 'r1' }];
    const fdrApplicantDocCollection = [{ id: 'fdr-a1' }];
    const fdrRespondentDocCollection = [{ id: 'fdr-r1' }];
    const divorceApplicantDocCollection = [{ id: 'divorce-a1' }];
    const divorceRespondentDocCollection = [{ id: 'divorce-r1' }];
    const hearingApplicantDocCollection = [{ id: 'hearing-a1' }];
    const hearingRespondentDocCollection = [{ id: 'hearing-r1' }];
    
    it('returns applicant documents for applicant role', () => {
      const result = getCaseDocumentsByRole(CaseRole.APPLICANT, {
        applicantDocCollection: applicantDocs,
        respondentDocCollection: respondentDocs,
        fdrApplicantDocCollection,
        fdrRespondentDocCollection,
        divorceApplicantDocCollection,
        divorceRespondentDocCollection,
        hearingApplicantDocCollection,
        hearingRespondentDocCollection,
      });

      expect(result).toEqual(applicantDocs.concat(fdrApplicantDocCollection, divorceApplicantDocCollection, hearingApplicantDocCollection));
    });

    it('returns respondent documents for respondent role', () => {
      const result = getCaseDocumentsByRole(CaseRole.RESPONDENT, {
        applicantDocCollection: applicantDocs,
        respondentDocCollection: respondentDocs,
        fdrApplicantDocCollection,
        fdrRespondentDocCollection,
        divorceApplicantDocCollection,
        divorceRespondentDocCollection,
        hearingApplicantDocCollection,
        hearingRespondentDocCollection,
      });

      expect(result).toEqual(respondentDocs.concat(fdrRespondentDocCollection, divorceRespondentDocCollection, hearingRespondentDocCollection));
    });

    it('returns empty array when role collection is missing', () => {
      const result = getCaseDocumentsByRole(CaseRole.APPLICANT, {
        respondentDocCollection: [{ id: 'r1' }],
      });

      expect(result).toEqual([]);
    });

    it('throws for unsupported role', () => {
      expect(() => getCaseDocumentsByRole('INVALID_ROLE' as unknown as CaseRole, {})).toThrow(
        'Unsupported case role: INVALID_ROLE'
      );
    });
  });

  describe('extractDocumentIdFromUrl', () => {
    it('extracts document id from /documents/{id} URL', () => {
      const result = extractDocumentIdFromUrl('http://dm-store/documents');

      expect(result).toBe(undefined);
    });

    it('extracts document id from /documents/{id} URL', () => {
      const result = extractDocumentIdFromUrl('http://dm-store/documents/f6b20958-b1d9-4cda-8354-8b8236ef299d');

      expect(result).toBe('f6b20958-b1d9-4cda-8354-8b8236ef299d');
    });

    it('extracts document id from /documents/{id}/binary URL', () => {
      const result = extractDocumentIdFromUrl('http://dm-store/documents/f6b20958-b1d9-4cda-8354-8b8236ef299d/binary');

      expect(result).toBe('f6b20958-b1d9-4cda-8354-8b8236ef299d');
    });

    it('extracts document id when query string is present', () => {
      const result = extractDocumentIdFromUrl('http://dm-store/documents/doc-123?download=true');

      expect(result).toBe('doc-123');
    });

    it('falls back to the final path segment when documents segment is absent', () => {
      const result = extractDocumentIdFromUrl('http://dm-store/doc-123');

      expect(result).toBe('doc-123');
    });

    it('returns undefined for invalid URL', () => {
      const result = extractDocumentIdFromUrl('http://[invalid');

      expect(result).toBeUndefined();
    });

    it('returns undefined for missing URL', () => {
      const result = extractDocumentIdFromUrl();

      expect(result).toBeUndefined();
    });
  });
});
