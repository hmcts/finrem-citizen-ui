import { Application, Request, Response } from 'express';

import { AccessCodeCollection, FinremCaseData, YesOrNo } from '../app/case/definition';
import { RouteNames, TestRoutes } from '../common-constants';

// In-memory store for mock CCD case data during functional tests
const mockCCDCaseStore: Map<string, FinremCaseData> = new Map();

/**
 * Test-support routes — only registered when explicitly enabled.
 * Allows Playwright functional tests to inject mock session data without
 * going through the real CCD access-code generation flow (Form C).
 *
 * Also provides mock CCD API endpoints to allow triggerEvent() calls to succeed
 * in functional tests without making real HTTP calls to the CCD system.
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

    const caseData = {
      applicantAccessCodes: [applicantEntry],
      respondentAccessCodes: [respondentEntry],
    } as unknown as FinremCaseData;

    req.session.caseNumber = caseNumber;
    req.session.caseData = caseData;
    
    // Store in mock CCD case store so triggerEvent() mock can update it
    mockCCDCaseStore.set(caseNumber, caseData);

    req.session.save(err => {
      if (err) {
        return res.status(500).json({ error: 'Session save error' });
      }
      res.redirect(RouteNames.enterAccessCode);
    });
  });

  /**
   * Mock CCD API endpoint: GET /cases/{caseId}/event-triggers/{eventName}
   * Returns a mock event token needed by triggerEvent() to proceed with event submission.
   * 
   * This endpoint is called by CaseApiClient.sendEvent() when triggering access code invalidation.
   */
  app.get('/__test/mock-ccd/cases/:caseId/event-triggers/:eventName', (req: Request, res: Response) => {
    const caseId = req.params.caseId as string;

    // Return mock event token response that matches CCD API structure
    const mockToken = `mock-token-for-${caseId}`;
    
    return res.status(200).json({
      token: mockToken,
      case_id: caseId,
    });
  });

  /**
   * Mock CCD API endpoint: POST /cases/{caseId}/events
   * Accepts event submission and returns mock case data with updated access codes.
   
   * This is the final step of triggerEvent() where the access code invalidation event is submitted, and the updated case data is returned.
   */
  app.post('/__test/mock-ccd/cases/:caseId/events', (req: Request, res: Response) => {
    const caseId = req.params.caseId as string;
    const { data: eventData } = req.body;

    // Retrieve or initialize case data from mock store
    let caseData = mockCCDCaseStore.get(caseId);
    caseData ??= {
      applicantAccessCodes: [],
      respondentAccessCodes: [],
    } as unknown as FinremCaseData;

    // Update case data with event data (e.g., invalidated access codes)
    if (eventData) {
      if (eventData.applicantAccessCodes) {
        caseData.applicantAccessCodes = eventData.applicantAccessCodes;
      }
      if (eventData.respondentAccessCodes) {
        caseData.respondentAccessCodes = eventData.respondentAccessCodes;
      }
    }

    // Store updated case data
    mockCCDCaseStore.set(caseId, caseData);

    // Return mock response that matches CCD API structure
    return res.status(201).json({
      id: caseId,
      created_date: new Date().toISOString(),
      data: caseData,
    });
  });

  /**
   * Utility endpoint to clear mock CCD case store (useful for test cleanup)
   * GET /__test/clear-mock-ccd-store
   */
  app.get('/__test/clear-mock-ccd-store', (req: Request, res: Response) => {
    mockCCDCaseStore.clear();
    return res.status(200).json({ message: 'Mock CCD store cleared' });
  });
}
