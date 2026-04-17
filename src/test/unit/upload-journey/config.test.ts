import { uploadSteps } from '../../../main/upload-journey/config';

describe('Upload Journey Configuration', () => {
  describe('before-you-start', () => {
    it('should have correct configuration', () => {
      const step = uploadSteps['before-you-start'];
      expect(step.template).toBe('upload-journey/before-you-start');
      expect(step.next!({})).toBe('confidentiality');
      expect(step.previous!({})).toBeNull();
      expect(step.validate).toBeUndefined();
      expect(step.persist).toBeUndefined();
    });
  });

  describe('confidentiality', () => {
    const step = uploadSteps.confidentiality;

    it('should have correct template and navigation', () => {
      expect(step.template).toBe('upload-journey/confidentiality');
      expect(step.next!({})).toBeNull();
      expect(step.previous!({})).toBe('before-you-start');
    });

    it('should validate and persist acknowledgement', () => {
      expect(step.validate!({})).toEqual({
        acknowledgedConfidentiality: 'You must acknowledge the confidentiality statement',
      });
      expect(step.validate!({ acknowledgedConfidentiality: 'true' })).toEqual({});
      expect(step.persist!({ acknowledgedConfidentiality: 'true' }, {})).toEqual({
        acknowledgedConfidentiality: true,
      });
    });
  });
});
