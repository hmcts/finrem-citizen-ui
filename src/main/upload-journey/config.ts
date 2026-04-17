export type UploadStepId = 'before-you-start' | 'confidentiality';

export type UploadJourneyData = {
  acknowledgedConfidentiality?: boolean;
};

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
  confidentiality: {
    template: 'upload-journey/confidentiality',
    validate: (body) => {
      const errors: Record<string, string> = {};
      if (!body.acknowledgedConfidentiality) {
        errors.acknowledgedConfidentiality = 'You must acknowledge the confidentiality statement';
      }
      return errors;
    },
    persist: (body, data) => ({
      ...data,
      acknowledgedConfidentiality: body.acknowledgedConfidentiality === 'true',
    }),
    next: () => null,
    previous: () => 'before-you-start',
  },
};
