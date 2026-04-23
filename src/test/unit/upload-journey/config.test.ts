import { UploadStepNames } from '../../../main/common-constants';
import { uploadSteps } from '../../../main/upload-journey/config';

describe('Upload Journey Configuration', () => {
  describe(UploadStepNames.BeforeYouStart, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.BeforeYouStart];
      expect(step.template).toBe('upload-journey/before-you-start');
      expect(step.next!({})).toBe(UploadStepNames.Confidentiality);
      expect(step.previous!({})).toBeNull();
      expect(step.validate).toBeUndefined();
      expect(step.persist).toBeUndefined();
    });
  });

  describe(UploadStepNames.Confidentiality, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.Confidentiality];
      expect(step.template).toBe('upload-journey/confidentiality');
      expect(step.next!({})).toBe(UploadStepNames.FDR);
      expect(step.previous!({})).toBe(UploadStepNames.BeforeYouStart);
      expect(step.validate).toBeUndefined();
      expect(step.persist).toBeUndefined();
    });
  });

  describe(UploadStepNames.FDR, () => {
    it('should have correct configuration', () => {
      const step = uploadSteps[UploadStepNames.FDR];
      expect(step.template).toBe('upload-journey/fdr');
      expect(step.next!({})).toBeNull();
      expect(step.previous!({})).toBe(UploadStepNames.Confidentiality);
      expect(step.validate).toBeUndefined();
      expect(step.persist).toBeUndefined();
    });
  });
});
