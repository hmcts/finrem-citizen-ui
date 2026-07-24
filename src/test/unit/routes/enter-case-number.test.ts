import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { getSystemUser } from '../../../main/app/auth/user';
import { getCaseApi } from '../../../main/app/case/case-api';
import { FinremCaseData } from '../../../main/app/case/definition';
import setupEnterCaseNumberRoute, { validateCaseNumber } from '../../../main/routes/generalUpload/enter-case-number';

jest.mock('../../../main/middleware', () => ({
  oidcMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('config', () => ({
  get: jest.fn(() => 'http://ccd.test.local'),
}));

jest.mock('@hmcts/nodejs-logging', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };
  return {
    Logger: {
      getLogger: jest.fn(() => mockLogger),
    },
  };
});

jest.mock('../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn(),
}));

jest.mock('../../../main/app/case/case-api', () => ({
  getCaseApi: jest.fn(),
}));

const { Logger } = require('@hmcts/nodejs-logging');
const mockLogger = Logger.getLogger('enter-case-number');

type SessionLike = {
  user?: { accessToken?: string };
  caseNumber?: string;
  caseNumberErrors?: { caseNumber?: string };
  tempCaseNumber?: string;
  caseData?: FinremCaseData;
  save: (cb?: (err?: Error) => void) => void;
  [key: string]: unknown;
};

const buildTestApp = (
  sessionOverrides: Partial<SessionLike> = {},
  saveErr?: Error,
  onSessionCreated?: (session: SessionLike) => void
) => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: false }));

  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    const session: SessionLike = {
      save: (cb?: (err?: Error) => void) => {
        cb?.(saveErr);
      },
      ...sessionOverrides,
    };
    onSessionCreated?.(session);
    (req as unknown as { session: SessionLike }).session = session;
    next();
  });

  testApp.use((_req: Request, res: Response, next: NextFunction) => {
    (res as unknown as { render: (view: string, locals?: unknown) => void }).render = (
      view: string,
      locals?: unknown
    ) => res.status(200).json({ view, locals });
    next();
  });

  setupEnterCaseNumberRoute(testApp);
  return testApp;
};

describe('Enter Case Number Validation', () => {
  describe('Required validation', () => {
    it('should return error when case number is undefined', () => {
      const result = validateCaseNumber(undefined);
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Enter your case number');
    });

    it('should return error when case number is empty string', () => {
      const result = validateCaseNumber('');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Enter your case number');
    });

    it('should return error when case number is only whitespace', () => {
      const result = validateCaseNumber('   ');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Enter your case number');
    });
  });

  describe('Length validation', () => {
    it('should return error when case number is less than 16 characters', () => {
      const result = validateCaseNumber('123456789012345');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be between 16 and 20 characters');
    });

    it('should return error when case number is more than 20 characters', () => {
      const result = validateCaseNumber('123456789012345678901');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be between 16 and 20 characters');
    });

    it('should return error when more than 20 characters with hyphens', () => {
      const result = validateCaseNumber('1234-5678-0123-4567-8901');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be between 16 and 20 characters');
    });
  });

  describe('Format validation', () => {
    it('should return null with valid case number with hyphens', () => {
      const result = validateCaseNumber('1234-5678-0123-4567');
      expect(result).toBeNull();
    });

    it('should return error with letters in case number', () => {
      const result = validateCaseNumber('1234-5678-ABCD-4567');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe(
        'Case number must only include numbers 0 to 9 and special characters such as hyphens'
      );
    });

    it('should return error with special characters other than hyphens', () => {
      const result = validateCaseNumber('1234-5678-0123@4567');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe(
        'Case number must only include numbers 0 to 9 and special characters such as hyphens'
      );
    });

    it('should return error with spaces in case number', () => {
      const result = validateCaseNumber('1234 5678 0123 4567');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe(
        'Case number must only include numbers 0 to 9 and special characters such as hyphens'
      );
    });

    it('should return null with only numbers (no hyphens)', () => {
      const result = validateCaseNumber('1234567890123456');
      expect(result).toBeNull();
    });

    it('should return null with mixed numbers and hyphens', () => {
      const result = validateCaseNumber('1234-567890-123456');
      expect(result).toBeNull();
    });
  });

  describe('Digit count validation', () => {
    it('should return error when less than 16 digits (15 digits)', () => {
      const result = validateCaseNumber('1234-5678-90123-45');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be 16 digits');
    });

    it('should return error when more than 16 digits (17 digits)', () => {
      const result = validateCaseNumber('12345678901234567');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be 16 digits');
    });

    it('should return error when 20 digits', () => {
      const result = validateCaseNumber('12345678901234567890');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be 16 digits');
    });

    it('should return error when less than 16 digits with hyphens (12 digits)', () => {
      const result = validateCaseNumber('1234-5678-0123--');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be 16 digits');
    });

    it('should return error when more than 16 digits with hyphens (18 digits)', () => {
      const result = validateCaseNumber('123456-7890123456-78');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be 16 digits');
    });

    it('should accept exactly 16 digits without hyphens', () => {
      const result = validateCaseNumber('1234567890123456');
      expect(result).toBeNull();
    });

    it('should accept exactly 16 digits with hyphens (19 chars)', () => {
      const result = validateCaseNumber('1234-5678-0123-4567');
      expect(result).toBeNull();
    });

    it('should accept exactly 16 digits with different hyphen format', () => {
      const result = validateCaseNumber('12-3456-7890-1234-56');
      expect(result).toBeNull();
    });
  });

  describe('Trimming behavior', () => {
    it('should trim leading and trailing whitespace', () => {
      const result = validateCaseNumber('  1234567890123456  ');
      expect(result).toBeNull();
    });

    it('should return error if trimmed length is invalid', () => {
      const result = validateCaseNumber('  12345  ');
      expect(result).not.toBeNull();
      expect(result?.caseNumber).toBe('Case number must be between 16 and 20 characters');
    });
  });
});

