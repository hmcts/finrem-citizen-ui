import { Application, Request, Response } from 'express';

import { AccessCodeCollection, FinremCaseData, YesOrNo } from '../app/case/definition';
import { RouteNames, TestRoutes } from '../common-constants';

/**
 * Test-support routes — only registered when explicitly enabled.
 * Allows Playwright functional tests to inject mock session data without
 * going through the real CCD access-code generation flow (Form C).
 */
export default function setupTestSupportRoutes(app: Application): void {
  const enableTestSupportRoutes = process.env.ENABLE_TEST_SUPPORT_ROUTES === 'true';
  const mockCaseStore = new Map<string, FinremCaseData>();

  if (!enableTestSupportRoutes) {
    return;
  }

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

    mockCaseStore.set(caseNumber, req.session.caseData as FinremCaseData);

    req.session.save(err => {
      if (err) {
        return res.status(500).json({ error: 'Session save error' });
      }
      res.redirect(RouteNames.enterAccessCode);
    });
  });

  app.post(`${TestRoutes.mockCcdBase}/case-users`, (_req: Request, res: Response) => {
    return res.status(201).json({ case_users: [] });
  });

  app.get(`${TestRoutes.mockCcdBase}/cases/:caseId/event-triggers/:eventName`, (_req: Request, res: Response) => {
    return res.status(200).json({ token: 'mock-event-token' });
  });

  app.post(`${TestRoutes.mockCcdBase}/cases/:caseId/events`, (req: Request, res: Response) => {
    const rawCaseId = req.params.caseId;
    const caseId = Array.isArray(rawCaseId) ? rawCaseId[0] : rawCaseId;

    if (!caseId) {
      return res.status(400).json({ error: 'Missing caseId route parameter' });
    }

    const incomingData = (req.body?.data || {}) as Partial<FinremCaseData>;
    const existing = mockCaseStore.get(caseId) || ({} as FinremCaseData);
    const updatedCaseData = {
      ...existing,
      ...incomingData,
    } as FinremCaseData;

    mockCaseStore.set(caseId, updatedCaseData);

    return res.status(200).json({
      id: caseId,
      state: 'Submitted',
      data: updatedCaseData,
    });
  });

  app.get(TestRoutes.clearMockCcdStore, (_req: Request, res: Response) => {
    mockCaseStore.clear();
    return res.status(200).json({ cleared: true });
  });
}
