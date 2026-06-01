import { Request } from 'express';

import { getDocumentLabel, getSelectedDocumentTypesForDisplay, shouldAutoRename, getDocumentRenameFormat } from '../../../../main/functions/util/documentUtil';

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
    it('should return true for document types that should be auto-renamed', () => {
      expect(shouldAutoRename('position-statement')).toBe(true);
      expect(shouldAutoRename('chronology')).toBe(true);
      expect(shouldAutoRename('estimate-of-costs-incurred-form-h')).toBe(true);
      expect(shouldAutoRename('hearing-bundle')).toBe(true);
      expect(shouldAutoRename('witness-statement')).toBe(true);
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
    it('should return the correct rename format for auto-renamed document types', () => {
      expect(getDocumentRenameFormat('position-statement')).toBe('PositionStatement');
      expect(getDocumentRenameFormat('chronology')).toBe('Chronology');
      expect(getDocumentRenameFormat('estimate-of-costs-incurred-form-h')).toBe('FormH');
      expect(getDocumentRenameFormat('composite-case-summary-form-es1')).toBe('ES1');
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
});
