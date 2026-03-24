import { RouteNames } from '../../route-names';
import {getCaseApi} from "../../app/case/case-api";
import { LoggerInstance } from 'winston';
import {getSystemUser} from "../../app/auth/user";
import { SessionData } from "express-session";

export async function getHomePageForUser(accessToken: string, session: SessionData): Promise<string> {
  // Hardcoded for now (later replace with await Abdirahman call)
  const caseReference: string | null = ""; // or null / ""
  const logger: LoggerInstance = console as unknown as LoggerInstance;
  // Check if value exists
  if (caseReference?.trim()) {
    const systemUser = await getSystemUser();

    const caseworkerUserApi = getCaseApi(systemUser, logger);
    session.caseData = await caseworkerUserApi.getCaseById(caseReference);

    console.log("Routing to : ", RouteNames.dashboard);
    return RouteNames.dashboard;
  } else {
    console.log("Routing to : ", RouteNames.enterCaseNumber);
    return RouteNames.enterCaseNumber;
  }
}
