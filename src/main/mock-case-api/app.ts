import express, { Express, Request, Response } from 'express';

import { UrlEndPoints } from '../common-constants';

type YesOrNo = 'Yes' | 'No';

interface MockAccessCode {
  accessCode: string;
  createdAt: string;
  validUntil: string;
  isValid: YesOrNo;
}

interface MockAccessCodeCollection {
  id: string;
  value: MockAccessCode;
}

interface MockCaseData {
  applicantAccessCodes?: MockAccessCodeCollection[];
  respondentAccessCodes?: MockAccessCodeCollection[];
  [key: string]: unknown;
}

interface MockCaseRecord {
  id: string;
  state: string;
  caseTypeId: string;
  createdDate: string;
  data: MockCaseData;
}

interface CaseUserAssignment {
  case_id: string;
  user_id: string;
  case_role: string;
}

interface MockCaseUsersRequest {
  case_users?: CaseUserAssignment[];
}

interface MockEventRequest {
  event?: {
    id?: string;
  };
  data?: MockCaseData;
  event_token?: string;
}

export interface MockCaseApiOptions {
  seedCases?: MockCaseRecord[];
}

export function createMockCaseApiApp(options: MockCaseApiOptions = {}): Express {
  const app = express();
  const cases = new Map<string, MockCaseRecord>();

  for (const record of options.seedCases ?? [createDefaultSeedCase()]) {
    cases.set(record.id, record);
  }

  app.use(express.json());

  app.get('/cases/:caseId', (req: Request, res: Response) => {
    const caseId = getRouteParam(req.params.caseId);
    const existingCase = cases.get(caseId);

    if (!existingCase) {
      return res.status(404).json({ message: `Case ${caseId} not found` });
    }

    return res.json({
      id: existingCase.id,
      state: existingCase.state,
      data: existingCase.data,
    });
  });

  app.get('/cases/:caseId/event-triggers/:eventId', (req: Request, res: Response) => {
    const caseId = getRouteParam(req.params.caseId);
    const eventId = getRouteParam(req.params.eventId);
    const existingCase = cases.get(caseId);

    if (!existingCase) {
      return res.status(404).json({ message: `Case ${caseId} not found` });
    }

    return res.json({
      token: `mock-token-${caseId}-${eventId}`,
    });
  });

  app.post('/cases/:caseId/events', (req: Request<{
    caseId: string;
  }, unknown, MockEventRequest>, res: Response) => {
    const caseId = getRouteParam(req.params.caseId);
    const existingCase = cases.get(caseId);

    if (!existingCase) {
      return res.status(404).json({ message: `Case ${caseId} not found` });
    }

    const mergedCaseData: MockCaseData = {
      ...existingCase.data,
      ...(req.body?.data ?? {}),
    };

    const updatedCase: MockCaseRecord = {
      ...existingCase,
      state: resolveStateFromEvent(req.body?.event?.id, existingCase.state),
      data: mergedCaseData,
    };

    cases.set(updatedCase.id, updatedCase);

    return res.json({
      id: updatedCase.id,
      state: updatedCase.state,
      data: updatedCase.data,
    });
  });

  app.post(UrlEndPoints.CaseUsers, (req: Request<unknown, unknown, MockCaseUsersRequest>, res: Response) => {
    const assignments = req.body?.case_users ?? [];

    return res.status(204).json({
      received: assignments.length,
    });
  });

  app.post(UrlEndPoints.CaseRoles, (req: Request, res: Response) => {
    const caseIds: string[] = req.body?.case_ids ?? [];
    const userIds: string[] = req.body?.user_ids ?? [];

    const caseUsers = caseIds.flatMap(caseId => {
      const existingCase = cases.get(caseId);
      if (!existingCase) {
        return [];
      }

      const caseRole =
        typeof existingCase.data.currentUserCaseRole === 'string'
          ? existingCase.data.currentUserCaseRole
          : '[APPLICANT]';

      return userIds.map(userId => ({
        case_id: caseId,
        user_id: userId,
        case_role: caseRole,
      }));
    });

    return res.json({ case_users: caseUsers });
  });

  const searchCasesHandler = (req: Request, res: Response): Response => {
    const requestedCaseType = typeof req.query.ctid === 'string' ? req.query.ctid : '';
    const matchedCases = [...cases.values()].filter(
      record => !requestedCaseType || record.caseTypeId === requestedCaseType
    );

    return res.json({
      cases: matchedCases.map(record => ({
        id: record.id,
        state: record.state,
        created_date: record.createdDate,
        case_data: record.data,
      })),
      total: matchedCases.length,
    });
  };

  app.get(UrlEndPoints.SearchCasesBase, searchCasesHandler);
  app.post(UrlEndPoints.SearchCasesBase, searchCasesHandler);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'UP' });
  });

  return app;
}

function createDefaultSeedCase(): MockCaseRecord {
  const caseId = process.env.MOCK_CASE_ID || '1616591401473378';
  const caseTypeId = process.env.MOCK_CASE_TYPE || 'FinancialRemedyContested';
  const applicantAccessCode = process.env.MOCK_APPLICANT_ACCESS_CODE || 'APPCODE1';
  const respondentAccessCode = process.env.MOCK_RESPONDENT_ACCESS_CODE || 'RSPCODE1';
  const createdDate = new Date().toISOString();
  const validUntil = getFutureIsoDate(90);

  return {
    id: caseId,
    state: 'CaseAdded',
    caseTypeId,
    createdDate,
    data: {
      divorceCaseNumber: 'LV24D00001',
      applicantAccessCodes: [
        {
          id: 'mock-applicant-access-code',
          value: {
            accessCode: applicantAccessCode,
            createdAt: createdDate,
            validUntil,
            isValid: 'Yes',
          },
        },
      ],
      respondentAccessCodes: [
        {
          id: 'mock-respondent-access-code',
          value: {
            accessCode: respondentAccessCode,
            createdAt: createdDate,
            validUntil,
            isValid: 'Yes',
          },
        },
      ],
      currentUserCaseRole: '[APPLICANT]',
    },
  };
}

function getFutureIsoDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

function resolveStateFromEvent(eventId: string | undefined, fallbackState: string): string {
  switch (eventId) {
    case 'CUI_invalidateApplicantAccessCode':
    case 'CUI_invalidateRespondentAccessCode':
      return 'AccessCodeUsed';
    default:
      return fallbackState;
  }
}

function getRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}
