import { Request } from 'express';
import { Session } from 'express-session';

/**
 * Extended Express Request with typed session
 */
export interface AppRequest extends Request {
  session: AppSession;
}

/**
 * Extended Express Session with user details and case data
 */
export interface AppSession extends Session {
  user?: UserDetails;
  caseNumber?: string;
  accessCode?: string;
  caseLinked?: boolean;
  caseData?: CaseData;
}

/**
 * User details extracted from IDAM JWT token
 */
export interface UserDetails {
  accessToken: string;
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  roles: string[];
}

/**
 * Case data linked to the user
 */
export interface CaseData {
  caseNumber: string;
  accessCode: string;
  caseId: string;
  caseType: string;
  applicantName: string;
  respondentName: string;
  caseStatus: string;
  createdDate: string;
  lastModified: string;
}
