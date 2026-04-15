import { steps } from '../../../main/journey/config';

describe('Journey Configuration', () => {
  describe('step1', () => {
    it('should have correct template', () => {
      expect(steps['step1'].template).toBe('journey/step1');
    });

    it('should navigate to step2', () => {
      expect(steps['step1'].next!({})).toBe('step2');
    });

    it('should have no previous step', () => {
      expect(steps['step1'].previous!({})).toBeNull();
    });
  });

  describe('step2', () => {
    it('should have correct template', () => {
      expect(steps['step2'].template).toBe('journey/step2');
    });

    it('should navigate to step3-question', () => {
      expect(steps['step2'].next!({})).toBe('step3-question');
    });

    it('should navigate back to step1', () => {
      expect(steps['step2'].previous!({})).toBe('step1');
    });
  });

  describe('step3-question', () => {
    it('should have correct template', () => {
      expect(steps['step3-question'].template).toBe('journey/step3-question');
    });

    it('should validate required answers', () => {
      expect(steps['step3-question'].validate!({}).step3Answer).toBe('Select yes or no');
      expect(steps['step3-question'].validate!({ step3Answer: 'yes' })).toEqual({});
      expect(steps['step3-question'].validate!({ step3Answer: 'no' })).toEqual({});
    });

    it('should validate invalid answers', () => {
      expect(steps['step3-question'].validate!({ step3Answer: 'invalid' }).step3Answer).toBe('Select yes or no');
    });

    it('should persist answer', () => {
      expect(steps['step3-question'].persist!({ step3Answer: 'yes' }, {})).toEqual({ step3Answer: 'yes' });
    });

    it('should navigate based on answers', () => {
      expect(steps['step3-question'].next!({ step3Answer: 'yes' })).toBe('step4');
      expect(steps['step3-question'].next!({ step3Answer: 'no' })).toBe('step2');
    });

    it('should navigate back to step2', () => {
      expect(steps['step3-question'].previous!({})).toBe('step2');
    });
  });

  describe('step4', () => {
    it('should have correct template', () => {
      expect(steps['step4'].template).toBe('journey/step4');
    });

    it('should navigate to step5-question', () => {
      expect(steps['step4'].next!({})).toBe('step5-question');
    });

    it('should navigate back to step3-question', () => {
      expect(steps['step4'].previous!({})).toBe('step3-question');
    });
  });

  describe('step5-question', () => {
    it('should have correct template', () => {
      expect(steps['step5-question'].template).toBe('journey/step5-question');
    });

    it('should validate required answers', () => {
      expect(steps['step5-question'].validate!({}).step5Answer).toBe('Select yes or no');
      expect(steps['step5-question'].validate!({ step5Answer: 'yes' })).toEqual({});
      expect(steps['step5-question'].validate!({ step5Answer: 'no' })).toEqual({});
    });

    it('should validate invalid answers', () => {
      expect(steps['step5-question'].validate!({ step5Answer: 'invalid' }).step5Answer).toBe('Select yes or no');
    });

    it('should persist answer', () => {
      expect(steps['step5-question'].persist!({ step5Answer: 'yes' }, {})).toEqual({ step5Answer: 'yes' });
    });

    it('should navigate based on answers', () => {
      expect(steps['step5-question'].next!({ step5Answer: 'yes' })).toBe('step6');
      expect(steps['step5-question'].next!({ step5Answer: 'no' })).toBe('step4');
    });

    it('should navigate back to step4', () => {
      expect(steps['step5-question'].previous!({})).toBe('step4');
    });
  });

  describe('step6', () => {
    it('should have correct template', () => {
      expect(steps['step6'].template).toBe('journey/step6');
    });

    it('should navigate to step7-question', () => {
      expect(steps['step6'].next!({})).toBe('step7-question');
    });

    it('should navigate back to step5-question', () => {
      expect(steps['step6'].previous!({})).toBe('step5-question');
    });
  });

  describe('step7-question', () => {
    it('should have correct template', () => {
      expect(steps['step7-question'].template).toBe('journey/step7-question');
    });

    it('should validate required answers', () => {
      expect(steps['step7-question'].validate!({}).step7Answer).toBe('Select yes or no');
      expect(steps['step7-question'].validate!({ step7Answer: 'yes' })).toEqual({});
      expect(steps['step7-question'].validate!({ step7Answer: 'no' })).toEqual({});
    });

    it('should validate invalid answers', () => {
      expect(steps['step7-question'].validate!({ step7Answer: 'invalid' }).step7Answer).toBe('Select yes or no');
    });

    it('should persist answer', () => {
      expect(steps['step7-question'].persist!({ step7Answer: 'yes' }, {})).toEqual({ step7Answer: 'yes' });
    });

    it('should navigate based on answers', () => {
      expect(steps['step7-question'].next!({ step7Answer: 'yes' })).toBe('step8-complete');
      expect(steps['step7-question'].next!({ step7Answer: 'no' })).toBe('step6');
    });

    it('should navigate back to step6', () => {
      expect(steps['step7-question'].previous!({})).toBe('step6');
    });
  });

  describe('step8-complete', () => {
    it('should have correct template', () => {
      expect(steps['step8-complete'].template).toBe('journey/step8-complete');
    });

    it('should have no next step', () => {
      expect(steps['step8-complete'].next!({})).toBeNull();
    });

    it('should navigate back to step7-question', () => {
      expect(steps['step8-complete'].previous!({})).toBe('step7-question');
    });
  });
});
