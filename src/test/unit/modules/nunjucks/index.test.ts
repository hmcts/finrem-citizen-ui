import { describe, expect, it } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import * as nunjucks from 'nunjucks';
import * as path from 'path';

import { addNunjucksLocals, buildFeedbackSurveyUrl } from '../../../../main/modules/nunjucks';

function mockReqGet(host: string): Request['get'] {
  return ((name: string): string | string[] | undefined => (name === 'host' ? host : undefined)) as Request['get'];
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    protocol: 'http',
    originalUrl: '/dashboard',
    url: '/dashboard',
    get: mockReqGet('localhost:3100'),
    ...overrides,
  } as unknown as Request;
}

describe('buildFeedbackSurveyUrl', () => {
  it('uses forwarded headers to build the current page URL for deployed environments', () => {
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'service.example.com',
      },
      originalUrl: '/upload/check-upload?caseId=123&from=dashboard',
    });

    expect(buildFeedbackSurveyUrl(req)).toBe(
      `https://www.smartsurvey.co.uk/s/CFR_feedback/?pageurl=${encodeURIComponent(
        'https://service.example.com/upload/check-upload?caseId=123&from=dashboard'
      )}`
    );
  });

  it('falls back to the request protocol and host when forwarded headers are absent', () => {
    const req = makeReq({
      protocol: 'https',
      originalUrl: '/enter-case-number',
      get: mockReqGet('localhost:3100'),
    });

    expect(buildFeedbackSurveyUrl(req)).toBe(
      `https://www.smartsurvey.co.uk/s/CFR_feedback/?pageurl=${encodeURIComponent(
        'https://localhost:3100/enter-case-number'
      )}`
    );
  });

  it('adds the generated survey link to response locals for templates', () => {
    const req = makeReq({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'deployed.example.com',
      },
      originalUrl: '/test-page?step=1',
      path: '/test-page',
    });
    const res = { locals: {} } as Response;
    let nextCalled = false;

    addNunjucksLocals(req, res, (() => {
      nextCalled = true;
    }) as NextFunction);

    const expectedSurveyUrl = `https://www.smartsurvey.co.uk/s/CFR_feedback/?pageurl=${encodeURIComponent(
      'https://deployed.example.com/test-page?step=1'
    )}`;

    expect(res.locals.feedbackSurveyUrl).toBe(expectedSurveyUrl);
    expect(res.locals.pagePath).toBe('/test-page');
    expect(nextCalled).toBe(true);
  });

  it('renders the survey link in the shared beta banner', () => {
    const govukTemplates = path.dirname(require.resolve('govuk-frontend/package.json')) + '/dist';
    const viewsPath = path.join(__dirname, '../../../../main/views');
    const env = nunjucks.configure([govukTemplates, viewsPath], { autoescape: true });
    const expectedSurveyUrl = `https://www.smartsurvey.co.uk/s/CFR_feedback/?pageurl=${encodeURIComponent(
      'https://deployed.example.com/test-page?step=1'
    )}`;

    const rendered = env.render('home.njk', {
      feedbackSurveyUrl: expectedSurveyUrl,
    });

    expect(rendered).toContain(`href="${expectedSurveyUrl}"`);
    expect(rendered).toContain('target="_blank"');
    expect(rendered).toContain('rel="noopener noreferrer"');
    expect(rendered).toContain('aria-label="provide feedback on this service (opens in a new tab)"');
  });
});
