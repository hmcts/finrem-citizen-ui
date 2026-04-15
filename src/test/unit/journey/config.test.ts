import { steps } from '../../../main/journey/config';

describe('Journey Configuration', () => {
  it('should validate required answers', () => {
    expect(steps['step3-question'].validate!({}).step3Answer).toBe('Select yes or no');
    expect(steps['step3-question'].validate!({ step3Answer: 'yes' })).toEqual({});
  });

  it('should navigate based on answers', () => {
    expect(steps['step3-question'].next!({ step3Answer: 'yes' })).toBe('step4');
    expect(steps['step3-question'].next!({ step3Answer: 'no' })).toBe('step2');
  });
});
