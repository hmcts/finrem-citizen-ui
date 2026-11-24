import { SupportedLanguages } from '../../../main/modules/i18n';

export function expectLocalizedContentContract<T>(
  generateContent: (language: SupportedLanguages) => T,
  assertEnglish: (content: T) => void,
  assertWelsh: (content: T) => void
): void {
  const english = generateContent(SupportedLanguages.En);
  const welsh = generateContent(SupportedLanguages.Cy);

  assertEnglish(english);
  assertWelsh(welsh);
}
