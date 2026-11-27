import { getLocalizedContent, LocalizedPageContent, SupportedLanguages } from '../../modules/i18n';

const en = {
  title: 'Contact us',
  emailHeading: 'Email',
  telephoneHeading: 'Telephone',
  openingHoursHeading: 'Opening times'
} satisfies LocalizedPageContent;

const cy: typeof en = {
  ...en,
  title: 'Cysylltu â ni',
};

const contentByLanguage: Record<SupportedLanguages, typeof en> = {
  en,
  cy,
};

export function generateContactUsContent(language: SupportedLanguages): typeof en {
  return getLocalizedContent(contentByLanguage, language);
}
