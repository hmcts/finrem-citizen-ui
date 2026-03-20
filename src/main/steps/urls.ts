import { RouteNames } from '../route-names';

export type PageLink = `/${string}`;

export const HOME_URL: PageLink = RouteNames.basePath;
export const CALLBACK_URL: PageLink = '/oauth2/callback';
export const SIGN_IN_URL: PageLink = RouteNames.logout;
export const SIGN_OUT_URL: PageLink = RouteNames.logout;
