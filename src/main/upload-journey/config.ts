import type { Request } from 'express';

import { UploadStepNames } from '../common-constants';

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
    next: () => UploadStepNames.DocumentSelection,
    previous: () => UploadStepNames.Confidentiality,
  },

  [UploadStepNames.DocumentSelection]: {
    template: 'upload-journey/document-selection',
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
    next: () => null,
    previous: () => UploadStepNames.DocumentSelection,
  },
  
};
