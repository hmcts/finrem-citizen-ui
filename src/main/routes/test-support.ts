import { Application, Request, Response } from 'express';

import { AccessCodeCollection, FinremCaseData, YesOrNo } from '../app/case/definition';
import { RouteNames } from '../common-constants';

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
  app.get('/__test/inject-case-session', (req: Request, res: Response) => {
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

    req.session.save(err => {
      if (err) {
        return res.status(500).json({ error: 'Session save error' });
      }
      res.redirect(RouteNames.enterAccessCode);
    });
  });
}
