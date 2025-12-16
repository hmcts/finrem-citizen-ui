import axios, { AxiosResponse } from 'axios';
import jwt_decode from 'jwt-decode';
import config from 'config';
import { UserDetails } from '../types/session';
import { OidcResponse, IdTokenJwtPayload } from '../types/oidc';

/**
 * Exchange OAuth2 authorization code for tokens
 *
 * @param code - Authorization code from IDAM callback
 * @returns Promise with id_token and access_token
 */
export async function exchangeCodeForTokens(code: string): Promise<OidcResponse> {
  // Read IDAM config
  const useMockIdam = config.get<boolean>('services.idam.useMockIdam');
  const clientId = config.get<string>('services.idam.clientID');
  const clientSecret = config.get<string>('services.idam.clientSecret');
  const tokenUrl = config.get<string>('services.idam.tokenURL');
  const callbackUrl = config.get<string>('services.idam.callbackURL');

  // Use mock IDAM token endpoint if enabled (HTTPS for local server)
  const actualTokenUrl = useMockIdam
    ? 'https://localhost:3100/mock-idam/o/token'
    : tokenUrl;

  // Prepare form data (URL encoded)
  const formData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: callbackUrl,
    code: code,
  });

  // Prepare headers
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Axios config - reject unauthorized certs in development for self-signed SSL
  const axiosConfig = {
    headers,
    ...(useMockIdam && { httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) })
  };

  try {
    console.log(`Token exchange with ${useMockIdam ? 'Mock' : 'Real'} IDAM`);

    // Make POST request to IDAM token endpoint (real or mock)
    const response: AxiosResponse<OidcResponse> = await axios.post(
      actualTokenUrl,
      formData.toString(),
      axiosConfig
    );

    return response.data;
  } catch (error) {
    // Log error for debugging
    console.error('IDAM token exchange failed:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Extract user details from OIDC response by decoding JWT
 *
 * @param oidcResponse - Response from IDAM token endpoint
 * @returns UserDetails object
 */
export function extractUserDetails(oidcResponse: OidcResponse): UserDetails {
  // Decode the JWT id_token (no signature verification, just decode)
  const payload: IdTokenJwtPayload = jwt_decode(oidcResponse.id_token);

  // Map JWT claims to UserDetails interface
  return {
    accessToken: oidcResponse.access_token,
    id: payload.uid,
    email: payload.sub,
    givenName: payload.given_name,
    familyName: payload.family_name,
    roles: payload.roles,
  };
}
