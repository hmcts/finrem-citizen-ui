export {};

declare module 'express-session' {
  interface SessionData {
    user?: {
      accessToken: string;
      idToken: string;
      refreshToken: string | undefined;
      sub: string;
      [key: string]: unknown;
    };
    returnTo?: string;
    codeVerifier?: string;
    nonce?: string;
  }
}
