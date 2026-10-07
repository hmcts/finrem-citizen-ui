import { afterAll, afterEach, describe, expect, it, jest } from '@jest/globals';
import config from 'config';
import type { NextFunction, Request, Response } from 'express';
import * as nunjucks from 'nunjucks';
import * as path from 'path';

import { COOKIE_PREFERENCES_COOKIE_NAME } from '../../../../main/constants/cookies';
import { addNunjucksLocals, buildFeedbackSurveyUrl } from '../../../../main/modules/nunjucks';

const DUMMY_DYNATRACE_URL = 'https://example.test/dynatrace.js';

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
  const originalNodeEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
    const originalConfigGet = config.get.bind(config);
    const configGetSpy = jest.spyOn(config, 'get');
    configGetSpy.mockImplementation(((key: string) => {
      if (key === 'dynatrace.enabled') {
        return false;
      }
      if (key === 'dynatrace.url') {
        return DUMMY_DYNATRACE_URL;
      }
      if (key === 'googleAnalytics.enableTracking') {
        return true;
      }
      return originalConfigGet(key);
    }) as typeof config.get);

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
    expect(res.locals.appRoutes).toBeDefined();
    expect(res.locals.appRoutes.cookies).toBe('/cookies');
    expect(res.locals.dynatrace).toEqual({
      enabled: false,
      url: '',
    });
    expect(res.locals.googleAnalytics).toEqual({
      enabled: true,
      googleTagManagerId: 'GTM-N2TBV3X8',
    });
    expect(nextCalled).toBe(true);

  });

  it('enables dynatrace script settings when dynatrace is enabled in config', () => {
    const originalConfigGet = config.get.bind(config);
    const configGetSpy = jest.spyOn(config, 'get');
    configGetSpy.mockImplementation(((key: string) => {
      if (key === 'dynatrace.enabled') {
        return true;
      }
      if (key === 'dynatrace.url') {
        return DUMMY_DYNATRACE_URL;
      }
      if (key === 'googleAnalytics.enableTracking') {
        return true;
      }
      return originalConfigGet(key);
    }) as typeof config.get);

    const req = makeReq({ path: '/home' });
    const res = { locals: {} } as Response;

    addNunjucksLocals(req, res, (() => undefined) as NextFunction);

    expect(res.locals.dynatrace).toEqual({
      enabled: true,
      url: DUMMY_DYNATRACE_URL,
    });
    expect(res.locals.googleAnalytics).toEqual({
      enabled: true,
      googleTagManagerId: 'GTM-N2TBV3X8',
    });

  });

  it('sets Google analytics globals and disables analytics when enabled flag is set to false', () => {
    const originalConfigGet = config.get.bind(config);
    const configGetSpy = jest.spyOn(config, 'get');

    configGetSpy.mockImplementation(((key: string) => {
      if (key === 'googleAnalytics.enableTracking') {
        return false;
      }
      if (key === 'googleAnalytics.googleTagManagerId') {
        return 'GTM-TEST123';
      }

      return originalConfigGet(key);
    }) as typeof config.get);

    const req = makeReq({ path: '/home' });
    const res = { locals: { nonce: 'nonce123' } } as unknown as Response;

    addNunjucksLocals(req, res, (() => undefined) as NextFunction);

    expect(res.locals.googleAnalytics).toEqual({
      enabled: false,
      googleTagManagerId: 'GTM-TEST123',
    });
    expect(res.locals.globals).toEqual({
      cookiePreferencesCookieName: COOKIE_PREFERENCES_COOKIE_NAME,
      nonce: 'nonce123',
    });

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
