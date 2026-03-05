import axios, { AxiosResponse } from 'axios';
import config from 'config';
import { jwtDecode } from 'jwt-decode';
import NodeCache from 'node-cache';


import { APPLICANT_2_CALLBACK_URL, CALLBACK_URL, PageLink, SIGN_IN_URL } from '../../../steps/urls';
import { UserDetails } from '../../controller/AppRequest';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('oidc');

export const idamTokenCache = new NodeCache({ stdTTL: 3600, checkperiod: 1800 });

export const getRedirectUrl = (serviceUrl: string, requestPath: string): string => {
  const id: string = config.get('services.idam.clientID');
  const loginUrl: string = config.get('services.idam.authorizationURL');
  const callbackUrl = encodeURI(serviceUrl + (requestPath === SIGN_IN_URL ? CALLBACK_URL : APPLICANT_2_CALLBACK_URL));

  return `${loginUrl}?client_id=${id}&response_type=code&redirect_uri=${callbackUrl}`;
};

export const getUserDetails = async (
  serviceUrl: string,
  rawCode: string,
  callbackUrlPageLink: PageLink
): Promise<UserDetails> => {
  const callbackUrl = encodeURI(serviceUrl + callbackUrlPageLink);
  const code = encodeURIComponent(rawCode);
  const params = { callbackUrl, code };

  const response: AxiosResponse<OidcResponse> = await getIdamToken(params, params.code);
  const jwt = jwtDecode(response.data.id_token) as IdTokenJwtPayload;

  return {
    accessToken: response.data.access_token,
    id: jwt.uid,
    email: jwt.sub,
    givenName: jwt.given_name,
    familyName: jwt.family_name,
    roles: jwt.roles,
  };
};

export const getSystemUser = async (): Promise<UserDetails> => {
  const username: string = config.get('services.idam.systemUsername');
  const password: string = config.get('services.idam.systemPassword');
  const params = { username, password };

  const response: AxiosResponse<OidcResponse> = await getIdamToken(params, params.username);

  const jwt = jwtDecode(response.data.id_token) as IdTokenJwtPayload;

  return {
    accessToken: response.data.access_token,
    id: jwt.uid,
    email: jwt.sub,
    givenName: jwt.given_name,
    familyName: jwt.family_name,
    roles: jwt.roles,
  };
};

interface IdTokenJwtPayload {
  uid: string;
  sub: string;
  given_name: string;
  family_name: string;
  roles: string[];
}

export interface OidcResponse {
  id_token: string;
  access_token: string;
}

const createIdamToken = (params: Record<string, string>): Promise<AxiosResponse<OidcResponse>> => {
  const id: string = config.get('services.idam.clientID');
  const secret: string = config.get('services.idam.clientSecret');
  const tokenUrl: string = config.get('services.idam.tokenURL');
  const headers = { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' };

  let data = '';
  if (params.username && params.password) {
    data = `grant_type=password&username=${params.username}&password=${params.password}&client_id=${id}&client_secret=${secret}&scope=openid%20profile%20roles%20openid%20roles%20profile`;
  } else if (params.callbackUrl && params.code) {
    data = `client_id=${id}&client_secret=${secret}&grant_type=authorization_code&redirect_uri=${params.callbackUrl}&code=${params.code}`;
  } else {
    throw new Error('Missing data for createIdamToken.');
  }
  console.log("tokenUrl::",tokenUrl)
  return axios.post(tokenUrl, data, { headers });
};

export const getIdamToken = async (
  params: Record<string, string>,
  cacheKey: string
): Promise<AxiosResponse<OidcResponse>> => {
  let response: AxiosResponse<OidcResponse>;
  const isCachingEnabled = String(config.get('services.idam.caching')) === 'true';
  if (isCachingEnabled && idamTokenCache.get(cacheKey) as AxiosResponse<OidcResponse>) {
    response = idamTokenCache.get(cacheKey) as AxiosResponse<OidcResponse>;
  } else if (isCachingEnabled) {
    logger.info('Generating access token and then caching it');
    response = await createIdamToken(params);
    idamTokenCache.set(cacheKey, {
      data: { id_token: response.data.id_token, access_token: response.data.access_token },
    });
  } else {
    response = await createIdamToken(params);
  }

  return response;
};
