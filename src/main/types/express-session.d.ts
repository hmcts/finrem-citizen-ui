import type { CaseRole, FinremCaseData } from '../app/case/definition';

export {};

declare module 'express-session' {
  interface SessionData {
    user?: {
      accessToken: string;
      idToken: string;
      refreshToken: string | undefined;
      sub: string;
      [key: string]: unknown;
    };
    returnTo?: string;
    codeVerifier?: string;
    nonce?: string;
    caseData?: FinremCaseData;
    caseRole?: CaseRole;
  }
}
