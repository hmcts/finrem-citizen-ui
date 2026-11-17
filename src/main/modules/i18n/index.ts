import { Request, Response } from 'express';

import { generateCommonContent } from '../../content/common/content';

export function renderLocalizedView(
  req: Request,
  res: Response,
  viewName: string,
  generatePageContent: (language: SupportedLanguages, req: Request) => LocalizedContent
): void {
  const language = resolveLanguage(req);
  const commonContent = generateCommonContent(language);
  const pageContent = generatePageContent(language, req);

  res.render(viewName, {
    ...commonContent,
    ...pageContent,
    htmlLang: language,
  });
}

export function resolveLanguage(req: Request): SupportedLanguages {
  const language = req.session?.lang;
  return language && supportedLanguages.has(language) ? language : SupportedLanguages.En;
}

export function getLocalizedContent<T>(
  languages: Record<SupportedLanguages, T>,
  language: SupportedLanguages
): T {
  return languages[language] || languages[SupportedLanguages.En];
}

export enum SupportedLanguages {
  En = 'en',
  Cy = 'cy',
}

const supportedLanguages = new Set<SupportedLanguages>([SupportedLanguages.En, SupportedLanguages.Cy]);


type LocalizedContent = Record<string, unknown>;

export type LocalizedPageContent = {
  title: string;
} & LocalizedContent;
