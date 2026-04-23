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
    it('should have correct configuration', () => {
      const step = uploadSteps['confidentiality'];
      expect(step.template).toBe('upload-journey/confidentiality');
      expect(step.next!({})).toBe('fdr');
      expect(step.previous!({})).toBe('before-you-start');
      expect(step.validate).toBeUndefined();
      expect(step.persist).toBeUndefined();
    });
  });

  describe('fdr', () => {
    it('should have correct configuration', () => {
      const step = uploadSteps['fdr'];
      expect(step.template).toBe('upload-journey/fdr');
      expect(step.next!({})).toBeNull();
      expect(step.previous!({})).toBe('confidentiality');
      expect(step.validate).toBeUndefined();
      expect(step.persist).toBeUndefined();
    });
  });
});
