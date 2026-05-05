import { Application, Request, Response } from 'express';

import { AccessCodeCollection, FinremCaseData, YesOrNo } from '../app/case/definition';
import { RouteNames, TestRoutes } from '../common-constants';

interface MockCcdCase {
  id: string;
  state: string;
  data: Record<string, unknown>;
}

const mockCcdStore = new Map<string, MockCcdCase>();
const DEFAULT_MOCK_CASE_ID = process.env.MOCK_CASE_NUMBER || '2222333344445555';

const createDefaultAccessCodes = (): Record<string, unknown> => {
  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const validUntil = nextYear.toISOString().split('T')[0];

  const applicantEntry: AccessCodeCollection = {
    id: 'mock-applicant-access-code',
    value: {
      accessCode: 'APPCODE1',
      createdAt: today,
      validUntil,
      isValid: YesOrNo.YES,
    },
  };

  const respondentEntry: AccessCodeCollection = {
    id: 'mock-respondent-access-code',
    value: {
      accessCode: 'RSPCODE1',
      createdAt: today,
      validUntil,
      isValid: YesOrNo.YES,
    },
  };

  return {
    applicantAccessCodes: [applicantEntry],
    respondentAccessCodes: [respondentEntry],
  };
};

const ensureMockCaseExists = (caseId: string) => {
  if (!mockCcdStore.has(caseId)) {
    mockCcdStore.set(caseId, {
      id: caseId,
      state: 'CaseAdded',
      data: createDefaultAccessCodes(),
    });
  }
};

/**
 * Test-support routes — only registered when explicitly enabled.
 * Allows Playwright functional tests to inject mock session data without
 * going through the real CCD access-code generation flow (Form C).
 */
export default function setupTestSupportRoutes(app: Application): void {
  const enableTestSupportRoutes = process.env.ENABLE_TEST_SUPPORT_ROUTES === 'true';

  if (!enableTestSupportRoutes) {
    return;
  }

  ensureMockCaseExists(DEFAULT_MOCK_CASE_ID);

  /**
   * GET /__test/inject-case-session
   * Query params:
   *   caseNumber      - raw 16-digit case ID (no hyphens)
   *   applicantCode   - 8-char alphanumeric mock applicant access code
   *   respondentCode  - 8-char alphanumeric mock respondent access code
   *
   * Sets req.session.caseNumber and req.session.caseData with mock access-code
   * entries that will pass all server-side validations, then redirects to
   * /enter-access-code so the test can proceed directly to code submission.
   */
  app.get(TestRoutes.injectCaseSession, (req: Request, res: Response) => {
    const { caseNumber, applicantCode, respondentCode } = req.query;

    if (
      !caseNumber || typeof caseNumber !== 'string' ||
      !applicantCode || typeof applicantCode !== 'string' ||
      !respondentCode || typeof respondentCode !== 'string'
    ) {
      return res.status(400).json({
        error: 'Missing required query params: caseNumber, applicantCode, respondentCode',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const validUntil = nextYear.toISOString().split('T')[0];

    const applicantEntry: AccessCodeCollection = {
      id: 'mock-applicant-access-code',
      value: {
        accessCode: applicantCode.toUpperCase(),
        createdAt: today,
        validUntil,
        isValid: YesOrNo.YES,
      },
    };

    const respondentEntry: AccessCodeCollection = {
      id: 'mock-respondent-access-code',
      value: {
        accessCode: respondentCode.toUpperCase(),
        createdAt: today,
        validUntil,
        isValid: YesOrNo.YES,
      },
    };

    req.session.caseNumber = caseNumber;
    req.session.caseData = {
      applicantAccessCodes: [applicantEntry],
      respondentAccessCodes: [respondentEntry],
    } as unknown as FinremCaseData;

    ensureMockCaseExists(caseNumber);
    mockCcdStore.set(caseNumber, {
      id: caseNumber,
      state: 'CaseAdded',
      data: req.session.caseData as unknown as Record<string, unknown>,
    });

    req.session.save(err => {
      if (err) {
        return res.status(500).json({ error: 'Session save error' });
      }
      res.redirect(RouteNames.enterAccessCode);
    });
  });

  app.get('/__test/mock-ccd/cases/:caseId/event-triggers/:eventName', (req: Request, res: Response) => {
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const eventName = Array.isArray(req.params.eventName) ? req.params.eventName[0] : req.params.eventName;
    ensureMockCaseExists(caseId);
    const mockToken = `mock-token-${caseId}-${eventName}`;
    res.json({ token: mockToken });
  });

  app.get('/__test/mock-ccd/cases/:caseId', (req: Request, res: Response) => {
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const caseData = mockCcdStore.get(caseId);

    if (!caseData) {
      return res.status(404).json({
        exception: 'uk.gov.hmcts.ccd.endpoint.exceptions.ResourceNotFoundException',
        status: 404,
        error: 'Not Found',
        message: `No case found with id ${caseId}`,
      });
    }

    return res.json({
      id: caseData.id,
      state: caseData.state,
      data: caseData.data,
    });
  });

  app.post('/__test/mock-ccd/case-users', (_req: Request, res: Response) => {
    return res.status(201).json({ case_users: [] });
  });

  app.post('/__test/mock-ccd/cases/:caseId/events', (req: Request, res: Response) => {
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const { event, data: updateData } = req.body;

    let caseData = mockCcdStore.get(caseId);
    if (!caseData) {
      caseData = {
        id: caseId,
        state: 'CaseAdded',
        data: {},
      };
    }

    if (updateData) {
      caseData.data = {
        ...caseData.data,
        ...updateData,
      };
    }

    if (event?.id === 'CUI_invalidateApplicantAccessCode' || event?.id === 'CUI_invalidateRespondentAccessCode') {
      caseData.state = 'AccessCodeUsed';
    }

    mockCcdStore.set(caseId, caseData);

    return res.json({
      id: caseData.id,
      state: caseData.state,
      data: caseData.data,
    });
  });

  app.get('/__test/clear-mock-ccd-store', (_req: Request, res: Response) => {
    mockCcdStore.clear();
    ensureMockCaseExists(DEFAULT_MOCK_CASE_ID);
    return res.json({ message: 'Mock CCD store cleared' });
  });
}
