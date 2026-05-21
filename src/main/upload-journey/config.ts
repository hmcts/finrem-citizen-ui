import { UploadStepNames } from '../common-constants';

import type { Request } from 'express';

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
        errors.documents = 'Select at least one document type to upload';
      }
      
      return errors;
    },
    next: () => null,
    previous: () => UploadStepNames.FDR,
  },
  
};
