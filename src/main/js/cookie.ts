import cookieManager from '@hmcts/cookie-manager';

const preferencesCookieName = 'cookie-preferences';

cookieManager.on('UserPreferencesLoaded', preferences => {
  const dataLayer = window.dataLayer || [];
  dataLayer.push({ event: 'Cookie Preferences', cookiePreferences: preferences });
});

cookieManager.on('UserPreferencesSaved', preferences => {
  const dataLayer = window.dataLayer || [];
  const dtrum = window.dtrum;

  dataLayer.push({ event: 'Cookie Preferences', cookiePreferences: preferences });

  if (dtrum !== undefined) {
    if (preferences.apm === 'on') {
      dtrum.enable();
      dtrum.enableSessionReplay();
    } else {
      dtrum.disableSessionReplay();
      dtrum.disable();
    }
  }
});

cookieManager.on('PreferenceFormSubmitted', () => {
  const message = document.querySelector('.cookie-preference-success') as HTMLElement | null;
  if (!message) {
    return;
  }

  message.style.display = 'block';
  message.focus();
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
});

export function initCookieBanner(): void {
  cookieManager.init({
    userPreferences: {
      cookieName: preferencesCookieName,
      cookieSecure: window.location.protocol === 'https:',
    },
    cookieManifest: [
      {
        categoryName: 'essential',
        optional: false,
        cookies: [preferencesCookieName],
      },
      {
        categoryName: 'analytics',
        cookies: ['_ga', '_gid', '_gat'],
      },
      {
        categoryName: 'apm',
        cookies: ['dtCookie', 'dtLatC', 'dtPC', 'dtSa', 'dtValidationCookie', 'dtDisabled', 'rxVisitor', 'rxvt'],
      },
    ],
  });
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    dtrum: DtrumApi;
  }
}

interface DtrumApi {
  enable(): void;
  enableSessionReplay(): void;
  disable(): void;
  disableSessionReplay(): void;
}
