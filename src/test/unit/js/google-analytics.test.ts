/**
 * @jest-environment jsdom
 */

import { initGoogleAnalytics } from '../../../main/js/google-analytics';

describe('initGoogleAnalytics', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete window.dataLayer;
    delete window.gtag;
  });

  it('does not load Google Analytics when no measurement id is configured', () => {
    initGoogleAnalytics();

    expect(document.getElementById('google-analytics-gtag')).toBeNull();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it('loads gtag and queues the initial page view when a measurement id is configured', () => {
    document.head.innerHTML = '<meta name="google-analytics-id" content="G-1234567890">';

    initGoogleAnalytics();

    const script = document.getElementById('google-analytics-gtag') as HTMLScriptElement;

    expect(script).not.toBeNull();
    expect(script.async).toBe(true);
    expect(script.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-1234567890');
    expect(window.dataLayer).toEqual([
      ['js', expect.any(Date)],
      ['config', 'G-1234567890'],
    ]);
  });

  it('does not add a second gtag script when initialised more than once', () => {
    document.head.innerHTML = '<meta name="google-analytics-id" content="G-1234567890">';

    initGoogleAnalytics();
    initGoogleAnalytics();

    expect(document.querySelectorAll('#google-analytics-gtag')).toHaveLength(1);
  });
});
