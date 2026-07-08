const GOOGLE_ANALYTICS_META_SELECTOR = 'meta[name="google-analytics-id"]';
const GOOGLE_TAG_MANAGER_SCRIPT_ID = 'google-analytics-gtag';
const GOOGLE_TAG_MANAGER_SCRIPT_URL = 'https://www.googletagmanager.com/gtag/js';

type GtagArguments = [string, Date | string, Record<string, unknown>?];

declare global {
  interface Window {
    dataLayer?: GtagArguments[];
    gtag?: (...args: GtagArguments) => void;
  }
}

const getGoogleAnalyticsId = (): string =>
  document.querySelector<HTMLMetaElement>(GOOGLE_ANALYTICS_META_SELECTOR)?.content.trim() || '';

const loadGoogleTagManagerScript = (measurementId: string): void => {
  if (document.getElementById(GOOGLE_TAG_MANAGER_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.id = GOOGLE_TAG_MANAGER_SCRIPT_ID;
  script.src = `${GOOGLE_TAG_MANAGER_SCRIPT_URL}?id=${encodeURIComponent(measurementId)}`;

  document.head.appendChild(script);
};

export const initGoogleAnalytics = (): void => {
  const measurementId = getGoogleAnalyticsId();

  if (!measurementId) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: GtagArguments) => {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  loadGoogleTagManagerScript(measurementId);
};
