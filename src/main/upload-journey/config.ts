import { UploadStepNames } from '../common-constants';

export type UploadStepId = typeof UploadStepNames[keyof typeof UploadStepNames];

export type UploadJourneyData = {
  fdrHearing?: 'yes' | 'no';
};

export type UploadStep = {
  template: string;
  validate?: (body: Record<string, unknown>) => Record<string, string>;
  persist?: (body: Record<string, unknown>, data: UploadJourneyData) => UploadJourneyData;
  next?: (data: UploadJourneyData) => UploadStepId | null;
  previous?: (data: UploadJourneyData) => UploadStepId | null;
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
    persist: (body: Record<string, unknown>, data: UploadJourneyData) => {
      return {
        ...data,
        fdrHearing: body.fdrHearing as 'yes' | 'no',
      };
    },
    next: () => null,
    previous: () => UploadStepNames.Confidentiality,
  },
  
};
