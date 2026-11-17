import { LocalizedPageContent, SupportedLanguages } from '../../modules/i18n';

const en = {
  title: 'Accessibility statement for Financial Remedy',
  appliesTo: 'This accessibility statement applies to the Financial Remedy service.',
  intro:
    'This website is run by HM Courts & Tribunals Service. We want as many people as possible to be able to use this website. For example, that means you should be able to:',
  capabilityLeadIn: 'You should be able to:',
  capabilityItems: [
    'change colours, contrast levels and fonts',
    'zoom in up to 400% without the text spilling off the screen',
    'navigate most of the website using just a keyboard',
    'navigate most of the website using speech recognition software',
    'listen to most of the website using a screen reader (including the most recent versions of JAWS, NVDA and VoiceOver)',
  ],
  simpleText: "We've also made the website text as simple as possible to understand.",
  abilityNetPrefix: '',
  abilityNetLinkText: 'AbilityNet',
  abilityNetLinkUrl: 'https://mcmw.abilitynet.org.uk/',
  abilityNetSuffix: ' has advice on making your device easier to use if you have a disability.',
  howAccessibleHeading: 'How accessible this website is',
  knownIssuesLeadIn: 'We know some parts of this website are not fully accessible:',
  knownIssues: [
    'some links do not have descriptive accessible names',
    'some heading elements are not consistent',
    'some links may be hard to target with voice commands',
    'focus order may not be logical on some pages',
    'some error messages may not be descriptive',
  ],
  feedbackHeading: 'Feedback and contact information',
  feedbackLeadIn:
    "If you find any problems not listed on this page, think we're not meeting accessibility requirements, or need information in a different format like accessible PDF, large print, easy read, audio recording or braille, contact:",
  feedbackItems: ['email HMCTSFinancialRemedy@justice.gov.uk', 'call 0300 123 5577'],
  responseTime: "We'll consider your request and aim to get back to you within 10 days.",
  enforcementHeading: 'Enforcement procedure',
  enforcementParagraph1:
    "The Equality and Human Rights Commission (EHRC) is responsible for enforcing the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 (the 'accessibility regulations').",
  enforcementParagraph2Prefix: "If you're not happy with how we respond to your complaint, contact the ",
  enforcementLinkText: 'Equality Advisory and Support Service',
  enforcementLinkUrl: 'https://www.equalityadvisoryservice.com/',
  enforcementParagraph2Suffix: '.',
  technicalHeading: "Technical information about this website's accessibility",
  commitment:
    'HMCTS is committed to making its websites accessible, in accordance with the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018.',
  complianceHeading: 'Compliance status',
  complianceText:
    'This website is partially compliant with the WCAG (Web Content Accessibility Guidelines) version 2.2 AA standard, due to the non-compliances listed below.',
  nonAccessibleHeading: 'Non-accessible content',
  nonAccessibleReason: 'The content listed below is non-accessible for the following reason(s):',
  nonComplianceHeading: 'Non-compliance with the accessibility regulations',
  nonComplianceItems: [
    'File upload button name does not update for VoiceOver users to reflect that a file has been added. This may cause confusion for screen reader users who may think the file upload has failed. This fails WCAG 2.2 success criterion 1.3.1 (Info and Relationships).',
    "The main page is missing a level 1 heading and the 'Check your Uploaded Documents' page has a skipped heading level and a heading not marked up. This means that the page structure will appear flat to screen reader users. This fails WCAG 2.2 success criterion 1.3.1 (Info and Relationships).",
    'Focus does not reset to before the skip link when navigating to new pages. This may mean that screen reader users can miss key page content and context provided on page load. Keyboard-only users may have to navigate backwards to navigation options. This fails WCAG 2.2 success criterion 2.4.3 (Focus Order).',
    "'Add document' button name is not an accurate description of action taken. This may cause confusion for users with cognitive disabilities. This fails WCAG 2.2 success criterion 2.4.6 (Headings and labels).",
    'VoiceOver focus is not moved to the error summary after submission of documents. This means that VoiceOver users could be confused as to why a document has not been submitted or be unaware of any errors caused. This fails WCAG 2.2 success criterion 2.4.3 (Focus Order).',
    'No error summary message is present on submit, and no errors are announced to screen reader users. This may prevent screen reader users from finding and fixing mistakes on the page. This fails WCAG 2.2 success criterion 4.1.3 (Status Messages).',
    'The main heading of the dashboard page is not descriptive of page purpose. This may make it difficult for screen reader users to understand the content of the page. This fails WCAG 2.2 success criterion 2.4.6 (Headings and Labels).',
    'Multiple files can have the same name on upload, making it difficult to tell them apart. This makes it difficult for users to tell the differences between the files without redownloading them. This fails WCAG 2.2 success criterion 2.4.4 (Link Purpose) and 1.3.1 (Info and Relationships).',
    'Remove document links do not contain full visible names. This means that voice recognition software users may find it difficult to target links to remove documents. This fails WCAG 2.2 success criterion 2.5.3 (Label in Name).',
    'Repeated, non-unique error messages for missing file uploads. This means some users may find it difficult to understand exactly which documents need to be uploaded to resolve the issue. This fails WCAG 2.2 success criterion 3.3.3 (Error Suggestion).',
    'Table cells in the Date Added column can be left blank for repeated upload dates. This means that some screen reader users may be unable to determine when the file was uploaded due to a lack of clear relationship between the file and the date it was added. This fails WCAG 2.2 success criterion 1.3.1 (Info and Relationships).',
  ],
  improvementHeading: "What we're doing to improve accessibility",
  improvementText:
    'This website is continually tested using accessibility automated tests and basic manual and assistive technology checks. Any new features introduced will also be tested internally or with support from the internal HMCTS accessibility testing team.',
  preparationHeading: 'Preparation of this accessibility statement',
  preparedOn: 'This statement was prepared on 8 October 2026.',
  reviewedOn: 'It was last reviewed on 13 January 2027.',
  testedOn: 'This website was last tested on 22 September 2026.',
  testedBy:
    'The test was carried out by the Internal Accessibility Team within HMCTS.',
} satisfies LocalizedPageContent;

const cy: typeof en = {
  ...en,
  title: 'Datganiad hygyrchedd ar gyfer Financial Remedy',
};

const languages: Record<SupportedLanguages, typeof en> = {
  en,
  cy,
};

export function generateAccessibilityStatementContent(language: SupportedLanguages): typeof en {
  return languages[language] || languages.en;
}
