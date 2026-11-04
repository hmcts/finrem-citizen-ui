import type { Request } from 'express';

import { deleteUploadDraft, restoreUploadDraft, saveUploadDraft, } from '../../../../main/modules/upload-draft';
import type {} from '../../../../main/types/express-session';

jest.mock('config', () => ({
  get: jest.fn((key: string) => {
    switch (key) {
      case 'session.prefix':
        return 'finrem-test';
      case 'uploadDraft.ttlInSeconds':
        return 86400;
      default:
        throw new Error(`Unexpected config key: ${key}`);
    }
  }),
}));

describe('Upload draft storage', () => {
  const redis = {
    set: jest.fn(async (
      _key: string,
      _value: string,
      _mode: string,
      _ttl: number
    ) => 'OK'),
    get: jest.fn(async (_key: string): Promise<string | null> => null),
    del: jest.fn(async (_key: string) => 1),
  };

  const key = 'finrem-test:upload-draft:user-1:case-1';

  const documents = {
    documentDetails: [
      {
        id: 'document-1',
        value: {
          DocumentType: 'Chronology',
          DocumentFileName: 'chronology.pdf',
          DocumentLink: {
            document_url: 'http://cdam/documents/document-1',
          },
        },
      },
    ],
  };

  function createRequest(): Request {
    return {
      session: {
        user: {
          id: 'user-1',
          caseRole: '[APPLICANT]',
          accessToken: 'must-not-be-saved',
        },
        caseNumber: 'case-1',
        csrfToken: 'must-not-be-saved',
      },
      app: {
        locals: {
          redisClient: redis,
        },
      },
    } as unknown as Request;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([true, false])(
    'should save FDR answer %s and document references with the draft TTL',
    async isFDR => {
      const req = createRequest();
      req.session.DocumentSelection = {
        isFinancialDisputeResolution: isFDR,
      };
      req.session.documents =
        documents as typeof req.session.documents;

      await saveUploadDraft(req);

      expect(redis.set).toHaveBeenCalledTimes(1);

      const [savedKey, value, mode, ttl] = redis.set.mock.calls[0];
      const draft = JSON.parse(value);

      expect(savedKey).toBe(key);
      expect(mode).toBe('EX');
      expect(ttl).toBe(86400);

      expect(draft).toEqual({
        version: 1,
        DocumentSelection: {
          isFinancialDisputeResolution: isFDR,
        },
        documents,
        updatedAt: expect.any(String),
      });

      expect(Number.isNaN(Date.parse(draft.updatedAt))).toBe(false);
    }
  );

  it('should restore answers and documents without replacing authentication', async () => {
    const req = createRequest();
    const originalUser = req.session.user;
    const selection = {
      isFinancialDisputeResolution: false,
    };

    redis.get.mockResolvedValueOnce(JSON.stringify({
      version: 1,
      DocumentSelection: selection,
      documents,
      updatedAt: '2026-11-03T12:00:00.000Z',
    }));

    await restoreUploadDraft(req);

    expect(redis.get).toHaveBeenCalledWith(key);
    expect(req.session.DocumentSelection).toEqual(selection);
    expect(req.session.documents).toEqual(documents);
    expect(req.session.user).toBe(originalUser);
  });

  it('should leave session data unchanged when no draft exists', async () => {
    const req = createRequest();
    const selection = {
      isFinancialDisputeResolution: true,
    };
    req.session.DocumentSelection = selection;

    await restoreUploadDraft(req);

    expect(redis.get).toHaveBeenCalledWith(key);
    expect(req.session.DocumentSelection).toBe(selection);
    expect(req.session.documents).toBeUndefined();
  });

  it('should reject an unsupported draft version', async () => {
    const req = createRequest();

    redis.get.mockResolvedValueOnce(JSON.stringify({
      version: 2,
      DocumentSelection: {
        isFinancialDisputeResolution: true,
      },
    }));

    await expect(restoreUploadDraft(req)).rejects.toThrow(
      'Unsupported upload draft version'
    );

    expect(req.session.DocumentSelection).toBeUndefined();
  });

  it('should delete the current user and case draft', async () => {
    await deleteUploadDraft(createRequest());

    expect(redis.del).toHaveBeenCalledTimes(1);
    expect(redis.del).toHaveBeenCalledWith(key);
  });

  it('should use separate keys for different users and cases', async () => {
    const first = createRequest();
    const second = createRequest();
    const third = createRequest();

    second.session.user!.id = 'user-2';
    third.session.caseNumber = 'case-2';

    await restoreUploadDraft(first);
    await restoreUploadDraft(second);
    await restoreUploadDraft(third);

    expect(redis.get).toHaveBeenNthCalledWith(
      1,
      'finrem-test:upload-draft:user-1:case-1'
    );
    expect(redis.get).toHaveBeenNthCalledWith(
      2,
      'finrem-test:upload-draft:user-2:case-1'
    );
    expect(redis.get).toHaveBeenNthCalledWith(
      3,
      'finrem-test:upload-draft:user-1:case-2'
    );
  });

  it.each(['user', 'caseNumber', 'caseRole'])(
    'should reject access when %s is missing',
    async missing => {
      const req = createRequest();

      if (missing === 'user') {
        delete req.session.user;
      } else if (missing === 'caseNumber') {
        delete req.session.caseNumber;
      } else {
        delete req.session.user!.caseRole;
      }

      await expect(restoreUploadDraft(req)).rejects.toThrow(
        'Cannot access upload draft without authorised case context'
      );

      expect(redis.get).not.toHaveBeenCalled();
    }
  );

  it('should reject access when Redis is unavailable', async () => {
    const req = createRequest();
    delete req.app.locals.redisClient;

    await expect(restoreUploadDraft(req)).rejects.toThrow(
      'Redis is required for upload draft persistence'
    );
  });

  it('should propagate Redis write failures', async () => {
    const error = new Error('Redis unavailable');
    redis.set.mockRejectedValueOnce(error);

    await expect(saveUploadDraft(createRequest())).rejects.toThrow(
      error
    );
  });
});
