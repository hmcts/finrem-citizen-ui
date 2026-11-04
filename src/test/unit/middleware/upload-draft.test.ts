import type { Request, Response } from 'express';

import { uploadDraftMiddleware } from '../../../main/middleware/upload-draft';
import { restoreUploadDraft } from '../../../main/modules/upload-draft';
import type {} from '../../../main/types/express-session';

jest.mock('../../../main/modules/upload-draft', () => ({
  restoreUploadDraft: jest.fn(async (_req: Request): Promise<void> => {}),
}));

describe('Upload draft middleware', () => {
  const restoreMock = jest.mocked(restoreUploadDraft);

  function createRequest(): Request {
    return {
      session: {
        user: {
          id: 'user-1',
          caseRole: '[APPLICANT]',
        },
        caseNumber: 'case-1',
      },
    } as unknown as Request;
  }

  beforeEach(() => {
    restoreMock.mockReset();
    restoreMock.mockResolvedValue(undefined);
  });

  it('should restore the draft and mark the context as restored', async () => {
    const req = createRequest();
    const next = jest.fn();

    await uploadDraftMiddleware(req, {} as Response, next);

    expect(restoreMock).toHaveBeenCalledTimes(1);
    expect(restoreMock).toHaveBeenCalledWith(req);
    expect(req.session.uploadDraftRestoredFor).toBe(
      JSON.stringify(['user-1', 'case-1', '[APPLICANT]'])
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should not restore again for the same context', async () => {
    const req = createRequest();
    req.session.uploadDraftRestoredFor = JSON.stringify([
      'user-1',
      'case-1',
      '[APPLICANT]',
    ]);
    const next = jest.fn();

    await uploadDraftMiddleware(req, {} as Response, next);

    expect(restoreMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it.each(['user', 'caseNumber', 'caseRole'])(
    'should skip restoration when %s is missing',
    async missing => {
      const req = createRequest();
      const next = jest.fn();

      if (missing === 'user') {
        delete req.session.user;
      } else if (missing === 'caseNumber') {
        delete req.session.caseNumber;
      } else {
        delete req.session.user!.caseRole;
      }

      await uploadDraftMiddleware(req, {} as Response, next);

      expect(restoreMock).not.toHaveBeenCalled();
      expect(req.session.uploadDraftRestoredFor).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    }
  );

  it.each([
    ['user-2', 'case-1', '[APPLICANT]'],
    ['user-1', 'case-2', '[APPLICANT]'],
    ['user-1', 'case-1', '[RESPONDENT]'],
  ])(
    'should restore when the previous context was %s / %s / %s',
    async (userId, caseNumber, caseRole) => {
      const req = createRequest();
      req.session.uploadDraftRestoredFor = JSON.stringify([
        userId,
        caseNumber,
        caseRole,
      ]);
      const next = jest.fn();

      await uploadDraftMiddleware(req, {} as Response, next);

      expect(restoreMock).toHaveBeenCalledTimes(1);
      expect(restoreMock).toHaveBeenCalledWith(req);
      expect(req.session.uploadDraftRestoredFor).toBe(
        JSON.stringify(['user-1', 'case-1', '[APPLICANT]'])
      );
      expect(next).toHaveBeenCalledWith();
    }
  );

  it('should forward restoration errors and allow a later retry', async () => {
    const req = createRequest();
    const error = new Error('Redis unavailable');
    restoreMock.mockRejectedValueOnce(error);
    const next = jest.fn();

    await uploadDraftMiddleware(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
    expect(req.session.uploadDraftRestoredFor).toBeUndefined();

    const retryNext = jest.fn();

    await uploadDraftMiddleware(req, {} as Response, retryNext);

    expect(restoreMock).toHaveBeenCalledTimes(2);
    expect(retryNext).toHaveBeenCalledWith();
    expect(req.session.uploadDraftRestoredFor).toBe(
      JSON.stringify(['user-1', 'case-1', '[APPLICANT]'])
    );
  });
});
