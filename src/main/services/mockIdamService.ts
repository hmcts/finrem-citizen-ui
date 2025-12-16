import { UserDetails } from '../types/session';

/**
 * Mock IDAM Service for local development
 * Simulates IDAM OAuth2 flow without requiring real IDAM service
 */

/**
 * Generate a fake authorization code
 */
export function generateMockAuthCode(): string {
  return 'mock-auth-code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a fake JWT token (base64 encoded JSON)
 * This mimics the structure of a real IDAM JWT but is NOT cryptographically signed
 */
export function generateMockJWT(email: string): string {
  const header = {
    alg: 'none',
    typ: 'JWT'
  };

  const payload = {
    uid: 'mock-user-' + Date.now(),
    sub: email,
    given_name: extractFirstName(email),
    family_name: extractLastName(email),
    roles: ['citizen'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'mock-idam',
    aud: 'finrem_citizen_ui'
  };

  // Base64 encode (not secure, just for mock purposes)
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // No signature for mock JWT (using 'none' algorithm)
  return `${headerB64}.${payloadB64}.mock-signature`;
}

/**
 * Extract first name from email (before @)
 */
function extractFirstName(email: string): string {
  const username = email.split('@')[0];
  const parts = username.split(/[._-]/);
  return parts[0] ? capitalize(parts[0]) : 'Test';
}

/**
 * Extract last name from email (second part before @)
 */
function extractLastName(email: string): string {
  const username = email.split('@')[0];
  const parts = username.split(/[._-]/);
  return parts[1] ? capitalize(parts[1]) : 'User';
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Simulate token exchange (returns mock tokens)
 */
export function mockTokenExchange(email: string) {
  const idToken = generateMockJWT(email);
  const accessToken = 'mock-access-token-' + Date.now();

  return {
    id_token: idToken,
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600
  };
}

/**
 * Extract user details from mock JWT
 */
export function extractMockUserDetails(idToken: string, accessToken: string): UserDetails {
  try {
    // Decode the payload (second part of JWT)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payloadB64 = parts[1];
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    return {
      accessToken: accessToken,
      id: payload.uid,
      email: payload.sub,
      givenName: payload.given_name,
      familyName: payload.family_name,
      roles: payload.roles || ['citizen']
    };
  } catch (error) {
    console.error('Failed to decode mock JWT:', error);

    // Fallback user details
    return {
      accessToken: accessToken,
      id: 'mock-user-fallback',
      email: 'test-cred@hmcts.org',
      givenName: 'Test',
      familyName: 'User',
      roles: ['citizen']
    };
  }
}

/**
 * Validate test credentials (for mock IDAM)
 * In mock mode, we accept:
 * - test-cred@hmcts.org with any password
 * - Any email ending with @hmcts.org with any password
 */
export function validateMockCredentials(email: string, password: string): boolean {
  // For development, accept test credentials
  if (email === 'test-cred@hmcts.org') {
    return true;
  }

  // Also accept any @hmcts.org email for convenience
  if (email && email.endsWith('@hmcts.org') && password && password.length > 0) {
    return true;
  }

  return false;
}
