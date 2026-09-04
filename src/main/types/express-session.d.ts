import type { CaseRole, FinremCaseData, UserDocumentSelection } from '../app/case/definition';
import { UserDetails } from '../app/controller/AppRequest';

export {};

declare module 'express-session' {
  interface SessionData {
    user?: UserDetails;
    codeVerifier?: string;
    nonce?: string;
    caseNumber?: string;
    caseNumberErrors?: {
      caseNumber?: string;
    };
    tempCaseNumber?: string;
    caseData?: FinremCaseData;
    caseRole?: CaseRole;
    caseUserName?: string;
    caseContextHydratedUserId?: string;
    DocumentSelection?: UserDocumentSelection;
    documents?: UserDocumentSelection;
    uploadErrors?: Record<string, string>;
    preservedContactEmail?: string;
  }
}
