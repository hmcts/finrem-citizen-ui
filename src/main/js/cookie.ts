type CookiePreferenceValue = 'on' | 'off';

const preferencesCookieName = 'finrem-cookie-preferences';
const maxAgeSeconds = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  const key = `${name}=`;
  const cookie = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(key));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(key.length));
}

function parsePreferences(value: string | null): Record<string, CookiePreferenceValue> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as { analytics?: string };
    if (parsed.analytics === 'on' || parsed.analytics === 'off') {
      return { analytics: parsed.analytics };
    }
  } catch {
    return null;
  }

  return null;
}

function savePreferences(analytics: CookiePreferenceValue): void {
  setCookie(preferencesCookieName, JSON.stringify({ analytics }));
}

function setBannerVisibility(hidden: boolean): void {
  const banner = document.querySelector('.cookie-banner') as HTMLElement | null;
  if (banner) {
    banner.hidden = hidden;
  }
}

function setMessageVisibility(selector: string, hidden: boolean): void {
  const message = document.querySelector(selector) as HTMLElement | null;
  if (message) {
    message.hidden = hidden;
  }
}

function showConfirmationMessage(accepted: boolean): void {
  setMessageVisibility('.cookie-banner-message', true);
  setMessageVisibility('.cookie-banner-accept-message', !accepted);
  setMessageVisibility('.cookie-banner-reject-message', accepted);
}

function hideAllCookieBannerMessages(): void {
  setMessageVisibility('.cookie-banner-message', true);
  setMessageVisibility('.cookie-banner-accept-message', true);
  setMessageVisibility('.cookie-banner-reject-message', true);
}

function syncCookiesPage(): void {
  const preferences = parsePreferences(getCookie(preferencesCookieName));
  const analyticsValue: CookiePreferenceValue = preferences?.analytics ?? 'off';

  const radios = document.querySelectorAll<HTMLInputElement>('input[name="analytics"]');
  radios.forEach(radio => {
    radio.checked = radio.value === analyticsValue;
  });
}

function bindCookiePageForm(): void {
  const form = document.querySelector('.cookie-preferences-form') as HTMLFormElement | null;
  if (!form) {
    return;
  }

  syncCookiesPage();

  form.addEventListener('submit', event => {
    event.preventDefault();
    const checked = form.querySelector<HTMLInputElement>('input[name="analytics"]:checked');
    const analytics: CookiePreferenceValue = checked?.value === 'on' ? 'on' : 'off';
    savePreferences(analytics);

    const successMessage = document.querySelector('.cookie-preference-success') as HTMLElement | null;
    if (successMessage) {
      successMessage.style.display = 'block';
      successMessage.focus();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function bindCookieBanner(): void {
  const banner = document.querySelector('.cookie-banner') as HTMLElement | null;
  if (!banner) {
    return;
  }

  const preferences = parsePreferences(getCookie(preferencesCookieName));
  if (preferences?.analytics === 'on' || preferences?.analytics === 'off') {
    setBannerVisibility(true);
    hideAllCookieBannerMessages();
    return;
  }

  setBannerVisibility(false);
  setMessageVisibility('.cookie-banner-message', false);
  setMessageVisibility('.cookie-banner-accept-message', true);
  setMessageVisibility('.cookie-banner-reject-message', true);

  const acceptButton = document.querySelector('.cookie-banner-accept-button') as HTMLButtonElement | null;
  const rejectButton = document.querySelector('.cookie-banner-reject-button') as HTMLButtonElement | null;
  const hideButtons = document.querySelectorAll<HTMLButtonElement>('.cookie-banner-hide-button');

  acceptButton?.addEventListener('click', () => {
    savePreferences('on');
    showConfirmationMessage(true);
  });

  rejectButton?.addEventListener('click', () => {
    savePreferences('off');
    showConfirmationMessage(false);
  });

  hideButtons.forEach(button => {
    button.addEventListener('click', () => {
      setBannerVisibility(true);
      hideAllCookieBannerMessages();
    });
  });
}

export function initCookieBanner(): void {
  bindCookieBanner();
  bindCookiePageForm();
}
