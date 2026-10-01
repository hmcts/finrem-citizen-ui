import { afterAll, describe, expect, it, jest } from '@jest/globals';
import config from 'config';
import type { NextFunction, Request, Response } from 'express';
import * as nunjucks from 'nunjucks';
import * as path from 'path';

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
    expect(nextCalled).toBe(true);

    configGetSpy.mockRestore();
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
      return originalConfigGet(key);
    }) as typeof config.get);

    const req = makeReq({ path: '/home' });
    const res = { locals: {} } as Response;

    addNunjucksLocals(req, res, (() => undefined) as NextFunction);

    expect(res.locals.dynatrace).toEqual({
      enabled: true,
      url: DUMMY_DYNATRACE_URL,
    });

    configGetSpy.mockRestore();
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
