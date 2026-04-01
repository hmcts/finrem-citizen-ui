import { OIDCAuthenticationError, OIDCCallbackError, OIDCError } from '../../../../main/modules/oidc/errors';

describe('OIDCError', () => {
  it('sets message and name', () => {
    const err = new OIDCError('something went wrong');
    expect(err.message).toBe('something went wrong');
    expect(err.name).toBe('OIDCError');
    expect(err.code).toBeUndefined();
  });

  it('sets optional code', () => {
    const err = new OIDCError('fail', 'MY_CODE');
    expect(err.code).toBe('MY_CODE');
  });

  it('is an instance of Error', () => {
    expect(new OIDCError('x')).toBeInstanceOf(Error);
  });
});

describe('OIDCAuthenticationError', () => {
  it('sets message, name and code', () => {
    const err = new OIDCAuthenticationError('auth failed');
    expect(err.message).toBe('auth failed');
    expect(err.name).toBe('OIDCError');
    expect(err.code).toBe('AUTHENTICATION_ERROR');
  });

  it('is an instance of OIDCError', () => {
    expect(new OIDCAuthenticationError('x')).toBeInstanceOf(OIDCError);
  });
});

describe('OIDCCallbackError', () => {
  it('sets message, name and code', () => {
    const err = new OIDCCallbackError('callback failed');
    expect(err.message).toBe('callback failed');
    expect(err.name).toBe('OIDCError');
    expect(err.code).toBe('CALLBACK_ERROR');
  });

  it('is an instance of OIDCError', () => {
    expect(new OIDCCallbackError('x')).toBeInstanceOf(OIDCError);
  });
});
