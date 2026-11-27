import type { Request } from 'express';

import { getDefaultContactEmail } from '../../content/common/content';
import { resolveLanguage } from '../../modules/i18n';

export function resolveContactEmail(req: Request): string {
  return (
    req.session?.preservedContactEmail
    || req.session?.caseData?.consentOrderFRCEmail
    || getDefaultContactEmail(resolveLanguage(req))
  );
}
