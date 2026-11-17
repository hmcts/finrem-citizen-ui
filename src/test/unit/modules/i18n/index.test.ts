import { describe, expect, it, jest } from '@jest/globals';
import type { Request, Response } from 'express';

import { renderLocalizedView, resolveLanguage } from '../../../../main/modules/i18n';

describe('resolveLanguage', () => {
  it('returns english when language is set to en', () => {
    const req = { session: { lang: 'en' } } as unknown as Request;

    expect(resolveLanguage(req)).toBe('en');
  });

  it('returns english when language is missing', () => {
    const req = {} as Request;

    expect(resolveLanguage(req)).toBe('en');
  });

  it('returns welsh when language is set to cy', () => {
    const req = { session: { lang: 'cy' } } as unknown as Request;

    expect(resolveLanguage(req)).toBe('cy');
  });

  it('returns english for unsupported language', () => {
    const req = { session: { lang: 'es' } } as unknown as Request;

    expect(resolveLanguage(req)).toBe('en');
  });
});

describe('renderLocalizedView', () => {
  it('renders template using page content and common content', () => {
    const req = { session: { lang: 'cy' } } as unknown as Request;
    const render = jest.fn();
    const res = { render } as unknown as Response;

    renderLocalizedView(
      req,
      res,
      'test-view',
      (language, request) => ({
        title: `Title ${language}`,
        requestMatched: request === req,
        footerLinks: { accessibilityStatement: 'Page override' },
      })
    );

    expect(render).toHaveBeenCalledWith(
      'test-view',
      expect.objectContaining({
        title: 'Title cy',
        requestMatched: true,
        footerLinks: { accessibilityStatement: 'Page override' },
        htmlLang: 'cy',
      })
    );
  });

  it('does not allow extra locals to override htmlLang', () => {
    const req = { session: { lang: 'en' } } as unknown as Request;
    const render = jest.fn();
    const res = { render } as unknown as Response;

    renderLocalizedView(
      req,
      res,
      'test-view',
      () => ({ title: 'Page title' })
    );

    expect(render).toHaveBeenCalledWith(
      'test-view',
      expect.objectContaining({
        htmlLang: 'en',
      })
    );
  });
});
