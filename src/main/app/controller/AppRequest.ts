import { Request } from 'express';
import type { LoggerInstance } from 'winston';

import { Case } from '../case/case';
import { CaseApi } from '../case/case-api';
import { CaseRole } from '../case/definition';

export interface AppRequest<T = Partial<Case>> extends Request {
  locals: {
    env: string;
    lang: string;
    logger: LoggerInstance;
    api: CaseApi;
  };
  body: T;
}
export interface UserDetails {
  accessToken: string;
  idToken: string;
  refreshToken: string | undefined;
  sub: string;
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  roles: string[];
  [key: string]: unknown;
  hasNFDCase?: boolean;
  caseRole?: CaseRole;
}
