import { getLocalizedContent, type SupportedLanguages } from '../../modules/i18n';

const en = {
  footerLinks: {
    accessibilityStatement: 'Accessibility statement',
  },
};

const cy: typeof en = {
  footerLinks: {
    accessibilityStatement: 'Datganiad Hygyrchedd',
  }
};

const contentByLanguage: Record<SupportedLanguages, typeof en> = {
  en,
  cy,
};

export function generateCommonContent(language: SupportedLanguages): typeof en {
  return getLocalizedContent(contentByLanguage, language);
}
