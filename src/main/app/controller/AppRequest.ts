import { Request } from 'express';
import { Session } from 'express-session';
import type { LoggerInstance } from 'winston';

import { Case, CaseWithId } from '../case/case';
import { CaseApi } from '../case/case-api';

export interface AppRequest<T = Partial<Case>> extends Request {
  session: AppSession;
  locals: {
    env: string;
    lang: string;
    logger: LoggerInstance;
    api: CaseApi;
  };
  body: T;
}

export interface AppSession extends Session {
  user: UserDetails;
  userCase: CaseWithId;
  existingCaseId: string;
  errors: FormError[] | undefined;
}

export interface UserDetails {
  accessToken: string;
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  roles: string[];
}

export type FormError = {
  propertyName: string;
  errorType: string;
};
