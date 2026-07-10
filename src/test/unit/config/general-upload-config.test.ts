import { UploadStepNames } from '../../../main/common-constants';
import { uploadSteps } from '../../../main/config/general-upload-config';

describe('General Upload Configuration', () => {
  describe(UploadStepNames.PUD, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.PUD];
      expect(step.template).toBe('generalUpload/previously-uploaded-documents');
      expect(step.next!()).toBeNull();
      expect(step.previous!()).toBe('dashboard');
      expect(step.validate).toBeUndefined();
    });
  });
  describe(UploadStepNames.BeforeYouStart, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.BeforeYouStart];
      expect(step.template).toBe('generalUpload/before-you-start');
      expect(step.next!()).toBe(UploadStepNames.Confidentiality);
      expect(step.previous!()).toBeNull();
      expect(step.validate).toBeUndefined();
    });
  });
  describe(UploadStepNames.PUD, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.PUD];
      expect(step.template).toBe('generalUpload/previously-uploaded-documents');
      expect(step.next!()).toBeNull();
      expect(step.previous!()).toBe('dashboard');
      expect(step.validate).toBeUndefined();
    });
  });

  describe(UploadStepNames.Confidentiality, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.Confidentiality];
      expect(step.template).toBe('generalUpload/confidentiality');
      expect(step.next!()).toBe(UploadStepNames.FDR);
      expect(step.previous!()).toBe(UploadStepNames.BeforeYouStart);
      expect(step.validate).toBeUndefined();
    });
  });

  describe(UploadStepNames.FDR, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.FDR];
      expect(step.template).toBe('generalUpload/fdr');
      expect(step.next!()).toBe(UploadStepNames.DocumentTypeSelection);
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

  describe(UploadStepNames.DocumentTypeSelection, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.DocumentTypeSelection];
      expect(step.template).toBe('generalUpload/document-type-selection');
      expect(step.next!()).toBe(UploadStepNames.UploadDocuments);
      expect(step.previous!()).toBe(UploadStepNames.FDR);
      expect(step.validate).toBeDefined();
    });

    it('should return error when no documents in session', () => {
      const step = uploadSteps[UploadStepNames.DocumentTypeSelection];
      const body = {};
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: []
          }
        }
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!(body, mockReq);

      expect(errors.documents).toBe('You must select what you want to upload');
    });

    it('should return error when session data is missing', () => {
      const step = uploadSteps[UploadStepNames.DocumentTypeSelection];
      const body = {};
      const mockReq = {
        session: {}
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!(body, mockReq);

      expect(errors.documents).toBe('You must select what you want to upload');
    });

    it('should return no errors when documents exist in session', () => {
      const step = uploadSteps[UploadStepNames.DocumentTypeSelection];
      const body = {};
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: 'uuid-1', value: { DocumentType: 'position-statement' } }
            ]
          }
        }
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!(body, mockReq);

      expect(errors).toEqual({});
    });

    it('should validate with undefined req', () => {
      const step = uploadSteps[UploadStepNames.DocumentTypeSelection];
      const body = {};

      const errors = step.validate!(body, undefined);

      expect(errors.documents).toBe('You must select what you want to upload');
    });

    it('should return error when documentDetails is undefined', () => {
      const step = uploadSteps[UploadStepNames.DocumentTypeSelection];
      const body = {};
      const mockReq = {
        session: {
          DocumentSelection: {}
        }
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!(body, mockReq);

      expect(errors.documents).toBe('You must select what you want to upload');
    });

    it('should return no errors with multiple documents in session', () => {
      const step = uploadSteps[UploadStepNames.DocumentTypeSelection];
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
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!(body, mockReq);

      expect(errors).toEqual({});
    });
  });

  describe(UploadStepNames.UploadDocuments, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.UploadDocuments];
      expect(step.template).toBe('generalUpload/upload-documents');
      expect(step.next!()).toBe(UploadStepNames.CheckUpload);
      expect(step.previous!()).toBe(UploadStepNames.DocumentTypeSelection);
      expect(step.validate).toBeDefined();
    });

    it('should return error when no documents uploaded', () => {
      const step = uploadSteps[UploadStepNames.UploadDocuments];
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [{ id: '1', value: { DocumentType: 'mortgage-statements' } }],
          },
          documents: {
            documentDetails: [],
          },
        },
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!({}, mockReq);
      expect(errors.upload).toBe('You must upload at least one file before continuing');
      expect(errors['mortgage-statements']).toBe('You must upload at least one file before continuing');
    });

    it('should return no errors when all selected document types have uploads', () => {
      const step = uploadSteps[UploadStepNames.UploadDocuments];
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: '1', value: { DocumentType: 'mortgage-statements' } },
              { id: '2', value: { DocumentType: 'bank-statements' } },
            ],
          },
          documents: {
            documentDetails: [
              { id: 'doc1', value: { DocumentType: 'Mortgage statements' } },
              { id: 'doc2', value: { DocumentType: 'Bank statements' } },
            ],
          },
        },
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!({}, mockReq);
      expect(errors).toEqual({});
    });

    it('should return error when session.documents is undefined', () => {
      const step = uploadSteps[UploadStepNames.UploadDocuments];
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [{ id: '1', value: { DocumentType: 'mortgage-statements' } }],
          },
        },
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!({}, mockReq);
      expect(errors.upload).toBe('You must upload at least one file before continuing');
    });

    it('should return errors when some document types are missing uploads', () => {
      const step = uploadSteps[UploadStepNames.UploadDocuments];
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: '1', value: { DocumentType: 'mortgage-statements' } },
              { id: '2', value: { DocumentType: 'bank-statements' } },
            ],
          },
          documents: {
            documentDetails: [
              { id: 'doc1', value: { DocumentType: 'Mortgage statements' } },
            ],
          },
        },
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!({}, mockReq);
      expect(errors.upload).toBe('You must upload at least one file before continuing');
      expect(errors['bank-statements']).toBe('You must upload at least one file before continuing');
      expect(errors['mortgage-statements']).toBeUndefined();
    });

    it('should return per-document-type errors for all missing types', () => {
      const step = uploadSteps[UploadStepNames.UploadDocuments];
      const mockReq = {
        session: {
          DocumentSelection: {
            documentDetails: [
              { id: '1', value: { DocumentType: 'mortgage-statements' } },
              { id: '2', value: { DocumentType: 'other' } },
            ],
          },
          documents: {
            documentDetails: [],
          },
        },
      } as unknown as Request;

      // @ts-expect-error - Mocking partial Request for testing
      const errors = step.validate!({}, mockReq);
      expect(errors.upload).toBe('You must upload at least one file before continuing');
      expect(errors['mortgage-statements']).toBe('You must upload at least one file before continuing');
      expect(errors['other']).toBe('You must upload at least one file before continuing');
    });
  });

  describe(UploadStepNames.CheckUpload, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.CheckUpload];
      expect(step.template).toBe('generalUpload/check-upload');
      expect(step.next!({ uploadMore: 'no' })).toBe(UploadStepNames.SendToOtherParty);
      expect(step.previous!()).toBe(UploadStepNames.UploadDocuments);
      expect(step.validate).toBeDefined();
    });

    it('should validate uploadMore field is required', () => {
      const step = uploadSteps[UploadStepNames.CheckUpload];
      const errors = step.validate!({});
      expect(errors.uploadMore).toBe('Select yes if you want to upload any other documents');
    });

    it('should not return errors when uploadMore is provided', () => {
      const step = uploadSteps[UploadStepNames.CheckUpload];
      const errors = step.validate!({ uploadMore: 'yes' });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should navigate to DocumentTypeSelection when user selects yes', () => {
      const step = uploadSteps[UploadStepNames.CheckUpload];
      expect(step.next!({ uploadMore: 'yes' })).toBe(UploadStepNames.DocumentTypeSelection);
    });

    it('should navigate to SendToOtherParty when user selects no', () => {
      const step = uploadSteps[UploadStepNames.CheckUpload];
      expect(step.next!({ uploadMore: 'no' })).toBe(UploadStepNames.SendToOtherParty);
    });
  });

  describe(UploadStepNames.SendToOtherParty, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.SendToOtherParty];
      expect(step.template).toBe('generalUpload/send-to-other-party');
      expect(step.next!()).toBe(UploadStepNames.Confirmation);
      expect(step.previous!()).toBe(UploadStepNames.CheckUpload);
      expect(step.validate).toBeDefined();
    });

    it('should validate understand checkbox', () => {
      const step = uploadSteps[UploadStepNames.SendToOtherParty];
      const errors = step.validate!({});
      expect(errors.understand).toBe("You must select 'I understand' before continuing");
    });

    it('should pass validation when understand is checked', () => {
      const step = uploadSteps[UploadStepNames.SendToOtherParty];
      const errors = step.validate!({ understand: 'yes' });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe(UploadStepNames.Confirmation, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.Confirmation];
      expect(step.template).toBe('generalUpload/confirmation');
      expect(step.next!()).toBeNull();
      expect(step.previous!()).toBe(UploadStepNames.SendToOtherParty);
      expect(step.validate).toBeUndefined();
    });
  });
});
