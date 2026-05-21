import { UploadStepNames } from '../../../main/common-constants';
import { uploadSteps } from '../../../main/upload-journey/config';

describe('Upload Journey Configuration', () => {
  describe(UploadStepNames.BeforeYouStart, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.BeforeYouStart];
      expect(step.template).toBe('upload-journey/before-you-start');
      expect(step.next!()).toBe(UploadStepNames.Confidentiality);
      expect(step.previous!()).toBeNull();
      expect(step.validate).toBeUndefined();
    });
  });

  describe(UploadStepNames.Confidentiality, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.Confidentiality];
      expect(step.template).toBe('upload-journey/confidentiality');
      expect(step.next!()).toBe(UploadStepNames.FDR);
      expect(step.previous!()).toBe(UploadStepNames.BeforeYouStart);
      expect(step.validate).toBeUndefined();
    });
  });

  describe(UploadStepNames.FDR, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.FDR];
      expect(step.template).toBe('upload-journey/fdr');
      expect(step.next!()).toBe(UploadStepNames.DocumentSelection);
      expect(step.previous!()).toBe(UploadStepNames.Confidentiality);
      expect(step.validate).toBeDefined();
    });

    it('should return error when fdrHearing is not provided', () => {
      const step = uploadSteps[UploadStepNames.FDR];
      const body = {};
      
      const errors = step.validate!(body);
      
      expect(errors.fdrHearing).toBe('Select yes if you are uploading these documents for a Financial Dispute Resolution hearing');
    });

    it('should return no errors when fdrHearing is provided', () => {
      const step = uploadSteps[UploadStepNames.FDR];
      const body = { fdrHearing: 'yes' };
      
      const errors = step.validate!(body);
      
      expect(errors).toEqual({});
    });
  });

  describe(UploadStepNames.DocumentSelection, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.DocumentSelection];
      expect(step.template).toBe('upload-journey/document-selection');
      expect(step.next!()).toBeNull();
      expect(step.previous!()).toBe(UploadStepNames.FDR);
      expect(step.validate).toBeDefined();
    });

    it('should return error when no documents in session', () => {
      const step = uploadSteps[UploadStepNames.DocumentSelection];
      const body = {};
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: []
          }
        }
      } as any;
      
      const errors = step.validate!(body, mockReq);
      
      expect(errors.documents).toBe('Select at least one document type to upload');
    });

    it('should return error when session data is missing', () => {
      const step = uploadSteps[UploadStepNames.DocumentSelection];
      const body = {};
      const mockReq = {
        session: {}
      } as any;
      
      const errors = step.validate!(body, mockReq);
      
      expect(errors.documents).toBe('Select at least one document type to upload');
    });

    it('should return no errors when documents exist in session', () => {
      const step = uploadSteps[UploadStepNames.DocumentSelection];
      const body = {};
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'position-statement' } }
            ]
          }
        }
      } as any;
      
      const errors = step.validate!(body, mockReq);
      
      expect(errors).toEqual({});
    });

    it('should validate with undefined req', () => {
      const step = uploadSteps[UploadStepNames.DocumentSelection];
      const body = {};
      
      const errors = step.validate!(body, undefined);
      
      expect(errors.documents).toBe('Select at least one document type to upload');
    });

    it('should return error when documentDetails is undefined', () => {
      const step = uploadSteps[UploadStepNames.DocumentSelection];
      const body = {};
      const mockReq = {
        session: {
          DocumentSelection: {}
        }
      } as any;
      
      const errors = step.validate!(body, mockReq);
      
      expect(errors.documents).toBe('Select at least one document type to upload');
    });

    it('should return no errors with multiple documents in session', () => {
      const step = uploadSteps[UploadStepNames.DocumentSelection];
      const body = {};
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'PAYSLIPS' } },
              { id: 'uuid-2', value: { DocumentType: 'BANK_STATEMENTS' } }
            ]
          }
        }
      } as any;
      
      const errors = step.validate!(body, mockReq);
      
      expect(errors).toEqual({});
    });
  });
});
