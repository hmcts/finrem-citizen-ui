export type StepId = 
  | 'step1' 
  | 'step2' 
  | 'step3-question' 
  | 'step4' 
  | 'step5-question' 
  | 'step6' 
  | 'step7-question' 
  | 'step8-complete';

export type JourneyData = {
  step3Answer?: 'yes' | 'no';
  step5Answer?: 'yes' | 'no';
  step7Answer?: 'yes' | 'no';
};

export type Step = {
  template: string;
  validate?: (body: Record<string, unknown>) => Record<string, string>;
  persist?: (body: Record<string, unknown>, data: JourneyData) => JourneyData;
  next?: (data: JourneyData) => StepId | null;
  previous?: (data: JourneyData) => StepId | null;
};

export const steps: Record<StepId, Step> = {
  'step1': {
    template: 'journey/step1',
    next: () => 'step2',
    previous: () => null,
  },

  'step2': {
    template: 'journey/step2',
    next: () => 'step3-question',
    previous: () => 'step1',
  },

  'step3-question': {
    template: 'journey/step3-question',
    validate: (body) => {
      const errors: Record<string, string> = {};
      const answer = body.step3Answer;
      if (!answer || (answer !== 'yes' && answer !== 'no')) {
        errors.step3Answer = 'Select yes or no';
      }
      return errors;
    },
    persist: (body, data) => ({
      ...data,
      step3Answer: body.step3Answer as 'yes' | 'no',
    }),
    next: (data) => {
      return data.step3Answer === 'yes' ? 'step4' : 'step2';
    },
    previous: () => 'step2',
  },

  'step4': {
    template: 'journey/step4',
    next: () => 'step5-question',
    previous: () => 'step3-question',
  },

  'step5-question': {
    template: 'journey/step5-question',
    validate: (body) => {
      const errors: Record<string, string> = {};
      const answer = body.step5Answer;
      if (!answer || (answer !== 'yes' && answer !== 'no')) {
        errors.step5Answer = 'Select yes or no';
      }
      return errors;
    },
    persist: (body, data) => ({
      ...data,
      step5Answer: body.step5Answer as 'yes' | 'no',
    }),
    next: (data) => {
      return data.step5Answer === 'yes' ? 'step6' : 'step4';
    },
    previous: () => 'step4',
  },

  'step6': {
    template: 'journey/step6',
    next: () => 'step7-question',
    previous: () => 'step5-question',
  },

  'step7-question': {
    template: 'journey/step7-question',
    validate: (body) => {
      const errors: Record<string, string> = {};
      const answer = body.step7Answer;
      if (!answer || (answer !== 'yes' && answer !== 'no')) {
        errors.step7Answer = 'Select yes or no';
      }
      return errors;
    },
    persist: (body, data) => ({
      ...data,
      step7Answer: body.step7Answer as 'yes' | 'no',
    }),
    next: (data) => {
      return data.step7Answer === 'yes' ? 'step8-complete' : 'step6';
    },
    previous: () => 'step6',
  },

  'step8-complete': {
    template: 'journey/step8-complete',
    next: () => null,
    previous: () => 'step7-question',
  },
};
