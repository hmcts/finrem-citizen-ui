import { getLocalizedContent, type SupportedLanguages } from '../../modules/i18n';

const en = {
  footerLinks: {
    accessibilityStatement: 'Accessibility statement',
    contactUs: 'Contact us',
  },
  contact: {
    defaultEmail: 'HMCTSFinancialRemedy@justice.gov.uk',
    phoneNumber: '0300 123 5577',
    openingHours: 'Monday to Friday, 8.30am to 5pm',
    callChargesText: 'Find out about call charges (opens in new tab)',
    callChargesUrl: 'https://www.gov.uk/call-charges',
  },
};

const cy: typeof en = {
  ...en,
  footerLinks: {
    accessibilityStatement: 'Datganiad Hygyrchedd',
    contactUs: 'Cysylltu â ni',
  },
};

const contentByLanguage: Record<SupportedLanguages, typeof en> = {
  en,
  cy,
};

export function generateCommonContent(language: SupportedLanguages): typeof en {
  return getLocalizedContent(contentByLanguage, language);
}

export function getDefaultContactEmail(language: SupportedLanguages): string {
  return generateCommonContent(language).contact.defaultEmail;
}
