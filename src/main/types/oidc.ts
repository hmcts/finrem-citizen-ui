/**
 * OIDC token response from IDAM
 */
export interface OidcResponse {
  id_token: string;
  access_token: string;
}

/**
 * JWT payload structure from IDAM id_token
 */
export interface IdTokenJwtPayload {
  uid: string;
  sub: string;
  given_name: string;
  family_name: string;
  roles: string[];
  iat?: number;
}
