import type { Request } from 'express';

import { UploadStepNames } from '../common-constants';
import { FILE_VALIDATION_ERRORS } from '../functions/util/uploadValidation';

export type UploadStepId = typeof UploadStepNames[keyof typeof UploadStepNames];

export type UploadStep = {
  template: string;
  validate?: (body: Record<string, unknown>, req?: Request) => Record<string, string>;
  next?: () => UploadStepId | null;
  previous?: () => UploadStepId | null;
};

export const uploadSteps: Record<UploadStepId, UploadStep> = {

  [UploadStepNames.BeforeYouStart]: {
    template: 'upload-journey/before-you-start',
    next: () => UploadStepNames.Confidentiality,
    previous: () => null,
  },

  [UploadStepNames.Confidentiality]: {
    template: 'upload-journey/confidentiality',
    next: () => UploadStepNames.FDR,
    previous: () => UploadStepNames.BeforeYouStart,
  },

  [UploadStepNames.FDR]: {
    template: 'upload-journey/fdr',
    validate: (body: Record<string, unknown>) => {
      const errors: Record<string, string> = {};
      if (!body.fdrHearing) {
        errors.fdrHearing = 'Select yes if you are uploading these documents for a Financial Dispute Resolution hearing';
      }
      return errors;
    },
    next: () => UploadStepNames.DocumentTypeSelection,
    previous: () => UploadStepNames.Confidentiality,
  },

  [UploadStepNames.DocumentTypeSelection]: {
    template: 'upload-journey/document-type-selection',
    validate: (body: Record<string, unknown>, req?: Request) => {
      const errors: Record<string, string> = {};
      
      const documentDetails = req?.session?.DocumentSelection?.documentDetails;
      if (!documentDetails || documentDetails.length === 0) {
        errors.documents = 'You must select what you want to upload';
      }
      
      return errors;
    },
    next: () => UploadStepNames.UploadDocuments,
    previous: () => UploadStepNames.FDR,
  },

  [UploadStepNames.UploadDocuments]: {
    template: 'upload-journey/upload-documents',
    validate: (body: Record<string, unknown>, req?: Request) => {
      const errors: Record<string, string> = {};
      
      // Get selected document types
      const selectedTypes = req?.session?.DocumentSelection?.documentDetails || [];
      const uploadedDocs = req?.session?.documents?.documentDetails || [];
      
      // Check if at least one file uploaded per selected type
      for (const selectedType of selectedTypes) {
        const documentTypeValue = selectedType.value?.DocumentType;
        
        if (!documentTypeValue) {
          continue;
        }
        
        // Check if any uploaded document matches this type
        const hasFileForType = uploadedDocs.some(doc => 
          doc.value?.DocumentType === documentTypeValue
        );
        
        if (!hasFileForType) {
          // Use the document type value as the error key (e.g., 'form-fm1')
          errors[documentTypeValue] = FILE_VALIDATION_ERRORS.NO_FILE;
        }
      }
      
      // If no document types selected at all, show general error
      if (selectedTypes.length === 0) {
        errors.upload = 'You must select document types before uploading';
      }
      
      return errors;
    },
    next: () => UploadStepNames.CheckUpload,
    previous: () => UploadStepNames.DocumentTypeSelection,
  },

  [UploadStepNames.CheckUpload]: {
    template: 'upload-journey/check-upload',
    next: () => UploadStepNames.SendToOtherParty,
    previous: () => UploadStepNames.UploadDocuments,
  },

  [UploadStepNames.SendToOtherParty]: {
    template: 'upload-journey/send-to-other-party',
    next: () => UploadStepNames.Confirmation,
    previous: () => UploadStepNames.CheckUpload,
  },

  [UploadStepNames.Confirmation]: {
    template: 'upload-journey/confirmation',
    next: () => null,
    previous: () => UploadStepNames.SendToOtherParty,
  }
  
};
