import type { CaseRole, FinremCaseData } from '../app/case/definition';
import { UserDetails } from '../app/controller/AppRequest';

export {};

declare module 'express-session' {
interface SessionData {
    user?: UserDetails;
    returnTo?: string;
    codeVerifier?: string;
    nonce?: string;
    caseData?: FinremCaseData;
    caseRole?: CaseRole;
    caseUserName?: string;
  }
}
