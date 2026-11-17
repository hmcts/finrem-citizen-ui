import { Request, Response } from 'express';

import { generateCommonContent } from '../../content/common/content';

export enum SupportedLanguages {
  En = 'en',
  Cy = 'cy',
}

const supportedLanguages = new Set<SupportedLanguages>([SupportedLanguages.En, SupportedLanguages.Cy]);

export function resolveLanguage(req: Request): SupportedLanguages {
  const language = req.session?.lang;
  return language && supportedLanguages.has(language) ? language : SupportedLanguages.En;
}

type LocalizedContent = Record<string, unknown>;

export type LocalizedPageContent = {
  title: string;
} & LocalizedContent;

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
