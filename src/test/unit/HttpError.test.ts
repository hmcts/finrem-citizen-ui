import { HTTPError } from '../../main/HttpError';

describe('HTTPError', () => {
  it('should create an error with message and status', () => {
    const error = new HTTPError('Not Found', 404);
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
  });

  it('should be an instance of Error', () => {
    const error = new HTTPError('Internal Server Error', 500);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HTTPError);
  });

  it('should handle different status codes', () => {
    const badRequest = new HTTPError('Bad Request', 400);
    expect(badRequest.status).toBe(400);

    const unauthorized = new HTTPError('Unauthorized', 401);
    expect(unauthorized.status).toBe(401);
  });
});
