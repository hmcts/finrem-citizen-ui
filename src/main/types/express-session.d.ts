import { UserDetails } from '../app/controller/AppRequest';

declare module 'express-session' {
  interface SessionData {
    user?: UserDetails;
    returnTo?: string;
    codeVerifier?: string;
    nonce?: string;
  }
}