import { UploadStepNames } from '../common-constants';

export type UploadStepId = typeof UploadStepNames[keyof typeof UploadStepNames];

export type UploadJourneyData = Record<string, never>;

export type UploadStep = {
  template: string;
  validate?: (body: Record<string, unknown>) => Record<string, string>;
  persist?: (body: Record<string, unknown>, data: UploadJourneyData) => UploadJourneyData;
  next?: (data: UploadJourneyData) => UploadStepId | null;
  previous?: (data: UploadJourneyData) => UploadStepId | null;
};

export const uploadSteps: Record<UploadStepId, UploadStep> = {

  'before-you-start': {
    template: 'upload-journey/before-you-start',
    next: () => 'confidentiality',
    previous: () => null,
  },

  'confidentiality': {
    template: 'upload-journey/confidentiality',
    next: () => null,
    previous: () => 'before-you-start',
  },
  
};