describe('Enter Case Number Route Handlers', () => {
  let mockGetCaseById: jest.MockedFunction<(caseId: string) => Promise<unknown>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCaseById = jest.fn() as unknown as jest.MockedFunction<(caseId: string) => Promise<unknown>>;

    jest.mocked(getCaseApi).mockReturnValue({
      getCaseById: mockGetCaseById,
    } as unknown as ReturnType<typeof getCaseApi>);

    jest.mocked(getSystemUser).mockResolvedValue({
      accessToken: 'mock-access',
      id: 'system-user',
      sub: '123',
      email: 'system@test.com',
      givenName: 'System',
      familyName: 'User',
      roles: ['admin'],
    } as unknown as Awaited<ReturnType<typeof getSystemUser>>);
  });

  it('GET /enter-case-number renders view with session errors and temp value', async () => {
    const res = await request(
      buildTestApp({
        caseNumberErrors: { caseNumber: 'Bad case number' },
        tempCaseNumber: '1234-5678-0123-4567',
      })
    ).get('/enter-case-number/');

    expect(res.status).toBe(200);
    expect(res.body.view).toBe('enter-case-number');
    expect(res.body.locals).toEqual({
      errors: { caseNumber: 'Bad case number' },
      caseNumber: '1234-5678-0123-4567',
    });
  });

  it('POST /enter-case-number stores validation errors and redirects when input is invalid', async () => {
    const res = await request(buildTestApp()).post('/enter-case-number').send({ caseNumber: '' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
  });

  it('POST /enter-case-number redirects to oauth login when user is unauthenticated', async () => {
    const res = await request(buildTestApp({ user: {} })).post('/enter-case-number').send({ caseNumber: '1234567890123456' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/oauth2/login');
  });

  it('POST /enter-case-number stores caseData and redirects to enter-access-code on CCD success', async () => {
    mockGetCaseById.mockResolvedValue({ id: '1234567890123456' });

    const res = await request(buildTestApp({ user: { accessToken: 'token' } }))
      .post('/enter-case-number')
      .send({ caseNumber: '1234-5678-0123-4567' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-access-code');
    expect(mockGetCaseById).toHaveBeenCalledWith('1234567801234567');
  });

  it('POST /enter-case-number transitions session state with caseNumber and caseData on CCD success', async () => {
    const loadedCaseData = { id: '1234567890123456' };
    mockGetCaseById.mockResolvedValue(loadedCaseData);

    let capturedSession: SessionLike | undefined;

    const res = await request(
      buildTestApp(
        { user: { accessToken: 'token' } },
        undefined,
        session => {
          capturedSession = session;
        }
      )
    )
      .post('/enter-case-number')
      .send({ caseNumber: '1234-5678-0123-4567' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-access-code');
    expect(capturedSession?.caseNumber).toBe('1234567801234567'); // Stored without hyphens for CCD API compatibility
    expect(capturedSession?.caseData).toEqual(loadedCaseData);
    expect(capturedSession?.caseNumberErrors).toBeUndefined();
    expect(capturedSession?.tempCaseNumber).toBeUndefined();
  });

  it('POST /enter-case-number sets form error and redirects when CCD lookup fails', async () => {
    mockGetCaseById.mockRejectedValue(new Error('Not found'));

    const res = await request(buildTestApp({ user: { accessToken: 'token' } }))
      .post('/enter-case-number')
      .send({ caseNumber: '1234-5678-0123-4567' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
  });

  it('POST /enter-case-number logs session save error but still redirects', async () => {
    const saveError = new Error('save failed');

    const res = await request(buildTestApp({}, saveError)).post('/enter-case-number').send({ caseNumber: '' });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/enter-case-number');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
