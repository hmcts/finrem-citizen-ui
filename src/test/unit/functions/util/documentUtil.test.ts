import { Request } from 'express';

import {
  getCombinedPDFFormat,
  getDocumentLabel,
  getDocumentRenameFormat,
  getSelectedDocumentTypesForDisplay,
  shouldAutoRename,
  shouldCombineIntoPDF,
} from '../../../../main/functions/util/documentUtil';

describe('documentUtil', () => {
  describe('getDocumentLabel', () => {
    it('should return the label for a valid document type', () => {
      const result = getDocumentLabel('points-of-claim-defence');
      expect(result).toBe('Points of claim/defence');
    });

    it('should return empty string for unknown document type', () => {
      const result = getDocumentLabel('unknown-type');
      expect(result).toBe('');
    });

    it('should return empty string for empty string', () => {
      const result = getDocumentLabel('');
      expect(result).toBe('');
    });
  });

  describe('getSelectedDocumentTypesForDisplay', () => {
    it('should return empty array when session is undefined', () => {
      const req = {} as unknown as Request;
      const result = getSelectedDocumentTypesForDisplay(req);
      expect(result).toEqual([]);
    });

    it('should return empty array when DocumentSelection is undefined', () => {
      const req = {
        session: {},
      } as unknown as Request;
      const result = getSelectedDocumentTypesForDisplay(req);
      expect(result).toEqual([]);
    });

    it('should return empty array when documentDetails is undefined', () => {
      const req = {
        session: {
          DocumentSelection: {},
        },
      } as unknown as Request;
      const result = getSelectedDocumentTypesForDisplay(req);
      expect(result).toEqual([]);
    });

    it('should return empty array when documentDetails is empty', () => {
      const req = {
        session: {
          DocumentSelection: {
            documentDetails: [],
          },
        },
      } as unknown as Request;
      const result = getSelectedDocumentTypesForDisplay(req);
      expect(result).toEqual([]);
    });

    it('should correctly map single document with all fields', () => {
      const req = {
        session: {
          DocumentSelection: {
            documentDetails: [
              {
                id: 'uuid-123',
                value: {
                  DocumentType: 'points-of-claim-defence',
                },
              },
            ],
          },
        },
      } as unknown as Request;
      
      const result = getSelectedDocumentTypesForDisplay(req);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'uuid-123',
        label: 'Points of claim/defence',
        value: 'points-of-claim-defence',
        order: 0,
      });
    });

    it('should correctly map multiple documents in order', () => {
      const req = {
        session: {
          DocumentSelection: {
            documentDetails: [
              {
                id: 'uuid-1',
                value: {
                  DocumentType: 'points-of-claim-defence',
                },
              },
              {
                id: 'uuid-2',
                value: {
                  DocumentType: 'financial-statement-form-e-e1-or-e2',
                },
              },
              {
                id: 'uuid-3',
                value: {
                  DocumentType: 'estimate-of-costs-incurred-form-h',
                },
              },
            ],
          },
        },
      } as unknown as Request;
      
      const result = getSelectedDocumentTypesForDisplay(req);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'uuid-1',
        label: 'Points of claim/defence',
        value: 'points-of-claim-defence',
        order: 0,
      });
      expect(result[1]).toEqual({
        id: 'uuid-2',
        label: 'Financial statement: Form E, E1 or E2',
        value: 'financial-statement-form-e-e1-or-e2',
        order: 1,
      });
      expect(result[2]).toEqual({
        id: 'uuid-3',
        label: 'Estimate of costs incurred: Form H',
        value: 'estimate-of-costs-incurred-form-h',
        order: 2,
      });
    });

    it('should handle missing DocumentType gracefully', () => {
      const req = {
        session: {
          DocumentSelection: {
            documentDetails: [
              {
                id: 'uuid-1',
                value: {},
              },
            ],
          },
        },
      } as unknown as Request;
      
      const result = getSelectedDocumentTypesForDisplay(req);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'uuid-1',
        label: '',
        value: '',
        order: 0,
      });
    });

    it('should handle missing value object gracefully', () => {
      const req = {
        session: {
          DocumentSelection: {
            documentDetails: [
              {
                id: 'uuid-1',
                value: null,
              },
            ],
          },
        },
      } as unknown as Request;
      
      const result = getSelectedDocumentTypesForDisplay(req);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'uuid-1',
        label: '',
        value: '',
        order: 0,
      });
    });

    it('should handle missing id gracefully', () => {
      const req = {
        session: {
          DocumentSelection: {
            documentDetails: [
              {
                value: {
                  DocumentType: 'points-of-claim-defence',
                },
              },
            ],
          },
        },
      } as unknown as Request;
      
      const result = getSelectedDocumentTypesForDisplay(req);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '',
        label: 'Points of claim/defence',
        value: 'points-of-claim-defence',
        order: 0,
      });
    });

    it('should handle documents with unknown document types', () => {
      const req = {
        session: {
          DocumentSelection: {
            documentDetails: [
              {
                id: 'uuid-1',
                value: {
                  DocumentType: 'unknown-document-type',
                },
              },
            ],
          },
        },
      } as unknown as Request;
      
      const result = getSelectedDocumentTypesForDisplay(req);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'uuid-1',
        label: '',
        value: 'unknown-document-type',
        order: 0,
      });
    });

    it('should preserve order after removal (simulated)', () => {
      const req = {
        session: {
          DocumentSelection: {
            documentDetails: [
              {
                id: 'uuid-1',
                value: {
                  DocumentType: 'points-of-claim-defence',
                },
              },
              {
                id: 'uuid-3',
                value: {
                  DocumentType: 'estimate-of-costs-incurred-form-h',
                },
              },
            ],
          },
        },
      } as unknown as Request;
      
      const result = getSelectedDocumentTypesForDisplay(req);
      
      expect(result).toHaveLength(2);
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[0].id).toBe('uuid-1');
      expect(result[1].id).toBe('uuid-3');
    });
  });

  describe('shouldAutoRename', () => {
    it('should return true for all form documents that should be auto-renamed', () => {
      expect(shouldAutoRename('family-mediation-information-and-assessment-meeting-miam-form-form-fm1')).toBe(true);
      expect(shouldAutoRename('statement-of-position-on-non-court-dispute-resolution-ncdr-form-fm5')).toBe(true);
      expect(shouldAutoRename('estimate-of-costs-incurred-form-h')).toBe(true);
      expect(shouldAutoRename('statement-of-costs-form-h1')).toBe(true);
      expect(shouldAutoRename('statement-of-costs-summary-assessment-form-n260')).toBe(true);
      expect(shouldAutoRename('certificate-of-service-form-fp6')).toBe(true);
      expect(shouldAutoRename('response-to-the-notice-of-first-appointment-form-g')).toBe(true);
    });

    it('should return true for all statement documents that should be auto-renamed', () => {
      expect(shouldAutoRename('position-statement')).toBe(true);
      expect(shouldAutoRename('chronology')).toBe(true);
      expect(shouldAutoRename('statement-of-issues')).toBe(true);
      expect(shouldAutoRename('section-25-statement')).toBe(true);
      expect(shouldAutoRename('witness-statement')).toBe(true);
    });

    it('should return true for all composite and financial documents that should be auto-renamed', () => {
      expect(shouldAutoRename('composite-case-summary-form-es1')).toBe(true);
      expect(shouldAutoRename('composite-schedule-of-assets-and-income-form-es2')).toBe(true);
      expect(shouldAutoRename('market-appraisal-or-valuation-of-family-home')).toBe(true);
      expect(shouldAutoRename('housing-needs-property-particulars')).toBe(true);
    });

    it('should return true for all offers, reports and bundle documents that should be auto-renamed', () => {
      expect(shouldAutoRename('open-offers')).toBe(true);
      expect(shouldAutoRename('without-prejudice-offers-for-settlement')).toBe(true);
      expect(shouldAutoRename('questionnaire-request-for-further-documents')).toBe(true);
      expect(shouldAutoRename('pension-report-expert-report')).toBe(true);
      expect(shouldAutoRename('hearing-bundle')).toBe(true);
      expect(shouldAutoRename('fdr-bundle')).toBe(true);
    });

    it('should return false for document types that should not be auto-renamed', () => {
      expect(shouldAutoRename('bank-statements')).toBe(false);
      expect(shouldAutoRename('payslips')).toBe(false);
      expect(shouldAutoRename('p60')).toBe(false);
      expect(shouldAutoRename('other-document')).toBe(false);
    });

    it('should return false for unknown document types', () => {
      expect(shouldAutoRename('unknown-type')).toBe(false);
      expect(shouldAutoRename('')).toBe(false);
    });
  });

  describe('getDocumentRenameFormat', () => {
    it('should return the correct rename format for form documents', () => {
      expect(getDocumentRenameFormat('family-mediation-information-and-assessment-meeting-miam-form-form-fm1')).toBe('FormFM1');
      expect(getDocumentRenameFormat('statement-of-position-on-non-court-dispute-resolution-ncdr-form-fm5')).toBe('FormFM5');
      expect(getDocumentRenameFormat('estimate-of-costs-incurred-form-h')).toBe('FormH');
      expect(getDocumentRenameFormat('statement-of-costs-form-h1')).toBe('FormH1');
      expect(getDocumentRenameFormat('statement-of-costs-summary-assessment-form-n260')).toBe('N260');
      expect(getDocumentRenameFormat('certificate-of-service-form-fp6')).toBe('FP6');
      expect(getDocumentRenameFormat('response-to-the-notice-of-first-appointment-form-g')).toBe('FormG');
    });

    it('should return the correct rename format for statement documents', () => {
      expect(getDocumentRenameFormat('position-statement')).toBe('PositionStatement');
      expect(getDocumentRenameFormat('chronology')).toBe('Chronology');
      expect(getDocumentRenameFormat('statement-of-issues')).toBe('StatementOfIssues');
      expect(getDocumentRenameFormat('section-25-statement')).toBe('s25statement');
      expect(getDocumentRenameFormat('witness-statement')).toBe('WitnessStatements');
    });

    it('should return the correct rename format for composite and financial documents', () => {
      expect(getDocumentRenameFormat('composite-case-summary-form-es1')).toBe('ES1');
      expect(getDocumentRenameFormat('composite-schedule-of-assets-and-income-form-es2')).toBe('ES2');
      expect(getDocumentRenameFormat('market-appraisal-or-valuation-of-family-home')).toBe('FamilyHomeValuation');
      expect(getDocumentRenameFormat('housing-needs-property-particulars')).toBe('Property-Particulars');
    });

    it('should return the correct rename format for offers and reports', () => {
      expect(getDocumentRenameFormat('open-offers')).toBe('OpenOffers');
      expect(getDocumentRenameFormat('without-prejudice-offers-for-settlement')).toBe('WithoutPrejudiceOffers');
      expect(getDocumentRenameFormat('questionnaire-request-for-further-documents')).toBe('Questionnaire');
      expect(getDocumentRenameFormat('pension-report-expert-report')).toBe('ExpertReports');
    });

    it('should return the correct rename format for bundle documents', () => {
      expect(getDocumentRenameFormat('hearing-bundle')).toBe('bundle');
      expect(getDocumentRenameFormat('fdr-bundle')).toBe('bundle');
    });

    it('should return empty string for document types that are not auto-renamed', () => {
      expect(getDocumentRenameFormat('bank-statements')).toBe('');
      expect(getDocumentRenameFormat('payslips')).toBe('');
      expect(getDocumentRenameFormat('p60')).toBe('');
    });

    it('should return empty string for unknown document types', () => {
      expect(getDocumentRenameFormat('unknown-type')).toBe('');
      expect(getDocumentRenameFormat('')).toBe('');
    });
  });

  describe('shouldCombineIntoPDF', () => {
    it('should return true for documents that should be combined into a PDF', () => {
      expect(shouldCombineIntoPDF('updating-disclosure')).toBe(true);
      expect(shouldCombineIntoPDF('attachments-to-form-e')).toBe(true);
      expect(shouldCombineIntoPDF('bank-statements')).toBe(true);
    });

    it('should return false for documents that should not be combined into a PDF', () => {
      expect(shouldCombineIntoPDF('position-statement')).toBe(false);
      expect(shouldCombineIntoPDF('unknown-type')).toBe(false);
      expect(shouldCombineIntoPDF('')).toBe(false);
    });
  });

  describe('getCombinedPDFFormat', () => {
    it('should return the correct combined PDF format', () => {
      expect(getCombinedPDFFormat('updating-disclosure')).toBe('UpdatingDisclosure');
      expect(getCombinedPDFFormat('attachments-to-form-e')).toBe('AttachmentsFormE');
      expect(getCombinedPDFFormat('bank-statements')).toBe('SupportingFinancialDocuments');
    });

    it('should return empty string when the document type is not combined into a PDF', () => {
      expect(getCombinedPDFFormat('position-statement')).toBe('');
      expect(getCombinedPDFFormat('unknown-type')).toBe('');
      expect(getCombinedPDFFormat('')).toBe('');
    });
  });
});
