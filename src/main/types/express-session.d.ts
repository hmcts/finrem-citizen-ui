import type { CaseRole, FinremCaseData } from '../app/case/definition';
import { UserDetails } from '../app/controller/AppRequest';
import type { UploadJourneyData } from '../upload-journey/config';

export {};

declare module 'express-session' {
  interface SessionData {
    user?: UserDetails;
    returnTo?: string;
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
    uploadJourneyData?: UploadJourneyData;
    uploadedDocuments?: string[];
  }
}
